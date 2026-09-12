import { levelName } from '../engine'
import { colourName, type Colour } from '../model/types'

/**
 * What the game is, in one line, for the head row (spec 18.1): the side being
 * played and the strength it is being played against.
 *
 * Both come from the running game rather than from the settings beside it, and
 * the two can differ: the side changes only at the next new game (spec 5.1),
 * and a level chosen mid-game is the game's from the engine's next move on
 * (spec S6). The line answers "what am I actually in", so it has to read the
 * game.
 *
 * Its own module rather than a second export from `PlayHead.tsx`, so that file
 * exports one component and nothing else. The trainer keeps its own version
 * private inside `Play.tsx`; this one is tested by itself, because the sentence
 * is the whole of it.
 */
export function openingLine(side: Colour, level: number): string {
  return `Playing ${colourName(side)} against ${levelName(level)}`
}
