import { afterEach, describe, expect, it } from 'vitest'
import { forgetGame, recallGame, rememberGame, type RememberedGame } from './current-game'

/**
 * The remembered game, read back.
 *
 * Every case here is one a real profile can produce: nothing stored yet, a
 * record from a version that does not exist, a hand-edited value, half a
 * record, and a browser that refuses storage. All of them have the same
 * answer, which is the whole point: null, and the app starts a fresh game.
 */

const KEY = 'simply-chess.game'

interface Store {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const slot = globalThis as unknown as { localStorage?: Store }

function stubStorage(values: Record<string, string> = {}): Record<string, string> {
  slot.localStorage = {
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value
    },
    removeItem: (key) => {
      delete values[key]
    },
  }
  return values
}

/** Stores anything at all under the game's key, however malformed. */
function storeRaw(text: string): void {
  stubStorage({ [KEY]: text })
}

const game: RememberedGame = {
  version: 1,
  sans: ['d4', 'd5', 'Bf4'],
  side: 'white',
  level: 6,
}

afterEach(() => {
  delete slot.localStorage
})

describe('the remembered game', () => {
  it('round trips', () => {
    stubStorage()
    rememberGame(game)
    expect(recallGame()).toEqual(game)
  })

  it('remembers a game played as Black', () => {
    stubStorage()
    rememberGame({ ...game, side: 'black', level: 1 })
    expect(recallGame()?.side).toBe('black')
    expect(recallGame()?.level).toBe(1)
  })

  it('gives null when nothing is stored', () => {
    stubStorage()
    expect(recallGame()).toBeNull()
  })

  it('forgets a game when told to', () => {
    const values = stubStorage()
    rememberGame(game)
    forgetGame()
    expect(values[KEY]).toBeUndefined()
    expect(recallGame()).toBeNull()
  })
})

describe('a record that does not make sense', () => {
  it('gives null on text that is not JSON', () => {
    storeRaw('{ this is not json')
    expect(recallGame()).toBeNull()
  })

  it('gives null on JSON that is not a record', () => {
    storeRaw('"a game"')
    expect(recallGame()).toBeNull()
    storeRaw('null')
    expect(recallGame()).toBeNull()
    storeRaw('[1, 2, 3]')
    expect(recallGame()).toBeNull()
  })

  it('gives null on another version', () => {
    storeRaw(JSON.stringify({ ...game, version: 2 }))
    expect(recallGame()).toBeNull()
    storeRaw(JSON.stringify({ ...game, version: '1' }))
    expect(recallGame()).toBeNull()
  })

  it('gives null when the moves are not a list of strings', () => {
    storeRaw(JSON.stringify({ ...game, sans: 'd4 d5' }))
    expect(recallGame()).toBeNull()
    storeRaw(JSON.stringify({ ...game, sans: ['d4', 7] }))
    expect(recallGame()).toBeNull()
    storeRaw(JSON.stringify({ version: 1, side: 'white', level: 4 }))
    expect(recallGame()).toBeNull()
  })

  it('gives null on a side that is not a colour', () => {
    storeRaw(JSON.stringify({ ...game, side: 'red' }))
    expect(recallGame()).toBeNull()
    storeRaw(JSON.stringify({ ...game, side: null }))
    expect(recallGame()).toBeNull()
  })

  it('gives null on a level off the scale', () => {
    storeRaw(JSON.stringify({ ...game, level: 9 }))
    expect(recallGame()).toBeNull()
    storeRaw(JSON.stringify({ ...game, level: 'club' }))
    expect(recallGame()).toBeNull()
  })

  /**
   * An empty list is a legal record and is left to `canReplayMoves`, which
   * refuses it: a game with no moves is not a game to reopen, and the provider
   * removes the record rather than writing one.
   */
  it('keeps an empty list, and lets the replay check refuse it', () => {
    storeRaw(JSON.stringify({ ...game, sans: [] }))
    expect(recallGame()?.sans).toEqual([])
  })
})

describe('storage that refuses', () => {
  it('gives null and does not throw', () => {
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
    expect(() => rememberGame(game)).not.toThrow()
    expect(() => forgetGame()).not.toThrow()
    expect(recallGame()).toBeNull()
  })
})
