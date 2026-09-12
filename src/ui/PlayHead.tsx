import { colourName } from '../model/types'
import type { PlaySession } from '../play'
import { openingLine } from './opening-line'

/**
 * Origin: London src/ui/Play.tsx PlayHead, adapted: no heading, and the opening line names the side and the level rather than a course and a chapter.
 * The head row over the board (spec 18.1): what is being played, and where the
 * game is up to.
 *
 * Two lines on one row, as the trainer's. The left one says what the game is,
 * the right one says whose move it is. The trainer's "Play" heading is not
 * here, because this app has one screen and a heading that never changes is a
 * line of the window doing nothing (spec S1).
 *
 * The status wording is spec 5.6's and moved up from under the buttons in
 * phase 9. An engine error and the file notices stayed down there, because
 * those are things that just happened rather than where the game is.
 */
export function PlayHead({
  session,
  level,
  thinking,
}: {
  session: PlaySession
  /** The level the RUNNING game is being played at, which may not be the setting. */
  level: number
  thinking: boolean
}) {
  return (
    <header className="play-head">
      <p className="play-opening">{openingLine(session.userColour, level)}</p>
      <p className="play-status">
        {session.isFinished()
          ? (session.outcome ?? 'Game over')
          : thinking
            ? `${colourName(session.engineColour)} is thinking...`
            : 'Your move'}
      </p>
    </header>
  )
}
