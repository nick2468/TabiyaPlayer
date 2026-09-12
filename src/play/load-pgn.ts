import { parsePgn } from '../model/pgn'
import type { Colour } from '../model/types'
import { levelOrNull } from './level'
import { canReplayMoves } from './replay'

/**
 * Origin: new; the reading is London src/model/pgn.ts parsePgn, which this only asks questions of.
 * Reading a game back out of a PGN file (spec 9.2).
 *
 * The parser is the trainer's and it keeps the whole tree, because what it
 * reads there is a tree of authored lines. A saved game is one line, so this
 * takes the first game's main line and ignores the variations and the comments
 * (spec S8). A file from elsewhere with variations in it is not an error and is
 * not several games either; the branches are simply not this app's business.
 *
 * Nothing here changes the running game. It answers with what the file holds
 * or with one sentence saying why it holds nothing, and the screen decides
 * what to do about that: a bad file must leave the game on the board alone.
 */

/** What a file turned out to hold. */
export interface LoadedGame {
  sans: string[]
  /** Which side the user was on, from the "You" tag. */
  side: Colour
  /** The level the file names, or null when it names none this app has. */
  level: number | null
}

export type LoadResult = LoadedGame | { error: string }

/** "Stockfish level 4", the way `game-pgn.ts` writes the opponent. */
const ENGINE_TAG = /^Stockfish level (\d+)$/

/** The exact string that says which side of the board the user was on. */
const USER_TAG = 'You'

export function loadPgn(text: string): LoadResult {
  const { games, errors } = parsePgn(text)
  // The parser's own messages already read as sentences, and it reports every
  // fault in a file rather than the first: the first one is the one to show.
  if (errors.length > 0) return { error: errors[0].message }
  if (games.length === 0) return { error: 'That file has no game in it' }

  // Several games in one file: the first is loaded and the rest ignored (spec
  // S8). Nothing is said about it, because nothing went wrong.
  const game = games[0]

  // A game that starts from a set position, which this app cannot show: every
  // session starts from the initial position and replays SAN into it.
  if ('FEN' in game.tags) {
    return { error: 'That file starts from a position this app cannot load' }
  }

  const sans = game.moves.map((move) => move.san)
  if (sans.length === 0) return { error: 'That file has no moves in it' }
  if (!canReplayMoves(sans)) return { error: "That file's moves do not make a legal game" }

  // A file from another program has neither tag, so it loads with the user as
  // White, which is what a person opening somebody else's game expects to be.
  const side: Colour = game.tags.Black === USER_TAG ? 'black' : 'white'
  const opponent = side === 'black' ? game.tags.White : game.tags.Black
  return { sans, side, level: levelFromTag(opponent) }
}

/** The N in "Stockfish level N", when it is a level this app plays at. */
function levelFromTag(tag: string | undefined): number | null {
  const named = tag ? ENGINE_TAG.exec(tag) : null
  return named ? levelOrNull(named[1]) : null
}
