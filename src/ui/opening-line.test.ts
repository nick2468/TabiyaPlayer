import { describe, expect, it } from 'vitest'
import { openingLine } from './opening-line'

/**
 * The opening line in the head row (spec 18.1).
 *
 * One sentence, and the two things in it are the running game's, not the
 * settings': the side is fixed until the next new game and the level can be
 * changed mid-game. The wording is the trainer's shape with this app's two
 * facts in it.
 */
describe('the opening line', () => {
  it('names the side and the level', () => {
    expect(openingLine('white', 4)).toBe('Playing White against 4. Club')
    expect(openingLine('black', 8)).toBe('Playing Black against 8. Unpleasant')
  })

  it('names every level the app offers', () => {
    for (let level = 1; level <= 8; level += 1) {
      expect(openingLine('white', level)).toMatch(/^Playing White against \d\. \S/)
    }
  })
})
