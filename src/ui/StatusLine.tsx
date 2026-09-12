import { colourName } from '../model/types'
import type { PlaySession } from '../play'

/**
 * Origin: London src/ui/Play.tsx PlayHead, adapted: the status line only, with the engine error under it.
 * One line under the buttons saying where the game is (spec 5.6): the outcome
 * once it has ended, who is thinking while the engine is, and "Your move"
 * otherwise.
 */
export function StatusLine({
  session,
  thinking,
  engineError,
}: {
  session: PlaySession
  thinking: boolean
  engineError: string | null
}) {
  return (
    <>
      <p className="play-status">
        {session.isFinished()
          ? (session.outcome ?? 'Game over')
          : thinking
            ? `${colourName(session.engineColour)} is thinking...`
            : 'Your move'}
      </p>
      {engineError ? <Notice message={engineError} bad /> : null}
    </>
  )
}

/**
 * One short message under the board, in the trainer's notice style.
 *
 * Every message that belongs there goes through this: an engine that would not
 * start or answer, a file that was saved, a file that could not be read.
 * Renamed from `EngineError` in phase 5, when the second kind arrived, because
 * two components drawing the same box in two colours is how they drift apart.
 *
 * `bad` is the warning colour. A message that says something went wrong looks
 * different from one that says something worked, and which of the two it is
 * belongs to whoever wrote the sentence.
 */
export function Notice({ message, bad = false }: { message: string; bad?: boolean }) {
  return <p className={bad ? 'notice bad' : 'notice'}>{message}</p>
}
