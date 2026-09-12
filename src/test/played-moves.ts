import { Chess } from 'chess.js'
import type { PlayedMove } from '../play'

/**
 * Origin: London src/play/game-pgn.test.ts playedMoves, identical.
 * A list of SANs as the session would have played them.
 *
 * Three test files want a game to write out: the PGN writer's, the reader's,
 * and the screen's. Building one through a real `PlaySession` would need an
 * engine and an await for a game that is only ever going to be turned into
 * text, so the moves are made here instead, with the ply numbers and the two
 * positions the writer reads.
 */
export function playedMoves(sans: string[]): PlayedMove[] {
  const chess = new Chess()
  return sans.map((san, index) => {
    const fen = chess.fen()
    const move = chess.move(san)
    return {
      ply: index,
      san: move.san,
      colour: move.color === 'w' ? ('white' as const) : ('black' as const),
      fen,
      after: chess.fen(),
    }
  })
}
