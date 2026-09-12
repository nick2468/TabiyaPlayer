import { useState } from 'react'
import { squaresForSan } from '../model/moves'
import { isPromotion, legalDests, sideToMove } from '../model/position'
import type { Shape } from '../model/types'
import { shownEvaluation, type Hint, type PlayedMove } from '../play'
import { Board } from './Board'
import { EvalBar } from './EvalBar'
import { MoveList } from './MoveList'
import { Notice } from './Notice'
import { PlayControls } from './PlayControls'
import { PlayHead } from './PlayHead'
import { PromotionPicker, type PromotionPiece } from './PromotionPicker'
import { SidePanel, type FileProps, type SettingsProps } from './SidePanel'
import { usePlay } from './play-context'
import { useBoardPixels } from './use-board-pixels'
import './play.css'

/**
 * The one screen (spec 18.1): the head row, and under it three columns - the
 * board with its bar and buttons, the move list, and the side panel.
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
  onNewGame,
}: {
  settings: SettingsProps
  files: FileProps
  notice: ScreenNotice | null
  onNewGame: () => void
}) {
  const game = usePlay()
  const { session, thinking } = game
  // Measured before the early return below, because a hook cannot be called
  // conditionally and how big the board is drawn does not depend on there
  // being a game to draw on it.
  const pixels = useBoardPixels(settings.boardSize)
  // A pawn move onto the last rank, waiting for the piece to promote to. Held
  // here rather than in the provider because nothing about the game has
  // happened yet: this is a question on the screen, and the answer to it is
  // what makes it a move (spec 5.3).
  const [pending, setPending] = useState<{ from: string; to: string } | null>(null)

  if (!session) return game.engineError ? <Notice message={game.engineError} bad /> : null

  const fen = session.fen
  // Locked while the engine thinks, once the game is over (spec 5.2), and while
  // the picker is open: that pawn is mid-move and a second move would strand it.
  //
  // The lock is also what puts a cancelled pawn back. The board draws the move
  // before it reports it, and locking changes two of the props it is given, so
  // the position is re-applied and the pawn returns to the square it came from.
  // See the note on the board's own effect.
  const canMove = !thinking && !session.isFinished() && pending === null

  const choose = (piece: PromotionPiece) => {
    if (!pending) return
    const move = pending
    setPending(null)
    void game.play(move.from, move.to, piece)
  }

  return (
    <>
      {/* The level of the RUNNING game, not the setting: the two differ for a
          move after the select is changed (spec S6), and the line says what is
          being played. */}
      <PlayHead session={session} level={game.level ?? settings.level} thinking={thinking} />

      <div className="play-body">
        <div className="play-column">
          {/* The bar and the board in one box, so the bar is stretched to the
              board's own height rather than given a height of its own. */}
          <div className="play-board">
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
              lastMove={squaresOf(session.moves.at(-1) ?? null)}
              shapes={hintShapes(game.hint, fen)}
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

          <PlayControls
            session={session}
            thinking={thinking}
            canHint={game.canHint}
            onNew={onNewGame}
            onUndo={game.undo}
            onRedo={game.redo}
            onHint={() => void game.askHint()}
          />

          {/* Under the buttons, where something that has just happened belongs.
              Where the game is up to is in the head row instead (spec 18.1). */}
          {game.engineError && <Notice message={game.engineError} bad />}

          {notice && <Notice message={notice.text} bad={notice.bad} />}
        </div>

        <MoveList moves={session.moves} pixels={pixels} />

        <aside className="play-side">
          <SidePanel side={settings.side} onSide={settings.onSide} {...files} />
          {game.hint && <p className="hint-said engine">{game.hint.text}</p>}
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
 * Origin: London src/ui/Play.tsx hintShapes, adapted: the engine is the only source, so the arrow is always blue.
 * The hint as an arrow on the board.
 */
function hintShapes(hint: Hint | null, fen: string): Shape[] {
  if (!hint) return []
  const squares = squaresForSan(fen, hint.san)
  if (!squares) return []
  return [{ orig: squares.from, dest: squares.to, brush: 'blue' }]
}
