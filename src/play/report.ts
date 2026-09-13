import { Chess } from 'chess.js'
import { MATE_PAWNS } from '../engine/uci'
import { positionKey } from '../model/position'
import type { Colour } from '../model/types'
import type { Evaluation } from './evalbar'
import { fullMove, type PlayedMove } from './session'

/**
 * Origin: London src/play/report.ts, adapted: the chess half only, so the book, the deviation and the course are gone; the evaluation map holds an Evaluation rather than a number; studentColour is userColour.
 * The post-game report, and the rules it follows (spec 18.5).
 *
 * Verdicts are given in words, never as a bare number, because a club player
 * reading "+0.73" learns nothing they can use. The bar keeps the number
 * instead: it is watched during the game, where a glance is all it gets, and
 * this is read afterwards (spec S18).
 *
 * Everything is written from the USER's side. That matters most for the
 * evaluations: they arrive in pawns from White's point of view, so for a user
 * playing Black a move that costs them something makes the number go up, not
 * down.
 *
 * The trainer's half about openings is not here, because this app has no
 * repertoire for a game to leave (Q19).
 */

/** What the bar thought of each position, by position (spec section 7). */
export type Evaluations = Map<string, Evaluation>

/**
 * And what the engine would have played there, as UCI, from the same search.
 * Kept beside the evaluations rather than inside them so that everything
 * reading a number keeps reading a number.
 */
export type BestMoves = Map<string, string>

export type MoveTag = 'blunder' | 'mistake' | 'inaccuracy'

export interface MoveReview {
  ply: number
  san: string
  /** Pawns from White's point of view before the move. */
  before: number
  /** And after it. */
  after: number
  /** How much the USER's position got worse. Negative means it improved. */
  loss: number
  tag: MoveTag
  /**
   * The engine's move in the position BEFORE this one, as SAN, when the scan
   * kept it and it is not the move that was played. Without it a report says a
   * move was an inaccuracy and nothing says what was better.
   */
  better?: string
}

export interface GameReport {
  /** The user's slips, most recent first. */
  slips: MoveReview[]
  /** The verdict on the final position, in words. */
  verdict: string
  /** The final evaluation in pawns from White's point of view, when known. */
  finalEval?: number
  /** How the game ended, when it ended by itself. */
  outcome?: string
  /** How many hints were used, when any were. */
  hints?: number
}

/**
 * How much a move cost the user, in pawns.
 *
 * The evaluations are from White's point of view, so the subtraction is turned
 * round for a user playing Black. A positive loss always means the user's
 * position got worse.
 */
export const SLIP_THRESHOLDS: { tag: MoveTag; loss: number }[] = [
  { tag: 'blunder', loss: 2 },
  { tag: 'mistake', loss: 1 },
  { tag: 'inaccuracy', loss: 0.5 },
]

function tagFor(loss: number): MoveTag | null {
  for (const level of SLIP_THRESHOLDS) {
    if (loss >= level.loss) return level.tag
  }
  return null
}

/**
 * Scans the user's moves for the ones that threw something away.
 *
 * Only the user's moves are scanned: this is a report on their play, not a
 * commentary on the engine's. A move is only judged when both positions around
 * it were evaluated, so a partial scan reports less rather than guessing.
 */
export function scanForSlips(
  moves: PlayedMove[],
  evaluations: Evaluations,
  userColour: Colour = 'white',
  bestMoves?: BestMoves,
): MoveReview[] {
  const slips: MoveReview[] = []
  for (const move of moves) {
    if (move.colour !== userColour) continue
    const before = evaluations.get(positionKey(move.fen))?.pawns
    const after = evaluations.get(positionKey(move.after))?.pawns
    if (before === undefined || after === undefined) continue
    const loss = userColour === 'white' ? before - after : after - before
    const tag = tagFor(loss)
    if (!tag) continue
    const better = betterMove(move, bestMoves?.get(positionKey(move.fen)))
    slips.push({
      ply: move.ply,
      san: move.san,
      before,
      after,
      loss,
      tag,
      ...(better ? { better } : {}),
    })
  }
  // Most recent first, not worst first: the report is read against the game
  // that has just been played, and the end of it is what is remembered.
  return slips.sort((a, b) => b.ply - a.ply)
}

/**
 * The verdict on a position, in words.
 *
 * The bands come from the trainer's section 5, which spec 18.5 keeps: under
 * 0.4 of a pawn is level, up to 1 is slightly better, up to 2.5 is clearly
 * better, and beyond that is winning.
 */
export function verdictInWords(pawns: number): string {
  const { band, ahead } = verdictBand(pawns)
  const side = ahead ? 'White' : 'Black'
  switch (band) {
    case 'mate':
      return `${side} has a forced mate`
    case 'level':
      return 'Level'
    case 'slight':
      return `Slightly better for ${side}`
    case 'clear':
      return `Clearly better for ${side}`
    case 'winning':
      return `Winning for ${side}`
  }
}

/** How big an advantage is, and whose. */
export function verdictBand(pawns: number): {
  band: 'mate' | 'level' | 'slight' | 'clear' | 'winning'
  /** True when the number favours White. Meaningless when the band is level. */
  ahead: boolean
} {
  const size = Math.abs(pawns)
  const ahead = pawns > 0
  if (size >= MATE_PAWNS) return { band: 'mate', ahead }
  if (size < 0.4) return { band: 'level', ahead }
  if (size < 1) return { band: 'slight', ahead }
  if (size < 2.5) return { band: 'clear', ahead }
  return { band: 'winning', ahead }
}

/**
 * A slip as a sentence.
 *
 * When both sides of the move fall in the same band, saying it turned one
 * verdict into the same verdict reads as nonsense, however true it is. A
 * position can get worse without changing what it is called, so say that
 * instead.
 */
export function describeSlip(slip: MoveReview): string {
  const name = { blunder: 'A blunder', mistake: 'A mistake', inaccuracy: 'An inaccuracy' }[slip.tag]
  const before = verdictInWords(slip.before).toLowerCase()
  const after = verdictInWords(slip.after).toLowerCase()
  const where = `${name} on move ${fullMove(slip.ply)}: ${slip.san}`
  const said =
    before === after
      ? `${where} gave up more ground in a position already ${before}.`
      : `${where} turned "${before}" into "${after}".`
  // "Preferred", not "better was": at the scan's fixed effort this is the
  // engine's choice, and the wording keeps that honest.
  return slip.better ? `${said} The engine preferred ${numberedMove(slip.ply, slip.better)}.` : said
}

/**
 * The engine's move as SAN, converted on the position the slip was played
 * FROM: the same UCI string means a different move on any other board. Absent
 * when the engine's move is the move that was played, which cannot be a slip
 * and would only say so to a reader who already knows.
 */
function betterMove(move: PlayedMove, uci: string | undefined): string | undefined {
  if (!uci) return undefined
  try {
    const chess = new Chess(move.fen)
    const played = chess.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci[4] : undefined,
    })
    return played.san === move.san ? undefined : played.san
  } catch {
    return undefined
  }
}

/**
 * A move as the move list writes it: "4.Nc3" for White, "4...Nc3" for Black.
 * The ply is the move's own, so the number is the move's own too.
 */
export function numberedMove(ply: number, san: string): string {
  return `${fullMove(ply)}${ply % 2 === 0 ? '.' : '...'}${san}`
}

/**
 * Where an unfinished game got to, as the sentence that stands in for an
 * outcome.
 *
 * One home, because two things say it: the report built when a game is stopped
 * and reviewed, and the closing comment of a game saved before it ends (spec
 * 9.1). A second copy is how the file and the report would one day disagree
 * about the same game.
 *
 * A game with no moves in it is the one case the trainer never meets, because a
 * trainer game is recorded when it is over. Here a game can be stopped or saved
 * on a board that has just been set up, and "Stopped after move 1" would be a
 * move that was never played.
 */
export function stoppedAt(moves: PlayedMove[]): string {
  if (moves.length === 0) return 'Stopped before the first move'
  return `Stopped after move ${fullMove(moves.length - 1)}`
}

/** Puts the whole report together. */
export function buildReport(
  moves: PlayedMove[],
  evaluations: Evaluations,
  userColour: Colour,
  outcome?: string,
  hints = 0,
  bestMoves?: BestMoves,
): GameReport {
  const last = moves.at(-1)
  const finalEval = last ? evaluations.get(positionKey(last.after))?.pawns : undefined
  return {
    slips: scanForSlips(moves, evaluations, userColour, bestMoves),
    // A mated final position has no evaluation to scan, because the engine
    // has no move to search. The outcome has already said what the position
    // is, and "Not scanned" beside a checkmate reads as a fault in the scan.
    verdict:
      finalEval !== undefined
        ? verdictInWords(finalEval)
        : outcome && /checkmate/.test(outcome)
          ? outcome
          : 'Not scanned',
    finalEval,
    outcome,
    // Left off entirely when there were none, so a clean game carries no
    // mention of hints anywhere: not in the report, not in the PGN.
    ...(hints > 0 ? { hints } : {}),
  }
}
