import type { PlaySession } from '../play'
import { PlayActions } from './PlayActions'

/**
 * Origin: London src/ui/Play.tsx PlayControls, adapted: no length cap, so the Keep playing tooltip says nothing about a record this app does not keep; row two carries the actions as well, and row one ends with the stepping arrows.
 * The first two rows of buttons under the board (spec S19).
 *
 * Under the board because that is where the hand is, and real buttons because
 * these do things to the game: Undo and Redo move it, Hint answers it.
 *
 * Row one is THIS POSITION: Undo, Redo and Hint act on the position showing,
 * and the two stepping arrows, at the row's right-hand end, are the two that
 * change which position that is. That puts them at the bottom right corner of
 * the board (spec Q27). Row two is THIS GAME. New game left row one in 1.2.1
 * and is in row four with Play as, because the side chosen is the side the next
 * new game is played at and the two belong together.
 *
 * The two rows below these, the file and the next game, act on neither the
 * position nor the game in front of you: they are `FileRow` and `SettingsRow`,
 * composed beside this one by `Screen`.
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
  scanning,
  onUndo,
  onRedo,
  onHint,
  onResume,
  onPlayFrom,
  onFinish,
  onDiscard,
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
  /** How far the review's scan has got, while one is running (spec 18.3). */
  scanning: { done: number; total: number } | null
  onUndo: () => void
  onRedo: () => void
  onHint: () => void
  onResume: () => void
  onPlayFrom: () => void
  onFinish: () => void
  onDiscard: () => void
}) {
  return (
    <>
      {/* Row one: this position. The same three buttons whether a game is
          running or finished, and the two arrows beside them while a report is
          being read. */}
      <div className="play-controls">
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
        {/* `auto` on this group is what puts it at the board's right edge, so
            the row spans the board exactly and the arrows land on its bottom
            right corner (spec Q27). An arrow is not a name, so each carries a
            written one for a screen reader and for the tooltip. */}
        {replay ? (
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
        ) : null}
      </div>

      {/* Row two: this game. While one is going that is the two ways to stop
          it; once a report is showing it is the two ways on from it. The two
          states are exclusive, so this is one row and never two.

          Two rows rather than one because the board can be 416px and all of
          these in one row would wrap into a ragged second line rather than a
          deliberate one.

          Keep playing and Play from here are the pair people confuse, so they
          are side by side and each says in its tooltip what happens to the
          game. */}
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
        </div>
      ) : (
        <PlayActions
          session={session}
          scanning={scanning}
          thinking={thinking}
          onFinish={onFinish}
          onDiscard={onDiscard}
        />
      )}
    </>
  )
}
