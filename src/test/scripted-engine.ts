import type { Engine, SearchResult } from '../engine'
import { fakeEngine } from './fake-engine'

/**
 * An engine that plays a script: each search answers the next queued move, in
 * coordinate notation (`e7e5`, then `b8c6`, ...), and falls back to the first
 * legal move once the queue is empty.
 *
 * It exists because a test that wants a checkmate needs the engine to
 * cooperate, and `fakeEngine`'s single `move` override cannot vary by
 * position. Every search takes the next move, so anything else that searches
 * (the bar's evaluation, from phase 4) takes moves from the script too.
 */
export function scriptedEngine(moves: string[]): Engine {
  const queue = [...moves]
  const fallback = fakeEngine()
  return fakeEngine({
    search: async (fen: string, movetime: number): Promise<SearchResult> => {
      const next = queue.shift()
      if (!next) return fallback.search(fen, movetime)
      return {
        bestMove: next,
        candidates: [{ move: next, score: { kind: 'cp', centipawns: 0 }, depth: 10 }],
      }
    },
  })
}
