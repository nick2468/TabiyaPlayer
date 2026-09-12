import type { Engine, SearchResult } from '../engine'
import { engineByProfile } from './by-profile'
import { fakeEngine } from './fake-engine'

/**
 * An engine whose MOVE waits until the test lets it go.
 *
 * Some of what this app does can only be seen while the engine is thinking:
 * the status line says whose turn it is, four buttons grey, the board locks,
 * and the bar holds its last value rather than emptying. A fake that answers at
 * once never shows any of it, so this one stops on the way and waits.
 *
 * Its evaluations are not held, and that is the point rather than an accident.
 * A held evaluation would hold the whole move that asked for it, and the game
 * would never reach the state the test is trying to look at.
 */
export function heldEngine(overrides: { move?: string; cp?: number } = {}): {
  engine: Engine
  /** Lets the move through. Calling it twice is harmless. */
  release: () => void
} {
  let letGo: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    letGo = resolve
  })
  const plain = fakeEngine(overrides)
  const engine = engineByProfile({
    analysis: plain.search,
    playing: async (fen: string, movetime: number): Promise<SearchResult> => {
      await held
      return plain.search(fen, movetime)
    },
  })
  return { engine, release: () => letGo() }
}
