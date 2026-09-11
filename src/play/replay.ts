import { Chess } from 'chess.js'

/**
 * Origin: London src/ui/play-on.ts canReplayMoves, adapted: the comment names a stored game, and the moves are readonly.
 * Whether a list of moves can be put back on a board.
 *
 * The moves of a real game are legal chess whatever happens next, so this only
 * fails on a record that has been damaged or hand-edited. It is still checked
 * before a game is started, because the alternative is the session's
 * constructor throwing halfway through a replay and a screen with an engine
 * message on it where the board should be.
 */
export function canReplayMoves(sans: readonly string[]): boolean {
  if (sans.length === 0) return false
  const chess = new Chess()
  for (const san of sans) {
    try {
      chess.move(san)
    } catch {
      return false
    }
  }
  return true
}
