import type { Engine, SearchResult } from '../engine'
import { engineByProfile } from './by-profile'
import { fakeEngine } from './fake-engine'

/**
 * An engine that plays a script: each move answers the next queued one, in
 * coordinate notation (`e7e5`, then `b8c6`, ...), and falls back to the first
 * legal move once the queue is empty.
 *
 * It exists because a test that wants a checkmate needs the engine to
 * cooperate, and `fakeEngine`'s single `move` override cannot vary by position.
 *
 * The script answers the engine's MOVES and nothing else. The bar evaluates
 * after every move and a hint searches on request, and a script that answered
 * those would hand its next move to the bar and leave the game whatever was
 * left. `engineByProfile` is what keeps them apart.
 */
export function scriptedEngine(moves: string[]): Engine {
  const queue = [...moves]
  const plain = fakeEngine()
  return engineByProfile({
    analysis: plain.search,
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
