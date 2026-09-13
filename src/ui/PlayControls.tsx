import type { PlaySession } from '../play'

/**
 * Origin: London src/ui/Play.tsx PlayControls, adapted: no length cap, so the Keep playing tooltip says nothing about a record this app does not keep.
 * The rows of buttons under the board.
 *
 * Under the board because that is where the hand is, and real buttons because
 * these do things to the game: New game throws it away, Undo and Redo move it,
 * Hint answers it.
 *
 * New game first, because it is the one you look for; then the two that move
 * the game; then the one that helps with the position in front of you.
 */

/** What walks a reviewed game, built once so one object drives every stepper. */
export interface ReplayControls {
  /** Which position is showing, as a count of moves played. */
  ply: number
  /** How many moves the game has, which is the last position. */
  count: number
  onBack: () => void
  onForward: () => void
}

export function PlayControls({
  session,
  reviewing,
  thinking,
  canHint,
  canResume,
  replay,
  playFromWhy,
  onNew,
  onUndo,
  onRedo,
  onHint,
  onResume,
  onPlayFrom,
}: {
  session: PlaySession
  /** A report is showing, so the game is not the board's any more (spec 18.4). */
  reviewing: boolean
  thinking: boolean
  canHint: boolean
  /** Whether this game can be carried on from where it stopped. */
  canResume: boolean
  /** The stepping arrows, once there is a reviewed game to walk. */
  replay: ReplayControls | null
  /**
   * Why Play from here is off at the position showing, or empty when it is on.
   * Null when there is no review at all and the button does not belong.
   */
  playFromWhy: string | null
  onNew: () => void
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
  onResume: () => void
  onPlayFrom: () => void
}) {
  return (
    <>
      {/* Row one: the game itself, and it is the same four buttons whether a
          game is running or finished. */}
      <div className="play-controls">
        {/* Disabled while the engine thinks, like the other three. A New game
            started mid-search let the old game's reply land on a session that had
            already been thrown away, and a row where three buttons grey and one
            does not is the odder screen anyway (ruled at gate 2). */}
        <button type="button" onClick={onNew} disabled={thinking}>
          New game
        </button>
        {/* Both greyed during a review, as the trainer's are: the game the report
            is about must still be the game when it is read. */}
        <button
          type="button"
          onClick={onUndo}
          disabled={thinking || reviewing || !session.canUndo()}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={thinking || reviewing || !session.canRedo()}
        >
          Redo
        </button>
        <button type="button" onClick={onHint} disabled={!canHint}>
          Hint
        </button>
      </div>

      {/* Row two: what a reviewed game offers, and it exists only while one is
          showing. Two rows rather than one because the board can be 416px and
          one row of all of these does not fit under it.

          The two on the left are the pair people confuse, so they are side by
          side and each says in its tooltip what happens to the game. */}
      {replay ? (
        <div className="play-controls play-review-row">
          {canResume ? (
            <button
              type="button"
              onClick={onResume}
              title="Carry on this game from its final position, wherever the board is standing now."
            >
              Keep playing
            </button>
          ) : null}
          {playFromWhy !== null ? (
            <button
              type="button"
              onClick={onPlayFrom}
              disabled={playFromWhy !== ''}
              title={
                playFromWhy === ''
                  ? 'Start a new game from the position on the board, at the same side and level.'
                  : playFromWhy
              }
            >
              Play from here
            </button>
          ) : null}
          {/* `auto` on this group is what puts it at the board's right edge,
              so the row spans the board exactly. An arrow is not a name, so
              each carries a written one for a screen reader and for the
              tooltip. */}
          <div className="play-steps">
            <button
              type="button"
              className="step-arrow"
              onClick={replay.onBack}
              disabled={replay.ply === 0}
              aria-label="Back one move"
              title="Back one move"
            >
              &#8592;
            </button>
            <button
              type="button"
              className="step-arrow"
              onClick={replay.onForward}
              disabled={replay.ply >= replay.count}
              aria-label="Forward one move"
              title="Forward one move"
            >
              &#8594;
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
