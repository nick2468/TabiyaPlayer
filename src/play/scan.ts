import type { Engine } from '../engine'
import { positionKey, sideToMove } from '../model/position'
import { evaluationOf } from './evalbar'
import type { BestMoves, Evaluations } from './report'
import type { PlayedMove } from './session'

/**
 * Origin: London src/play/session.ts scanGame, adapted: the map holds an Evaluation rather than a number, and the caller puts the engine at the analysis profile.
 * Evaluates every position of a game at a fixed effort, for the blunder scan
 * (spec 18.5).
 *
 * Fixed effort matters: the scan compares positions with each other, so they
 * all have to be judged by the same standard.
 *
 * `known` is what the live bar already worked out during the game, at this
 * same effort and this same profile. Handing it over is not only a saving. It
 * means the report judges the game by the exact numbers the user was watching,
 * so a position the bar called level cannot be called a blunder afterwards by a
 * search that happened to see one ply further.
 *
 * The trainer sets the analysis profile inside this function and never puts the
 * playing one back. Here the caller wraps the whole scan in `atAnalysisProfile`
 * instead, so the level the game is being played at is restored in a `finally`
 * even when the scan throws (spec 6.3). A scan that left the engine at level 8
 * would quietly change the game Keep playing hands back.
 */
export async function scanGame(
  moves: PlayedMove[],
  engine: Engine,
  movetime: number,
  onProgress?: (done: number, total: number) => void,
  known?: Evaluations,
  knownBest?: BestMoves,
): Promise<{ evaluations: Evaluations; bestMoves: BestMoves }> {
  const evaluations: Evaluations = new Map(known)
  // The engine's move at each position, from the same search as the number.
  // One search per position: the best move is in the answer already.
  const bestMoves: BestMoves = new Map(knownBest)
  const positions: { key: string; fen: string }[] = []
  const seen = new Set<string>()

  const add = (fen: string) => {
    const key = positionKey(fen)
    if (seen.has(key) || evaluations.has(key)) return
    seen.add(key)
    positions.push({ key, fen })
  }
  for (const move of moves) {
    add(move.fen)
    add(move.after)
  }

  for (const [index, position] of positions.entries()) {
    const result = await engine.search(position.fen, movetime)
    const best = result.candidates[0]
    // The engine's score is from the side to move and the bar's number is from
    // White's, so the side is read here, where it is still known.
    if (best) evaluations.set(position.key, evaluationOf(best.score, sideToMove(position.fen)))
    const move = result.bestMove ?? best?.move
    if (move) bestMoves.set(position.key, move)
    onProgress?.(index + 1, positions.length)
  }
  return { evaluations, bestMoves }
}
