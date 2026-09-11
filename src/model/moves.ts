import { Chess } from 'chess.js'

/**
 * Origin: London src/model/grade.ts, the two board-move helpers only; the sanForMove comment describes this app.
 * Turning a move made on the board into a chess move, and back.
 *
 * The rest of the trainer's `grade.ts` grades drill answers, which this app
 * does not have. These two are the only part it uses.
 */

/** The squares a SAN move runs between, or null when it is not legal here. */
export function squaresForSan(fen: string, san: string): { from: string; to: string } | null {
  const chess = new Chess(fen)
  try {
    const move = chess.move(san)
    return { from: move.from, to: move.to }
  } catch {
    return null
  }
}

/**
 * Turns a move made on the board into SAN, or null when it is not legal.
 * A promotion becomes a queen unless the piece is given: the promotion picker
 * passes the letter it was given.
 */
export function sanForMove(fen: string, from: string, to: string, promotion = 'q'): string | null {
  const chess = new Chess(fen)
  try {
    return chess.move({ from, to, promotion }).san
  } catch {
    return null
  }
}
