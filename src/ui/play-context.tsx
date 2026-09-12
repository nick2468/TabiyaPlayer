import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { StockfishEngine, splitMove, strengthProfile, type Engine } from '../engine'
import { sanForMove } from '../model/moves'
import { positionKey, sideToMove } from '../model/position'
import type { Colour } from '../model/types'
import {
  ANALYSIS_MOVETIME,
  HINT_MOVETIME,
  PlaySession,
  atAnalysisProfile,
  engineHint,
  evaluationOf,
  type Evaluation,
  type Hint,
} from '../play'
import { forgetGame, rememberGame } from '../storage/current-game'
import { asMessage } from './message'

/**
 * Origin: London src/ui/play-context.tsx, adapted: the game and nothing about reviewing or recording it; setLevel and the remembered game are new; New game keeps the worker; the worker's stop waits out StrictMode.
 * The running game, held above the screen that shows it.
 *
 * A game is not part of a screen; it is a thing the app is doing. So it lives
 * here, and the screen reads it.
 *
 * One worker for the life of the app (spec S5). New game tells the engine a
 * new game has begun rather than stopping it and starting another, which cost
 * the trainer a second of "Starting the engine" each time. The worker is
 * stopped when this provider goes away, and by nothing else.
 */

/** What a game needs to know about itself when it starts. */
export interface StartOptions {
  level: number
  side: Colour
  /** Moves already played, replayed before the game goes on. */
  startMoves?: string[]
}

export interface PlayGame {
  session: PlaySession | null
  /** The strength the engine is playing at. */
  level: number | null
  /** The colour the user plays in the running game. */
  side: Colour | null
  thinking: boolean
  engineError: string | null
  /** The bar's evaluations by position (spec section 7). */
  evaluations: Map<string, Evaluation>
  /** The move being suggested, until something moves the board. */
  hint: Hint | null
  /** A game exists and has not ended. */
  inProgress: boolean
  /** Whether Hint has anything to answer right now (spec section 8). */
  canHint: boolean
  start: (options: StartOptions) => Promise<void>
  play: (from: string, to: string, promotion?: string) => Promise<void>
  undo: () => void
  redo: () => void
  askHint: () => Promise<void>
  /** Changes the level from the engine's next move on (spec S6). */
  setLevel: (level: number) => Promise<void>
}

/**
 * Exported so a test can hand a screen a game without playing one.
 *
 * The lint rule below wants a context in its own file for fast refresh, and
 * the cost of obeying it is a module whose only job is to break a cycle.
 */
// eslint-disable-next-line react/only-export-components
export const PlayContext = createContext<PlayGame | null>(null)

/**
 * How the provider gets an engine.
 *
 * Injected rather than built, so the DOM tests can hand it a fake. `PlaySession`
 * takes its engine the same way, and the trainer's provider was the one place
 * in the chain without the seam: three identity bugs lived there because
 * nothing could reach it without starting a worker.
 */
export type CreateEngine = () => Engine

function usePlayValue(createEngine: CreateEngine): PlayGame {
  const [session, setSession] = useState<PlaySession | null>(null)
  // What the game was started with. In state as well as in a ref, because the
  // screen renders from it and a ref read during render would not update.
  const [setup, setSetup] = useState<StartOptions | null>(null)
  // The session is a mutable object, so playing, undoing and redoing change
  // nothing React can see. Bumping this counter is what says something has
  // happened. The value below is rebuilt on every render, so that is all it
  // takes; see the note there for why it is not memoised.
  const [, setTick] = useState(0)
  const [thinking, setThinking] = useState(false)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [evaluations, setEvaluations] = useState<Map<string, Evaluation>>(() => new Map())
  const [hint, setHint] = useState<Hint | null>(null)

  const engineRef = useRef<Engine | null>(null)
  const sessionRef = useRef<PlaySession | null>(null)
  const setupRef = useRef<StartOptions | null>(null)
  // The same map as the state above, read at the moment a search answers
  // rather than at the moment the callback was built. Two evaluations in flight
  // from one move would otherwise each start from the map their own render saw,
  // and the second would write the first one out again.
  const evaluationsRef = useRef<Map<string, Evaluation>>(new Map())
  /**
   * Analysis nobody is waiting for: the number undo and redo fetch for the
   * position they land on (ruled at gate 4).
   *
   * It is deliberately not behind `thinking`, so undo stays instant and the
   * number arrives a moment later. That leaves it in flight while the user does
   * something else, and the something else can be a move. `atAnalysisProfile`
   * sets the analysis profile, searches, and puts the playing level back, and
   * each of those is its own turn on the engine's queue: a move asked for
   * between the first and the last would be played at level 8. So everything
   * that asks the engine to MOVE waits for this to settle first, which costs
   * nothing in the ordinary case because it has already settled.
   */
  const quietRef = useRef<Promise<void>>(Promise.resolve())

  // The worker goes when the app goes, and not before.
  //
  // StrictMode unmounts and mounts every effect once in development, and the
  // first game starts in an effect. A stop that ran at once took the engine
  // out from under that game before it had started. So the stop waits a tick
  // and goes ahead only if nothing mounted again in the meantime.
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      setTimeout(() => {
        if (mounted.current) return
        engineRef.current?.stop()
        engineRef.current = null
      }, 0)
    }
  }, [])

  const refresh = useCallback(() => setTick((count) => count + 1), [])

  /**
   * Writes the game down, so the app reopens on it (spec 10).
   *
   * One place that knows the record's shape, called after everything that
   * changes the game: the user's move, the engine's reply, undo, redo, a new
   * game and a level change. A game with no moves is not worth reopening, so a
   * fresh one takes the record away rather than storing an empty one.
   *
   * Writing after the user's move AND again after the reply is deliberate. A
   * page closed while the engine is thinking reopens on the position before the
   * reply, and `start` finds the engine to move and plays it, which is the same
   * game arriving a moment later.
   */
  const rememberNow = useCallback(() => {
    const running = sessionRef.current
    const setup = setupRef.current
    if (!running || !setup) return
    if (running.moves.length === 0) {
      forgetGame()
      return
    }
    rememberGame({
      version: 1,
      sans: running.moves.map((move) => move.san),
      side: setup.side,
      level: setup.level,
    })
  }, [])

  const engine = useCallback(async (): Promise<Engine> => {
    if (!engineRef.current) engineRef.current = createEngine()
    await engineRef.current.start()
    return engineRef.current
  }, [createEngine])

  /**
   * Origin: London src/ui/play-context.tsx evaluate, adapted: the map holds an Evaluation, sideToMove is the model's, and there is no best move to keep.
   * Evaluates a position for the bar, at the analysis profile (spec 6.3).
   *
   * A position already known is not searched again, which is what makes undo
   * and redo free: every position they land on has been here before.
   *
   * The trainer also keeps the engine's move from this search, for a report
   * that names a better move than the one played. There is no report here, so
   * there is nothing to keep.
   */
  const evaluate = useCallback(async (running: Engine, fen: string, playing: number) => {
    const key = positionKey(fen)
    if (evaluationsRef.current.has(key)) return
    const result = await atAnalysisProfile(running, playing, () =>
      running.search(fen, ANALYSIS_MOVETIME),
    )
    const best = result.candidates[0]
    if (!best) return
    // The engine's score is from the side to move and the bar's number is from
    // White's, so the side is read here, where it is still known.
    const next = new Map(evaluationsRef.current)
    next.set(key, evaluationOf(best.score, sideToMove(fen)))
    evaluationsRef.current = next
    setEvaluations(next)
  }, [])

  /**
   * Brings the bar up to date for a position undo or redo just landed on, when
   * that position has no number yet (spec 9.2, amended at gate 4).
   *
   * A game played forward costs nothing extra, because `evaluate` skips a
   * position it already knows and every position played through is already
   * known. A game loaded from a file or reopened from storage is evaluated at
   * its final position only, so undoing along it is where the numbers get
   * fetched, 150 ms at a time, and never in a batch that holds the engine's
   * queue while the user waits to move.
   *
   * Nothing awaits this and nothing greys while it runs. A failure is still
   * worth saying: an engine that has stopped answering will say so here before
   * the user finds out by trying to move.
   */
  const evaluateLanded = useCallback(
    (running: PlaySession) => {
      const live = engineRef.current
      const setup = setupRef.current
      if (!live || !setup) return
      quietRef.current = quietRef.current
        .then(() => evaluate(live, running.fen, setup.level))
        .then(refresh, (error: unknown) => setEngineError(asMessage(error)))
    },
    [evaluate, refresh],
  )

  const start = useCallback(
    async (options: StartOptions) => {
      setEngineError(null)
      setThinking(true)
      setHint(null)
      evaluationsRef.current = new Map()
      setEvaluations(new Map())
      try {
        const profile = strengthProfile(options.level)
        const running = await engine()
        await running.newGame()
        await running.setStrength(profile)
        const fresh = new PlaySession({
          engine: running,
          profile,
          side: options.side,
          startMoves: options.startMoves,
        })
        setupRef.current = options
        setSetup(options)
        sessionRef.current = fresh
        setSession(fresh)
        // Dev-only handle on the running game, so a browser check can read the
        // state the session actually holds rather than guess from the screen.
        if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__game = fresh
        refresh()
        // The engine moves first when the user plays Black.
        if (!fresh.userToMove && !fresh.isFinished()) await fresh.playEngine()
        rememberNow()
        refresh()
        // The bar starts on the position the user is actually looking at, which
        // is after the engine's opening move when they play Black. A game
        // reopened from storage is evaluated at its final position only; the
        // rest of its positions are behind it and nothing draws them.
        await evaluate(running, fresh.fen, options.level)
        refresh()
      } catch (error) {
        setEngineError(asMessage(error))
      } finally {
        setThinking(false)
      }
    },
    [engine, evaluate, refresh, rememberNow],
  )

  const play = useCallback(
    async (from: string, to: string, promotion?: string) => {
      const running = sessionRef.current
      const setup = setupRef.current
      if (!running || !setup || thinking || running.isFinished()) return
      const san = sanForMove(running.fen, from, to, promotion)
      if (!san || !running.playUser(san)) return
      // A hint is about the position it was asked in, so it goes with it.
      setHint(null)
      rememberNow()
      refresh()
      setThinking(true)
      try {
        // An undo's evaluation may still be in flight, and the engine is at the
        // analysis profile until it finishes. See `quietRef`.
        await quietRef.current
        // The bar is brought up to date before the engine is asked to move, so
        // it answers the move that was just played rather than the reply.
        const live = engineRef.current
        if (live) await evaluate(live, running.fen, setup.level)
        refresh()
        if (running.isFinished()) return
        await running.playEngine()
        rememberNow()
        refresh()
        if (live) await evaluate(live, running.fen, setup.level)
        refresh()
      } catch (error) {
        setEngineError(asMessage(error))
      } finally {
        setThinking(false)
      }
    },
    [evaluate, refresh, rememberNow, thinking],
  )

  /**
   * Undo and redo. Both are instant: they move the game and the screen at once
   * and do not wait for the engine.
   *
   * A position played through already has its number, so the bar follows them
   * for free. A position from a loaded or reopened game does not, and that is
   * what `evaluateLanded` goes and gets, behind them rather than in front.
   */
  const undo = useCallback(() => {
    const running = sessionRef.current
    if (!running || thinking) return
    if (running.undo()) {
      setHint(null)
      rememberNow()
      refresh()
      evaluateLanded(running)
    }
  }, [evaluateLanded, refresh, rememberNow, thinking])

  const redo = useCallback(() => {
    const running = sessionRef.current
    if (!running || thinking) return
    if (running.redo()) {
      setHint(null)
      rememberNow()
      refresh()
      evaluateLanded(running)
    }
  }, [evaluateLanded, refresh, rememberNow, thinking])

  /**
   * Origin: London src/ui/play-context.tsx askHint, adapted: the engine half only, and the SAN comes from sanForMove.
   * What to play here (spec section 8).
   *
   * The trainer answers from its authored lines first and only searches once
   * they run out. This app has none, so every hint is a search, and it goes
   * through the same one-at-a-time queue as everything else with the
   * playing profile restored in a `finally`, exactly as `evaluate` does. A hint
   * that left the engine at level 8 would quietly change the game it was meant
   * to help with.
   *
   * Longer than an evaluation, because somebody is waiting on this one.
   */
  const askHint = useCallback(async () => {
    const running = sessionRef.current
    const setup = setupRef.current
    if (!running || !setup || thinking) return
    if (!running.userToMove || running.isFinished()) return

    setThinking(true)
    try {
      // As `play`, the other way round: an undo's number may still be in
      // flight, and its restore would land between this hint's setStrength and
      // its search, answering at the game's level instead of full strength.
      // See `quietRef`.
      await quietRef.current
      const live = await engine()
      const result = await atAnalysisProfile(live, setup.level, () =>
        live.search(running.fen, HINT_MOVETIME),
      )
      const best = result.candidates[0]?.move ?? result.bestMove
      if (!best) return
      // The engine speaks coordinates and the sentence names a move, so the
      // two squares go through the one place that turns them into SAN.
      const { from, to, promotion } = splitMove(best)
      const san = sanForMove(running.fen, from, to, promotion)
      if (!san) return
      setHint(engineHint(san))
      refresh()
    } catch (error) {
      setEngineError(asMessage(error))
    } finally {
      setThinking(false)
    }
  }, [engine, refresh, thinking])

  /**
   * A new level, heard by the engine's next move (spec S6).
   *
   * The session reads its profile at each search, and the engine is told the
   * new strength through its own queue. A change made while the engine is
   * already thinking lands after that search, so it is the move after that
   * one which plays at the new level.
   */
  const setLevel = useCallback(
    async (level: number) => {
      const current = setupRef.current
      if (!current) return
      const next = { ...current, level }
      setupRef.current = next
      setSetup(next)
      // The game carries its own level, so a game reopened after a mid-game
      // change comes back at the level it was being played at, not the one it
      // started at.
      rememberNow()
      const profile = strengthProfile(level)
      sessionRef.current?.setProfile(profile)
      try {
        await engineRef.current?.setStrength(profile)
      } catch (error) {
        setEngineError(asMessage(error))
      }
    },
    [rememberNow],
  )

  // A fresh object every render, deliberately, with no useMemo around it.
  //
  // The children of a provider are the same element from one render to the
  // next, so React skips them unless the context VALUE changes. Memoising
  // this made that value survive a render, and a memo has to list everything
  // that can change: the counter above is not a field of the value, so it was
  // easy to leave out, and leaving it out meant undo moved the game and not
  // the screen. It was caught by playing a game, not by anything else.
  //
  // Rebuilding it instead is one object per render of a provider that only
  // renders when something has actually happened, and the whole failure mode
  // goes with the memo.
  return {
    session,
    level: setup?.level ?? null,
    side: setup?.side ?? null,
    thinking,
    engineError,
    evaluations,
    hint,
    inProgress: session !== null && !session.isFinished(),
    // Only on the user's own move, in a game that is still going, with nothing
    // in flight: a hint about a position the engine is about to change is an
    // arrow pointing at the wrong board (spec section 8).
    canHint: session !== null && !thinking && session.userToMove && !session.isFinished(),
    start,
    play,
    undo,
    redo,
    askHint,
    setLevel,
  }
}

/** The real one: a Stockfish worker, made once the first game needs it. */
const realEngine: CreateEngine = () => new StockfishEngine()

export function PlayProvider({
  children,
  createEngine = realEngine,
}: {
  children: React.ReactNode
  /** Overridden by the DOM tests, which must never start a worker. */
  createEngine?: CreateEngine
}) {
  const value = usePlayValue(createEngine)
  return <PlayContext value={value}>{children}</PlayContext>
}

/**
 * The running game, for any component under the provider. A hook beside the
 * provider it reads, for the same reason `PlayContext` is: splitting them
 * would buy fast refresh a file whose only job is to break a cycle.
 */
// eslint-disable-next-line react/only-export-components
export function usePlay(): PlayGame {
  const value = useContext(PlayContext)
  if (!value) throw new Error('usePlay needs a PlayProvider above it')
  return value
}
