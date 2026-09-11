import { whitePovPawns, type Score } from '../engine'
import { positionKey } from '../model/position'
import type { Colour } from '../model/types'

/**
 * Origin: London src/play/evalbar.ts, adapted: an evaluation is { pawns, text }, evalText and evaluationOf are new, and the words are this app's.
 * How the evaluation bar is drawn, as arithmetic rather than as markup.
 *
 * Three decisions, all easy to get backwards, which is why they are here where
 * a test can reach them without a DOM.
 *
 * The share is squashed with tanh rather than scaled, because the difference
 * between level and a pawn up matters and the difference between five pawns
 * and six does not.
 *
 * The orientation is the one people get wrong. The bar follows the BOARD, so
 * the user's own colour is at the bottom of it wherever they sit: "more of my
 * colour" then reads as "good for me" without anyone having to think. When the
 * user plays Black, White's share grows downwards from the top.
 *
 * The number on the bar is always from White's point of view (spec section 7),
 * but the engine reports a score, a mate above all, from the side to move. So
 * the text is made once, where the side to move is known, and kept beside the
 * pawns rather than worked out again from a score that has lost its side.
 */

/** What the bar shows for one position. */
export interface Evaluation {
  /** Pawns from White's point of view; a mate is plus or minus MATE_PAWNS. */
  pawns: number
  /** The string the bar prints: "+0.4", "-1.2", "0.0", "M5", "-M5". */
  text: string
}

export interface EvalBarLayout {
  /** White's share of the bar, 0 to 100. */
  whiteShare: number
  /** True when White's share is drawn up from the bottom. */
  whiteAtBottom: boolean
}

/** One evaluation, from the engine's score and the side it was to move. */
export function evaluationOf(score: Score, sideToMove: Colour): Evaluation {
  return { pawns: whitePovPawns(score, sideToMove), text: evalText(score, sideToMove) }
}

/**
 * What the bar prints for a score: pawns from White's side with one decimal
 * and a sign, or a mate count, signed minus when Black mates.
 *
 * A mate's `moves` is from the side to move: positive when it mates, negative
 * when it is mated, and 0 when it is mated already. Nothing rounds to "-0.0":
 * a level position has no sign.
 */
export function evalText(score: Score, sideToMove: Colour): string {
  if (score.kind === 'cp') {
    const pawns = whitePovPawns(score, sideToMove)
    const text = Math.abs(pawns).toFixed(1)
    if (text === '0.0') return text
    return pawns > 0 ? `+${text}` : `-${text}`
  }
  const moverMates = score.moves > 0
  const whiteMates = moverMates === (sideToMove === 'white')
  return `${whiteMates ? '' : '-'}M${Math.abs(score.moves)}`
}

/** White's share of a bar, from an evaluation in pawns from White's side. */
export function evalShare(pawns: number): number {
  return 50 + 50 * Math.tanh(pawns / 3)
}

/** The bar, given the evaluation and which colour the user is playing. */
export function evalBarLayout(pawns: number, userColour: Colour): EvalBarLayout {
  return { whiteShare: evalShare(pawns), whiteAtBottom: userColour === 'white' }
}

/**
 * The evaluation to show for a position, which may not be its own.
 *
 * The bar holds its last value while the engine thinks rather than emptying
 * or animating: a bar that blanks itself twice a move is harder to read than
 * one that is a moment behind, and the status line already says who is
 * thinking. So this walks back through the game to the most recent position
 * that has been evaluated, and returns nothing only when none has.
 *
 * `moves` asks only for each move's starting position, which is all this
 * reads, so the session's played moves can be passed as they are.
 */
export function shownEvaluation(
  fen: string,
  moves: { fen: string }[],
  evaluations: Map<string, Evaluation>,
): Evaluation | undefined {
  const found = evaluations.get(positionKey(fen))
  if (found !== undefined) return found
  for (let index = moves.length - 1; index >= 0; index -= 1) {
    const earlier = evaluations.get(positionKey(moves[index].fen))
    if (earlier !== undefined) return earlier
  }
  return undefined
}
