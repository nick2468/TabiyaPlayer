import { squaresForSan } from '../model/moves'
import { legalDests, sideToMove } from '../model/position'
import type { PlayedMove } from '../play'
import { Board } from './Board'
import { PlayControls } from './PlayControls'
import { Sidebar, type SettingsProps } from './Sidebar'
import { EngineError, StatusLine } from './StatusLine'
import { usePlay } from './play-context'
import { useBoardPixels } from './use-board-pixels'
import './play.css'

/**
 * The one screen (spec 4.1): the board column, with the bar, the board, the
 * buttons and the status line, and beside it the sidebar.
 *
 * Built from the provider's state and the settings handed down from `Shell`,
 * and nothing else. Until the first game exists there is nothing to show,
 * except an engine that would not start.
 */
export function Screen({
  settings,
  onNewGame,
}: {
  settings: SettingsProps
  onNewGame: () => void
}) {
  const game = usePlay()
  const { session, thinking } = game
  // Measured before the early return below, because a hook cannot be called
  // conditionally and how big the board is drawn does not depend on there
  // being a game to draw on it.
  const pixels = useBoardPixels(settings.boardSize)

  if (!session) return game.engineError ? <EngineError message={game.engineError} /> : null

  const fen = session.fen
  // Locked while the engine thinks and once the game is over (spec 5.2).
  const canMove = !thinking && !session.isFinished()

  return (
    <div className="play-body">
      <div className="play-column">
        {/* The bar and the board in one box, so the bar is stretched to the
            board's own height rather than given a height of its own. */}
        <div className="play-board">
          {/* The bar's box, empty until phase 4 gives it an evaluation. */}
          <div className="live-eval" aria-hidden="true" />
          <Board
            fen={fen}
            orientation={session.userColour}
            turnColor={sideToMove(fen)}
            movableColor={canMove ? session.userColour : undefined}
            dests={canMove ? legalDests(fen) : undefined}
            lastMove={squaresOf(session.moves.at(-1) ?? null)}
            onMove={(from, to) => void game.play(from, to)}
            size={pixels}
          />
        </div>

        <PlayControls
          session={session}
          thinking={thinking}
          // Phase 4 wires Hint; until then it stays disabled.
          canHint={false}
          onNew={onNewGame}
          onUndo={game.undo}
          onRedo={game.redo}
          onHint={() => undefined}
        />

        <StatusLine session={session} thinking={thinking} engineError={game.engineError} />
      </div>

      <aside className="sidebar">
        <Sidebar {...settings} moves={session.moves} />
      </aside>
    </div>
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
