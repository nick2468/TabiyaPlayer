import type { Engine, SearchResult } from '../engine'
import { positionKey, sideToMove } from '../model/position'
import { engineByProfile } from './by-profile'
import { fakeEngine } from './fake-engine'

/**
 * An engine that scores each POSITION rather than every search the same.
 *
 * It exists because a slip is a CHANGE of evaluation across one move, so a test
 * that wants a blunder has to be able to say what the position was worth before
 * the move and what it was worth after it. Every other fake here answers one
 * number to every question, and against those no scan can ever produce a slip:
 * the difference is always zero.
 *
 * Its ANALYSIS answers look the position up by `positionKey`, which is the same
 * key the evaluation map and the scan use, and fall back to level for a position
 * the test did not mention. Its PLAYING answers come from a script, exactly as
 * `scriptedEngine`'s do, so a test can write both sides of the game it wants and
 * then say what each position was worth.
 *
 * The scores are given in PAWNS FROM WHITE'S POINT OF VIEW, which is how the bar
 * and the report read them, and turned round here for a position where Black is
 * to move, because that is the direction a real engine reports in.
 */
export function scoredEngine(scores: Record<string, number>, moves: string[] = []): Engine {
  const queue = [...moves]
  const plain = fakeEngine()
  return engineByProfile({
    analysis: async (fen: string, movetime: number): Promise<SearchResult> => {
      const white = scores[positionKey(fen)] ?? 0
      const centipawns = Math.round(white * 100) * (sideToMove(fen) === 'white' ? 1 : -1)
      const { bestMove, candidates } = await plain.search(fen, movetime)
      return {
        bestMove,
        candidates: candidates.map((candidate) => ({
          ...candidate,
          score: { kind: 'cp', centipawns },
        })),
      }
    },
    playing: async (fen: string, movetime: number): Promise<SearchResult> => {
      const next = queue.shift()
      if (!next) return plain.search(fen, movetime)
      return {
        bestMove: next,
        candidates: [{ move: next, score: { kind: 'cp', centipawns: 0 }, depth: 10 }],
      }
    },
  })
}
