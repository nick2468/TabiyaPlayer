import { describe, expect, it } from 'vitest'
import { scrollToShow } from './keep-in-view'

/**
 * The move list's scroll, as arithmetic (spec 5.7).
 *
 * The behaviour this pins is that a row already showing moves nothing. The
 * fault it was written for was the opposite one: a scroll that went further
 * than the list it belonged to.
 */

/** A list showing from 100 to 300, in the coordinates a rectangle comes in. */
const LIST = { top: 100, bottom: 300 }

describe('scrollToShow', () => {
  it('leaves a row that is already showing alone', () => {
    expect(scrollToShow({ top: 150, bottom: 170 }, LIST)).toBe(0)
    expect(scrollToShow({ top: 100, bottom: 120 }, LIST)).toBe(0)
    expect(scrollToShow({ top: 280, bottom: 300 }, LIST)).toBe(0)
  })

  it('scrolls down by what a row below the box overhangs', () => {
    expect(scrollToShow({ top: 300, bottom: 320 }, LIST)).toBe(20)
  })

  it('scrolls up by what a row above the box overhangs', () => {
    expect(scrollToShow({ top: 80, bottom: 100 }, LIST)).toBe(-20)
  })

  it('measures from the row, so a long list is one move, not one row at a time', () => {
    expect(scrollToShow({ top: 1000, bottom: 1020 }, LIST)).toBe(720)
  })
})
