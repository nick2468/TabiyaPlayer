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
  buildReport,
  engineHint,
  evaluationOf,
  scanGame,
  stoppedAt,
  type BestMoves,
  type Evaluation,
  type GameReport,
  type Hint,
} from '../play'
import { forgetGame, rememberGame } from '../storage/current-game'
import { asMessage } from './message'

/**
 * Origin: London src/ui/play-context.tsx, adapted: the game and its review, with nothing about recording one; setLevel and the remembered game are new; New game keeps the worker; the worker's stop waits out StrictMode.
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
  /** The report on the game that has been stopped and reviewed (spec 18.5). */
  report: GameReport | null
  /**
   * Where a reviewed game's viewer is standing, as a count of moves played, or
   * null when nobody has stepped it and it shows the end (spec 18.4).
   *
   * View state only: it never touches the session's moves. It lives here rather
   * than on the screen so that every path which puts the report away can clear
   * it in the same breath, and no path can leave the viewer pointing into a
   * game that is gone.
   */
  replayPly: number | null
  setReplayPly: (ply: number | null) => void
  /** How far the review's scan has got, while it runs (spec 18.3). */
  scanning: { done: number; total: number } | null
  /** A game exists, has not ended and has not been reviewed. */
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
  /** Stop and review: scans the game and builds the report (spec 18.3). */
  finish: () => Promise<void>
  /**
   * True when a reviewed game can be carried on: it was stopped rather than
   * ended. A checkmate or a draw has nothing to play.
   */
  canResume: boolean
  /** Keep playing: puts the report away and hands the board back (spec 18.4). */
  resume: () => void
  /**
   * Stop and discard: the game goes, and a fresh one starts (spec 18.3). The
   * options are the fresh game's, because the settings beside the board are
   * what a new game is played at (spec 5.1).
   */
  discard: (options: StartOptions) => void
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
  const [report, setReport] = useState<GameReport | null>(null)
  const [replayPly, setReplayPly] = useState<number | null>(null)
  const [scanning, setScanning] = useState<{ done: number; total: number } | null>(null)

  const engineRef = useRef<Engine | null>(null)
  const sessionRef = useRef<PlaySession | null>(null)
  const setupRef = useRef<StartOptions | null>(null)
  // The same map as the state above, read at the moment a search answers
  // rather than at the moment the callback was built. Two evaluations in flight
  // from one move would otherwise each start from the map their own render saw,
  // and the second would write the first one out again.
  const evaluationsRef = useRef<Map<string, Evaluation>>(new Map())
  /**
   * The engine's move at each position, from the same search as the number, so
   * a game reviewed after the bar has seen it carries the same facts as one
   * scanned from scratch. It sits beside the evaluations rather than inside
   * them so that everything reading a number keeps reading a number. A ref
   * only: nothing renders from it, and the report takes it at review time.
   */
  const bestMovesRef = useRef<BestMoves>(new Map())
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
   * Origin: London src/ui/play-context.tsx evaluate, adapted: the map holds an Evaluation and sideToMove is the model's.
   * Evaluates a position for the bar, at the analysis profile (spec 6.3).
   *
   * A position already known is not searched again, which is what makes undo
   * and redo free: every position they land on has been here before.
   *
   * The engine's move is kept from the same search, for a report that names
   * what was better than the move that was played (spec 18.5).
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
    const move = result.bestMove ?? best.move
    if (move) bestMovesRef.current.set(key, move)
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
   *
   * Both are disabled during a review, as the trainer's are (spec 18.4), and
   * while a scan runs: the scan is holding the engine at the analysis profile,
   * and an undo's own evaluation landing in the middle of it would put the
   * playing level back for the rest of the scan.
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
      // New game, Load game, Play from here and a game reopened from storage
      // all come through here, so all of them put a report away: the report is
      // about the game that has just been replaced. The viewer's position goes
      // with it, because a ply counted in the old game means nothing in this
      // one (spec 18.4).
      setReport(null)
      setReplayPly(null)
      evaluationsRef.current = new Map()
      bestMovesRef.current = new Map()
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
      // A report locks the board as firmly as an ended game does: the report is
      // about the game as it stands (spec 18.4).
      if (!running || !setup || thinking || report || running.isFinished()) return
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
    [evaluate, refresh, rememberNow, report, thinking],
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
    if (!running || thinking || report) return
    if (running.undo()) {
      setHint(null)
      rememberNow()
      refresh()
      evaluateLanded(running)
    }
  }, [evaluateLanded, refresh, rememberNow, report, thinking])

  const redo = useCallback(() => {
    const running = sessionRef.current
    if (!running || thinking || report) return
    if (running.redo()) {
      setHint(null)
      rememberNow()
      refresh()
      evaluateLanded(running)
    }
  }, [evaluateLanded, refresh, rememberNow, report, thinking])

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
      // Counted where the hint is actually GIVEN, not where it is asked for:
      // a search that answered nothing left the user no better off, and the
      // report would be saying a game was played with help it never had.
      running.hints += 1
      setHint(engineHint(san))
      refresh()
    } catch (error) {
      setEngineError(asMessage(error))
    } finally {
      setThinking(false)
    }
  }, [engine, refresh, thinking])

  /**
   * Origin: London src/ui/play-context.tsx finish, adapted: no record, no timestamp and no history, and the scan is wrapped in atAnalysisProfile.
   * Stop and review: scans the game and builds the report (spec 18.3).
   *
   * The scan holds the engine while the user waits, and that is why the button
   * says how far it has got. It is deliberately not behind `quietRef`'s
   * fire-and-forget path: a report is something the user asked for and is
   * waiting on, unlike the number undo fetches.
   *
   * It does wait for `quietRef` first, though. An undo's evaluation may be in
   * flight, and its restore would land in the middle of the scan and put the
   * engine back to the playing level for the rest of it, which would make the
   * report judge the game's positions by two different standards.
   *
   * Nothing is recorded anywhere. This app keeps no history of games played
   * (Q20): Save game is how a game is kept.
   */
  const finish = useCallback(async () => {
    const running = sessionRef.current
    const setup = setupRef.current
    if (!running || !setup) return
    setThinking(true)
    setScanning({ done: 0, total: 0 })
    try {
      await quietRef.current
      const live = await engine()
      // What the bar already worked out is handed over rather than searched
      // again: the scan is shorter, and the report cannot disagree with the
      // numbers that were on the screen during the game.
      const { evaluations: scanned, bestMoves } = await atAnalysisProfile(live, setup.level, () =>
        scanGame(
          running.moves,
          live,
          ANALYSIS_MOVETIME,
          (done, total) => setScanning({ done, total }),
          evaluationsRef.current,
          bestMovesRef.current,
        ),
      )
      evaluationsRef.current = scanned
      bestMovesRef.current = bestMoves
      setEvaluations(scanned)
      // A hint is about a position, and the screen is about to be about the
      // whole game. Leaving it up would put advice for move 12 beside a report
      // on move 19.
      setHint(null)
      // A report nobody has walked yet shows its end, and null is what says so.
      setReplayPly(null)
      setReport(
        buildReport(
          running.moves,
          scanned,
          running.userColour,
          running.outcome ?? stoppedAt(running.moves),
          running.hints,
          bestMoves,
        ),
      )
    } catch (error) {
      setEngineError(asMessage(error))
    } finally {
      setScanning(null)
      setThinking(false)
    }
  }, [engine])

  /**
   * Origin: London src/ui/play-context.tsx resume, adapted: no record and no cap, so putting the report away is the whole of it.
   * Keep playing: puts the report away and hands the board back (spec 18.4).
   *
   * The session is untouched, so the game carries on from where it stopped
   * rather than from wherever the reader has walked to while looking at the
   * report. Walking is a way of LOOKING; playing on from an earlier position is
   * Play from here, which is a different button because it throws moves away.
   *
   * The engine is still running and the evaluation map is kept, so nothing
   * already worked out is searched again.
   */
  const resume = useCallback(() => {
    if (!sessionRef.current || sessionRef.current.outcome) return
    setReport(null)
    setReplayPly(null)
  }, [])

  /**
   * Stop and discard: the game ends with nothing kept (spec 18.3).
   *
   * A fresh game rather than an empty screen, because there is one screen and
   * nothing else to put on it. No confirmation, for the trainer's reason: New
   * game already ends a game the same way.
   *
   * It is New game plus one line. The remembered game is forgotten FIRST,
   * before anything can fail: New game leaves that to the fresh game's own
   * record, written once the fresh game exists, and here the user has asked for
   * this game to be gone, so an engine that would not start must not leave it
   * in storage to reopen tomorrow.
   *
   * The fresh game's side and level are the caller's, not this game's. They are
   * the settings, because a discarded game is the next new game and that is
   * what the side setting applies to (spec 5.1).
   */
  const discard = useCallback(
    (options: StartOptions) => {
      forgetGame()
      void start(options)
    },
    [start],
  )

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
    report,
    replayPly,
    setReplayPly,
    scanning,
    // A reviewed game is over as far as the board is concerned, whether or not
    // it ended by itself: the report is about the game exactly as it stands,
    // and a move played under it would be a move the report does not mention.
    inProgress: session !== null && report === null && !session.isFinished(),
    // Only on the user's own move, in a game that is still going, with nothing
    // in flight: a hint about a position the engine is about to change is an
    // arrow pointing at the wrong board (spec section 8).
    canHint:
      session !== null &&
      report === null &&
      !thinking &&
      session.userToMove &&
      !session.isFinished(),
    start,
    play,
    undo,
    redo,
    askHint,
    setLevel,
    finish,
    // Only a game that was STOPPED can be carried on. A checkmate or a draw
    // has nothing to play, and `outcome` is the one field that tells the two
    // apart: it is what `stoppedAt` falls back from when building the report.
    canResume: session !== null && report !== null && !session.outcome,
    resume,
    discard,
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
