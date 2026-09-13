import type { PlaySession } from '../play'

/**
 * Origin: London src/ui/Play.tsx PlayActions, adapted: no length cap, so the two extend buttons go and the notice is only ever about an outcome; the engine error is shown under the board instead.
 * What you can do with a game that is not yet a report (spec 18.3).
 *
 * A game that ended by itself gets a notice above the buttons, because the head
 * row says the outcome in three words and there is one more thing worth saying:
 * the game is not finished with until it has been looked at.
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
    <div className="play-actions">
      {/* The outcome rather than `finished`, so nothing can print the word
          "undefined" at a reader: every way a game ends by itself has a
          sentence for it (spec 5.5). */}
      {session.outcome ? (
        <p className="notice">{session.outcome}. Review it to see what it cost.</p>
      ) : null}
      <div className="play-extend">
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
    </div>
  )
}
