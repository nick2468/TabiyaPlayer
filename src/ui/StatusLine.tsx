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
      {engineError ? <EngineError message={engineError} /> : null}
    </>
  )
}

/** An engine that would not start or answer, said in the trainer's warning style. */
export function EngineError({ message }: { message: string }) {
  return <p className="notice bad">{message}</p>
}
