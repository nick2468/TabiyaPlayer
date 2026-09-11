import { afterEach, describe, expect, it } from 'vitest'
import { BOARD_SIZES, SIDES, levelOrNull, read, readOneOf, remove, write } from './prefs'

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
    write('simple-chess.side', 'black')
    expect(read('simple-chess.side')).toBe('black')
    remove('simple-chess.side')
    expect(read('simple-chess.side')).toBeNull()
  })

  it('carries on when storage refuses', () => {
    refusingStorage()
    expect(() => write('simple-chess.side', 'black')).not.toThrow()
    expect(() => remove('simple-chess.side')).not.toThrow()
    expect(read('simple-chess.side')).toBeNull()
  })

  it('carries on when there is no storage at all', () => {
    expect(read('simple-chess.side')).toBeNull()
    expect(() => write('simple-chess.side', 'black')).not.toThrow()
  })
})

describe('readOneOf', () => {
  it('takes a stored word that is one of the allowed ones', () => {
    stubStorage({ 'simple-chess.side': 'black' })
    expect(readOneOf('simple-chess.side', SIDES, 'white')).toBe('black')
  })

  it('falls back when the stored word is not one of them', () => {
    stubStorage({ 'simple-chess.board-size': 'enormous' })
    expect(readOneOf('simple-chess.board-size', BOARD_SIZES, 'small')).toBe('small')
  })

  it('falls back when nothing is stored', () => {
    stubStorage()
    expect(readOneOf('simple-chess.board-size', BOARD_SIZES, 'small')).toBe('small')
  })
})

describe('levelOrNull', () => {
  it('takes a level on the scale, written either way', () => {
    expect(levelOrNull(6)).toBe(6)
    expect(levelOrNull('6')).toBe(6)
    expect(levelOrNull(1)).toBe(1)
    expect(levelOrNull(8)).toBe(8)
  })

  it('refuses a number off the scale', () => {
    expect(levelOrNull(0)).toBeNull()
    expect(levelOrNull(9)).toBeNull()
    expect(levelOrNull(-4)).toBeNull()
  })

  it('refuses anything that is not a whole level', () => {
    expect(levelOrNull(4.5)).toBeNull()
    expect(levelOrNull('club')).toBeNull()
    expect(levelOrNull(null)).toBeNull()
    expect(levelOrNull(undefined)).toBeNull()
    expect(levelOrNull(true)).toBeNull()
    expect(levelOrNull({ level: 4 })).toBeNull()
  })
})
