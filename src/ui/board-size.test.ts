import { describe, expect, it } from 'vitest'
import { BOARD_SIZE, BOARD_SIZE_LARGE, fitBoardSize } from './board-size'

/**
 * The fit rule (spec S15 item 11).
 *
 * The viewports are the three of spec 15.2: the Windows window as it opens,
 * an iPad in landscape, and an iPad held upright. The numbers below are what
 * the rule must give at each, and each one was checked against the real screen
 * in the pane.
 */

/** The large board, at a viewport, in the layout that viewport gets. */
function large(width: number, height: number, narrow = false): number {
  return fitBoardSize(BOARD_SIZE_LARGE, width, height, narrow)
}

describe('the large board', () => {
  it('is 808 in the Windows window, which is 1000 tall and not 1040', () => {
    // 1000 - 81 above - 110 below leaves 809, and 808 is the multiple of 8 in it.
    expect(large(1280, 1000)).toBe(808)
  })

  it('is 624 on a landscape iPad, where the height runs out first', () => {
    expect(large(1180, 820)).toBe(624)
  })

  it('is 728 on an upright iPad, where the width runs out first', () => {
    // The sidebar is under the board below 900, so only the bar is beside it.
    expect(large(820, 1180, true)).toBe(728)
  })

  it('is the full 832 on a screen with room for it', () => {
    expect(large(1600, 1200)).toBe(832)
  })

  it('never goes below the small board, however small the viewport', () => {
    expect(large(320, 480)).toBe(BOARD_SIZE)
    expect(large(1, 1)).toBe(BOARD_SIZE)
  })

  it('always divides by eight', () => {
    for (let height = 500; height <= 1200; height += 7) {
      expect(large(1280, height) % 8).toBe(0)
    }
  })
})

describe('the small board', () => {
  it('is 416 at every viewport this app is used at', () => {
    expect(fitBoardSize(BOARD_SIZE, 1280, 1000, false)).toBe(BOARD_SIZE)
    expect(fitBoardSize(BOARD_SIZE, 1180, 820, false)).toBe(BOARD_SIZE)
    expect(fitBoardSize(BOARD_SIZE, 820, 1180, true)).toBe(BOARD_SIZE)
  })

  it('is never given more than it asked for', () => {
    expect(fitBoardSize(BOARD_SIZE, 1600, 1200, false)).toBe(BOARD_SIZE)
  })
})

describe('the narrow layout', () => {
  it('gives the board the width the sidebar would have taken', () => {
    expect(large(820, 1180, true)).toBeGreaterThan(large(820, 1180, false))
  })
})
