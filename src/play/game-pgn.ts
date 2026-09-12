import { Movetext, pgnTag } from '../model/pgn'
import { colourName, type Colour } from '../model/types'
import { fullMove, type PlayedMove } from './session'

/**
 * Origin: London src/play/game-pgn.ts, adapted: there is no report, so the slips, the deviation, the verdict and the hint count all go and one closing comment is left; Site is the standard's "-"; saveFileName is new.
 * A played game written out as PGN, which is how a game leaves this app
 * (spec 9.1).
 *
 * Text is what a game is. A PGN can be pasted into a chat, a file or another
 * engine and played through by whoever reads it, and this app's own reader
 * takes it back (`load-pgn.ts`), so a saved game is not a dead end.
 *
 * Seven tag pairs, and every one of them says something true. The trainer
 * names the material a game was played against in `Site`, which is that tag's
 * honest use in an app that has some; this app has none, so `Site` is the
 * standard's "-" for not applicable. Nothing is invented to fill a slot, which
 * is why `Round` is "-" as well.
 *
 * `White` and `Black` are how a saved game comes back knowing which side the
 * user played and how strong the engine was, so their exact strings matter:
 * "You" and "Stockfish level N", the trainer's.
 */

export interface GameForPgn {
  moves: PlayedMove[]
  /** The colour the user played. */
  side: Colour
  /** The strength level the engine played at. */
  level: number
  /** How the game ended, when it ended. A game still going has none. */
  outcome?: string
  /** When the game was written out, as an ISO timestamp. */
  at: string
}

/**
 * Two digits, for a date or a clock.
 *
 * One home, because the date below and the file name at the bottom of this
 * file both pad, and a second copy of `padStart(2, '0')` is how the two would
 * one day disagree about midnight.
 */
function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** The PGN date field: "2026.09.03", or the standard's own unknown date. */
export function pgnDate(at: string): string {
  const when = new Date(at)
  if (Number.isNaN(when.getTime())) return '????.??.??'
  return `${when.getFullYear()}.${pad(when.getMonth() + 1)}.${pad(when.getDate())}`
}

/**
 * What a saved file is called by default: `simply-chess-2026-09-11-1432.pgn`.
 *
 * Stamped from the clock to the minute, so saving the same game twice in an
 * afternoon does not land two files on top of each other in a downloads folder
 * (spec 9.1). Local time rather than UTC, because the stamp is for the person
 * who will look for the file later.
 *
 * A timestamp that will not parse cannot be stamped with anything honest, so
 * the name simply loses its stamp. Nothing reads the name back.
 */
export function saveFileName(at: string): string {
  const when = new Date(at)
  if (Number.isNaN(when.getTime())) return 'simply-chess.pgn'
  const date = `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`
  return `simply-chess-${date}-${pad(when.getHours())}${pad(when.getMinutes())}.pgn`
}

/**
 * The result, from the outcome the session recorded.
 *
 * A game that was stopped rather than finished has no result, and `*` is what
 * the standard has for that. Guessing one from the evaluation would be putting
 * a number's opinion where a fact belongs.
 */
export function pgnResult(outcome: string | undefined, side: Colour): string {
  if (!outcome) return '*'
  if (outcome.includes('You won')) return side === 'white' ? '1-0' : '0-1'
  if (outcome.includes('You were checkmated')) return side === 'white' ? '0-1' : '1-0'
  if (outcome.startsWith('Drawn')) return '1/2-1/2'
  return '*'
}

/**
 * Where an unfinished game got to.
 *
 * A game with no moves in it is the one case the trainer never meets, because
 * a trainer game is recorded when it is over. Here Save game is a button on a
 * board that may have just been set up, and "Stopped after move 1" would be a
 * move that was never played.
 */
function stoppedAt(moves: PlayedMove[]): string {
  if (moves.length === 0) return 'Stopped before the first move'
  return `Stopped after move ${fullMove(moves.length - 1)}`
}

export function gameToPgn(game: GameForPgn): string {
  const { moves, side, level, outcome } = game
  const engine = `Stockfish level ${level}`
  const result = pgnResult(outcome, side)

  const header = [
    pgnTag('Event', 'Simply Chess'),
    pgnTag('Site', '-'),
    pgnTag('Date', pgnDate(game.at)),
    pgnTag('Round', '-'),
    pgnTag('White', side === 'white' ? 'You' : engine),
    pgnTag('Black', side === 'black' ? 'You' : engine),
    pgnTag('Result', result),
  ]

  const out = new Movetext()
  for (const move of moves) out.move(move.san, move.ply)

  // One comment, at the end, saying the two things the moves do not: how the
  // game stood when it was written out, and who was playing which side against
  // what. "1-0" does not say whether it was a mate or a resignation, and this
  // app never resigns, so the outcome is worth saying in words.
  const closing = [
    outcome ?? stoppedAt(moves),
    `${colourName(side)} was played by you at level ${level}`,
  ]
  // Full stops between them: the outcome is written without one, because on
  // screen it has a line of its own.
  out.comment(`${closing.join('. ')}.`)
  out.token(result)

  return `${header.join('\n')}\n\n${out.text()}\n`
}
