import { Chess } from 'chess.js'
import type { PlayedMove } from './session'

/**
 * Origin: London src/play/replay.ts, adapted: PlayedMove is this app's, from session.ts, and canReplayMoves joins it from London src/ui/play-on.ts.
 * Walking a finished game, position by position.
 *
 * A reviewed game becomes a viewer (spec 18.4): the board holds the final
 * position and the report names moves without showing them, so the report is
 * only half an answer until the moves it names can be looked at. This is the
 * arithmetic behind that, kept out of the screen where a test can reach it.
 *
 * A REPLAY PLY is a count of moves played, from 0 to `moves.length`, so it
 * numbers the POSITIONS rather than the moves. Ply 0 is where the game
 * started; ply n is the position after the nth move. The useful consequence:
 * the position before the move at index p is replay ply p, and the position
 * after it is p + 1, which is what makes a slip clickable.
 *
 * Nothing here writes. The session's moves are the game and they do not move
 * while somebody looks at them.
 */

/** The position after `ply` moves, or null when there is no game to walk. */
export function positionAtPly(moves: PlayedMove[], ply: number): string | null {
  if (moves.length === 0) return null
  const clamped = clampPly(moves, ply)
  return clamped === 0 ? moves[0].fen : moves[clamped - 1].after
}

/** The move that led to this position, for the board's last-move highlight. */
export function moveAtPly(moves: PlayedMove[], ply: number): PlayedMove | null {
  const clamped = clampPly(moves, ply)
  return clamped === 0 ? null : moves[clamped - 1]
}

/** Keeps a replay ply inside the game, so a key held down cannot walk off it. */
export function clampPly(moves: PlayedMove[], ply: number): number {
  return Math.max(0, Math.min(moves.length, Math.round(ply)))
}

/**
 * Where to put the board to SHOW a move being considered.
 *
 * The position before it, not after it: the report says a move was a mistake,
 * and the question that answers is what else was on offer, which is only
 * visible from the position the move was played in.
 */
export function plyBeforeMove(movePly: number): number {
  return Math.max(0, movePly)
}

/** And the position the move led to, for anything that wants the result. */
export function plyAfterMove(movePly: number): number {
  return Math.max(0, movePly) + 1
}

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
