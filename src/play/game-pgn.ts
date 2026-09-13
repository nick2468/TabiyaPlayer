import { Movetext, pgnTag } from '../model/pgn'
import { colourName, type Colour } from '../model/types'
import {
  numberedMove,
  stoppedAt,
  verdictInWords,
  type GameReport,
  type MoveReview,
} from './report'
import type { PlayedMove } from './session'

/**
 * Origin: London src/play/game-pgn.ts, adapted: the deviation comments go with the repertoire that had them, the report is optional because a game can be saved before it is reviewed, Site is the standard's "-", and saveFileName is new.
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
  /**
   * The report, once the game has been reviewed (spec 18.6). Absent for a game
   * saved before it is reviewed, and then the file is exactly spec 9.1's.
   */
  report?: GameReport
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
 * Origin: London src/play/game-pgn.ts slipComment, identical.
 * How a slip reads in a comment: short, because it sits inside the moves.
 */
function slipComment(slip: MoveReview): string {
  const was = verdictInWords(slip.before).toLowerCase()
  const now = verdictInWords(slip.after).toLowerCase()
  const said =
    was === now
      ? `${slip.tag}: gave up more ground in a position already ${was}`
      : `${slip.tag}: ${was} to ${now}`
  return slip.better
    ? `${said}; the engine preferred ${numberedMove(slip.ply, slip.better)}`
    : said
}

export function gameToPgn(game: GameForPgn): string {
  const { moves, side, level, outcome, report } = game
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

  // Keyed by the ply of the move it belongs to, so the writer can ask each move
  // what the report had to say about it.
  const slips = new Map((report?.slips ?? []).map((slip) => [slip.ply, slip]))

  const out = new Movetext()
  // Before the first move, which is where PGN puts a comment about the game
  // rather than about a position. A game played with help is a different game
  // from one played without it, and anyone reading this should know which.
  if (report?.hints) {
    out.comment(`Played with ${report.hints} ${report.hints === 1 ? 'hint' : 'hints'}.`)
  }
  for (const move of moves) {
    out.move(move.san, move.ply)
    const slip = slips.get(move.ply)
    if (slip) out.comment(slipComment(slip))
  }

  // One comment at the end, saying what the moves do not: how the game stood
  // when it was written out, and who was playing which side against what.
  // "1-0" does not say whether it was a mate or a resignation, and this app
  // never resigns, so the outcome is worth saying in words. A reviewed game
  // ends on the verdict as well, so a reader finishes on what the engine made
  // of it (spec 18.6).
  const ending = outcome ?? stoppedAt(moves)
  const closing = report ? [report.verdict] : []
  // Not twice. A game that ended in a checkmate has the outcome AS its verdict,
  // because a mated position has no evaluation to put in words, and the
  // trainer's writer says it in both slots: "You won by checkmate. You won by
  // checkmate." Carried back to the trainer in the phase notes.
  if (!closing.includes(ending)) closing.push(ending)
  closing.push(`${colourName(side)} was played by you at level ${level}`)
  // Full stops between them: the verdict and the outcome are both written
  // without one, because on screen each has a line of its own.
  out.comment(`${closing.join('. ')}.`)
  out.token(result)

  return `${header.join('\n')}\n\n${out.text()}\n`
}
