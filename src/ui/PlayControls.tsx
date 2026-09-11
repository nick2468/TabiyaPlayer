import type { PlaySession } from '../play'

/**
 * Origin: London src/ui/Play.tsx PlayControls, adapted: row one only; the review row is gone.
 * The row of buttons under the board.
 *
 * Under the board because that is where the hand is, and real buttons because
 * these do things to the game: New game throws it away, Undo and Redo move it,
 * Hint answers it.
 *
 * New game first, because it is the one you look for; then the two that move
 * the game; then the one that helps with the position in front of you.
 */
export function PlayControls({
  session,
  thinking,
  canHint,
  onNew,
  onUndo,
  onRedo,
  onHint,
}: {
  session: PlaySession
  thinking: boolean
  canHint: boolean
  onNew: () => void
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
}) {
  return (
    <div className="play-controls">
      <button type="button" onClick={onNew}>
        New game
      </button>
      <button type="button" onClick={onUndo} disabled={thinking || !session.canUndo()}>
        Undo
      </button>
      <button type="button" onClick={onRedo} disabled={thinking || !session.canRedo()}>
        Redo
      </button>
      <button type="button" onClick={onHint} disabled={!canHint}>
        Hint
      </button>
    </div>
  )
}
