import type { PlaySession } from '../play'

/**
 * Origin: London src/ui/Play.tsx PlayActions, adapted: no length cap, so the two extend buttons go; it is a row under the board rather than a block in the panel, and its notice goes with the other notices.
 * What you can do with a game that is not yet a report (spec 18.3).
 *
 * This is row two under the board while a game is going; the same row carries
 * Keep playing, Play from here and the stepping arrows once a report is showing
 * (spec S19). The two states are exclusive, so `PlayControls` chooses between
 * them and this file is only ever the first of them.
 *
 * The sentence a finished game gets, "Review it to see what it cost.", is under
 * the rows with the other notices from phase 13, where `Screen` writes it. It
 * sat above these two buttons while they were in the side panel; under the
 * board it would move the three rows below every time a game ended.
 *
 * Stop and discard sits second because review is what a game is for. There is
 * no confirmation, for the trainer's reason: an unsaved game is the smallest
 * thing the app holds, and New game already ends one the same way.
 */
export function PlayActions({
  session,
  scanning,
  thinking,
  onFinish,
  onDiscard,
}: {
  session: PlaySession
  scanning: { done: number; total: number } | null
  thinking: boolean
  onFinish: () => void
  onDiscard: () => void
}) {
  const finished = session.isFinished()
  return (
    <div className="play-controls">
      <button type="button" className="primary" onClick={onFinish} disabled={thinking}>
        {scanning
          ? `Scanning ${scanning.done} of ${scanning.total}...`
          : finished
            ? 'Review the game'
            : 'Stop and review'}
      </button>
      <button type="button" onClick={onDiscard} disabled={thinking}>
        Stop and discard
      </button>
    </div>
  )
}
