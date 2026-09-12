import { describe, expect, it } from 'vitest'
import { levelOrNull } from './level'

/**
 * Moved here from `storage/prefs.test.ts` in phase 5, with the function. Three
 * things now read a level back from outside the app, and one of them is a PGN
 * file.
 */
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
