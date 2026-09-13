import { useCallback, useEffect, useMemo, useState } from 'react'
import { squaresForSan } from '../model/moves'
import { isPromotion, legalDests, sideToMove } from '../model/position'
import type { Shape } from '../model/types'
import {
  clampPly,
  moveAtPly,
  plyBeforeMove,
  positionAtPly,
  shownEvaluation,
  type GameReport,
  type Hint,
  type PlayedMove,
} from '../play'
import { Board } from './Board'
import { EvalBar } from './EvalBar'
import { FileRow, type FileProps } from './FileRow'
import { MoveList } from './MoveList'
import { Notice } from './Notice'
import { PlayControls } from './PlayControls'
import { PlayHead } from './PlayHead'
import { Report } from './Report'
import { PromotionPicker, type PromotionPiece } from './PromotionPicker'
import { SettingsRow, type SettingsProps } from './SettingsRow'
import { whyNotPlayable } from './play-from-replay'
import { usePlay } from './play-context'
import { useBoardPixels } from './use-board-pixels'
import './play.css'

/**
 * The one screen (spec 19.1): the head row, and under it three columns - the
 * board with its bar and its four rows of buttons, the move list, and the side
 * panel, which is the report.
 *
 * Built from the provider's state and the settings handed down from `Shell`,
 * and nothing else. Until the first game exists there is nothing to show,
 * except an engine that would not start.
 */
/** A message under the buttons, until its few seconds are up. */
export interface ScreenNotice {
  text: string
  /** The warning colour, for something that did not work. */
  bad: boolean
}

export function Screen({
  settings,
  files,
  notice,
  pgn,
  onNewGame,
  onDiscard,
  onPlayFrom,
}: {
  settings: SettingsProps
  files: FileProps
  notice: ScreenNotice | null
  /** The running game as text, for the report's Copy game (spec 18.6). */
  pgn: string
  onNewGame: () => void
  onDiscard: () => void
  onPlayFrom: (sans: string[]) => void
}) {
  const game = usePlay()
  const { session, report, thinking } = game
  // Measured before the early return below, because a hook cannot be called
  // conditionally and how big the board is drawn does not depend on there
  // being a game to draw on it.
  const pixels = useBoardPixels(settings.boardSize)
  // A pawn move onto the last rank, waiting for the piece to promote to. Held
  // here rather than in the provider because nothing about the game has
  // happened yet: this is a question on the screen, and the answer to it is
  // what makes it a move (spec 5.3).
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null)

  // The viewer's arithmetic, above the early return for the same reason the
  // board's size is. A report nobody has walked yet shows its end, which is the
  // final position (spec 18.4).
  // The session is one mutable object whose `moves` array is pushed into, so it
  // only becomes a different list when a different game starts. That is what
  // keeps the key handler below from being rebuilt on every render.
  const moves = useMemo(() => session?.moves ?? [], [session])
  const atEnd = moves.length
  const ply = report !== null && game.replayPly !== null ? clampPly(moves, game.replayPly) : atEnd
  const setReplayPly = game.setReplayPly
  const step = useCallback(
    (to: number) => setReplayPly(clampPly(moves, to)),
    [moves, setReplayPly],
  )

  /**
   * The arrow keys step the viewer, and only while a report is showing.
   *
   * On `window` rather than on the list, because the thing being stepped is the
   * board and nobody clicks the list first. This app has one screen, so there
   * is no second handler to fight with; the trainer puts the same effect on two
   * screens and has to be careful that only one is ever mounted.
   *
   * A key typed into a field is a key typed into a field: the file name box in
   * a save dialog is not on this page, but a select is, and a left arrow inside
   * one changes the level rather than the position.
   */
  useEffect(() => {
    if (!report) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'ArrowLeft') step(ply - 1)
      else if (event.key === 'ArrowRight') step(ply + 1)
      else return
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ply, report, step])

  if (!session) return game.engineError ? <Notice message={game.engineError} bad /> : null

  // What the board is actually showing. During a game it is the game; during a
  // review it is wherever the reader has walked to, which is the same position
  // whenever they have not walked anywhere.
  const fen = (report ? positionAtPly(moves, ply) : null) ?? session.fen
  // Locked while the engine thinks, once the game is over (spec 5.2), and while
  // the picker is open: that pawn is mid-move and a second move would strand it.
  //
  // The lock is also what puts a cancelled pawn back. The board draws the move
  // before it reports it, and locking changes two of the props it is given, so
  // the position is re-applied and the pawn returns to the square it came from.
  // See the note on the board's own effect.
  // A report locks it too: the report is about the game exactly as it stands,
  // and a move played under one would be a move it does not mention (spec 18.4).
  const canMove = !thinking && !session.isFinished() && report === null && pending === null

  const choose = (piece: PromotionPiece) => {
    if (!pending) return
    const move = pending
    setPending(null)
    void game.play(move.from, move.to, piece)
  }

  /**
   * Standing on the position a slip was played from, the highlight is the slip
   * ITSELF, the move about to be played, so that it and the engine's blue arrow
   * are on the board together: what was done and what the engine would have
   * done (spec 18.4). Anywhere else it is the move that led here, as it always
   * was.
   */
  const slipHere = report?.slips.find((slip) => slip.ply === ply && slip.better)
  const highlight = report
    ? squaresOf(slipHere ? (moves[ply] ?? null) : moveAtPly(moves, ply))
    : squaresOf(session.moves.at(-1) ?? null)

  // Why Play from here is off where the board is standing, or '' when it is on.
  const playFromWhy = report ? whyNotPlayable({ moves }, ply, session.userColour) : null

  const onBack = () => step(ply - 1)
  const onForward = () => step(ply + 1)

  return (
    <>
      {/* The level of the RUNNING game, not the setting: the two differ for a
          move after the select is changed (spec S6), and the line says what is
          being played. */}
      <PlayHead
        session={session}
        level={game.level ?? settings.level}
        thinking={thinking}
        reviewed={report !== null}
      />

      <div className="play-body">
        <div className="play-column">
          {/* The bar and the board in one box, so the bar is stretched to the
              board's own height rather than given a height of its own. */}
          <div className="play-board">
            {/* The position being LOOKED AT during a review, not the game's own
                (spec 18.4). Every position of a reviewed game has an entry,
                because the scan filled them. */}
            <EvalBar
              evaluation={shownEvaluation(fen, session.moves, game.evaluations)}
              userColour={session.userColour}
            />
            <Board
              fen={fen}
              orientation={session.userColour}
              turnColor={sideToMove(fen)}
              movableColor={canMove ? session.userColour : undefined}
              dests={canMove ? legalDests(fen) : undefined}
              lastMove={highlight}
              shapes={report ? preferredShapes(report, ply, fen) : hintShapes(game.hint, fen)}
              onMove={(from, to) => {
                // A promotion is not played here: it is held until the picker is
                // answered, so the engine is never asked about a move the user
                // has not finished making.
                if (isPromotion(fen, from, to)) setPending({ from, to })
                else void game.play(from, to)
              }}
              size={pixels}
            />
            {pending && (
              <PromotionPicker
                colour={session.userColour}
                squareSize={pixels / 8}
                onChoose={choose}
                onCancel={() => setPending(null)}
              />
            )}
          </div>

          {/* The four rows of spec S19, in its order: the game, this game, the
              file, the settings. Rows one and two act on the game in front of
              you and are `PlayControls`; rows three and four do not and are
              their own. */}
          <PlayControls
            session={session}
            reviewing={report !== null}
            thinking={thinking}
            canHint={game.canHint}
            canResume={game.canResume}
            replay={report ? { ply, count: atEnd, onBack, onForward } : null}
            playFromWhy={playFromWhy}
            scanning={game.scanning}
            onNew={onNewGame}
            onUndo={game.undo}
            onRedo={game.redo}
            onHint={() => void game.askHint()}
            onResume={game.resume}
            onPlayFrom={() => onPlayFrom(moves.slice(0, ply).map((move) => move.san))}
            onFinish={() => void game.finish()}
            onDiscard={onDiscard}
          />

          <FileRow {...files} />

          <SettingsRow
            side={settings.side}
            onSide={settings.onSide}
            boardSize={settings.boardSize}
            onBoardSize={settings.onBoardSize}
            theme={settings.theme}
            onTheme={settings.onTheme}
          />

          {/* Under the buttons, where something that has just happened belongs.
              Where the game is up to is in the head row instead (spec 18.1).

              The first of the three is the game's own: a game that ended by
              itself is not finished with until it has been looked at, and the
              head row says the outcome in three words without saying that. It
              is a notice rather than a line in row two, because a sentence
              inside the rows would move the two below it every time a game
              ended. */}
          {report === null && session.outcome && (
            <Notice message={`${session.outcome}. Review it to see what it cost.`} />
          )}

          {game.engineError && <Notice message={game.engineError} bad />}

          {notice && <Notice message={notice.text} bad={notice.bad} />}
        </div>

        <MoveList
          moves={session.moves}
          pixels={pixels}
          activePly={report ? ply : null}
          onSelect={step}
        />

        {/* The hint sentence and the report, and nothing else (spec Q24). Both
            are the game talking rather than controls, and the report starts at
            the top of the column because it is what the column is for. During a
            game with no hint showing the panel is empty, which is allowed: the
            screen is left weighted while you play and fills when there is
            something to read. */}
        <aside className="play-side">
          {game.hint && <p className="hint-said engine">{game.hint.text}</p>}
          {report && (
            <Report report={report} pgn={pgn} onJump={(movePly) => step(plyBeforeMove(movePly))} />
          )}
        </aside>
      </div>
    </>
  )
}

/**
 * Origin: London src/ui/Play.tsx squaresOf, identical.
 * The two squares of a move, for the board's highlight.
 */
function squaresOf(move: PlayedMove | null): [string, string] | undefined {
  if (!move) return undefined
  const squares = squaresForSan(move.fen, move.san)
  return squares ? [squares.from, squares.to] : undefined
}

/**
 * Origin: London src/ui/Play.tsx preferredShapes, identical.
 * The engine's preferred move as a blue arrow, while the viewer is standing on
 * the position a slip was played from. The move that was played stays
 * highlighted as the last move, so both are on the board at once: what was done
 * and what the engine would have done. Blue is the engine hint's colour,
 * because it is the same kind of answer.
 */
function preferredShapes(report: GameReport, ply: number, fen: string): Shape[] {
  const slip = report.slips.find((entry) => entry.ply === ply && entry.better)
  if (!slip?.better) return []
  const squares = squaresForSan(fen, slip.better)
  if (!squares) return []
  return [{ orig: squares.from, dest: squares.to, brush: 'blue' }]
}

/**
 * Origin: London src/ui/Play.tsx hintShapes, adapted: the engine is the only source, so the arrow is always blue.
 * The hint as an arrow on the board.
 */
function hintShapes(hint: Hint | null, fen: string): Shape[] {
  if (!hint) return []
  const squares = squaresForSan(fen, hint.san)
  if (!squares) return []
  return [{ orig: squares.from, dest: squares.to, brush: 'blue' }]
}
