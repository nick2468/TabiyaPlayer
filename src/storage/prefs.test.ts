import { afterEach, describe, expect, it } from 'vitest'
import { BOARD_SIZES, SIDES, read, readOneOf, remove, write } from './prefs'

/**
 * The helpers every setting goes through.
 *
 * The three hooks are covered by `remembered.dom.test.tsx`, which mounts them
 * and presses the controls. What is worth a string test is the reading: a good
 * value, a scrambled one, a missing one, and storage that refuses outright,
 * because those four are what a hand-edited or locked-down profile produces
 * and none of them may stop the app from opening.
 */

interface Store {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const slot = globalThis as unknown as { localStorage?: Store }

/** A storage stand-in, because node has none of its own. */
function stubStorage(values: Record<string, string> = {}): void {
  slot.localStorage = {
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value
    },
    removeItem: (key) => {
      delete values[key]
    },
  }
}

/** A browser that refuses storage: every call throws, as a private window can. */
function refusingStorage(): void {
  slot.localStorage = {
    getItem: () => {
      throw new Error('refused')
    },
    setItem: () => {
      throw new Error('refused')
    },
    removeItem: () => {
      throw new Error('refused')
    },
  }
}

afterEach(() => {
  delete slot.localStorage
})

describe('reading and writing', () => {
  it('reads back what it wrote, and forgets what it removed', () => {
    stubStorage()
    write('simply-chess.side', 'black')
    expect(read('simply-chess.side')).toBe('black')
    remove('simply-chess.side')
    expect(read('simply-chess.side')).toBeNull()
  })

  it('carries on when storage refuses', () => {
    refusingStorage()
    expect(() => write('simply-chess.side', 'black')).not.toThrow()
    expect(() => remove('simply-chess.side')).not.toThrow()
    expect(read('simply-chess.side')).toBeNull()
  })

  it('carries on when there is no storage at all', () => {
    expect(read('simply-chess.side')).toBeNull()
    expect(() => write('simply-chess.side', 'black')).not.toThrow()
  })
})

describe('readOneOf', () => {
  it('takes a stored word that is one of the allowed ones', () => {
    stubStorage({ 'simply-chess.side': 'black' })
    expect(readOneOf('simply-chess.side', SIDES, 'white')).toBe('black')
  })

  it('falls back when the stored word is not one of them', () => {
    stubStorage({ 'simply-chess.board-size': 'enormous' })
    expect(readOneOf('simply-chess.board-size', BOARD_SIZES, 'small')).toBe('small')
  })

  it('falls back when nothing is stored', () => {
    stubStorage()
    expect(readOneOf('simply-chess.board-size', BOARD_SIZES, 'small')).toBe('small')
  })
})

// `levelOrNull` moved to src/play/level.ts in phase 5, with its tests. A PGN
// file names a level too, and src/play imports no React (spec S13).
