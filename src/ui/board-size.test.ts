import { describe, expect, it } from 'vitest'
import { BOARD_SIZE, BOARD_SIZE_LARGE, fitBoardSize } from './board-size'

/**
 * The fit rule (spec S15 item 11).
 *
 * The viewports are the three of spec 15.2: the Windows window as it opens,
 * an iPad in landscape, and an iPad held upright. The display scales are the
 * ones this app is actually used at: 1 and 2 are whole, and 1.25 and 1.5 are
 * what Windows offers on most laptops.
 *
 * The scale matters because chessground floors each square to whole device
 * pixels. A size that divides by 8 in CSS pixels but not in device pixels draws
 * short inside its own box, and the bar ends below the board (spec S16). That
 * is the fault this rule was corrected for on 2026-09-12.
 */

/** The large board, at a viewport, in the layout and at the scale it gets. */
function large(width: number, height: number, narrow = false, scale = 1): number {
  return fitBoardSize(BOARD_SIZE_LARGE, width, height, narrow, scale)
}

/** What the squares come to in device pixels, which must be a whole number. */
function squareDevicePixels(size: number, scale: number): number {
  return (size * scale) / 8
}

describe('the large board at a whole display scale', () => {
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

  it('gives the same answers at a scale of 2, which divides everything', () => {
    expect(large(1280, 1000, false, 2)).toBe(808)
    expect(large(1180, 820, false, 2)).toBe(624)
    expect(large(820, 1180, true, 2)).toBe(728)
  })
})

describe('the large board at a fractional display scale', () => {
  /**
   * The case that was found on screen: 808 at a scale of 1.5 wants squares of
   * 151.5 device pixels, so chessground drew 805.33 inside an 808 box and the
   * bar overhung the board by 2.67px.
   */
  it('steps down from 808 to 800 at a scale of 1.5', () => {
    expect(large(1280, 1000, false, 1.5)).toBe(800)
    expect(squareDevicePixels(800, 1.5)).toBe(150)
  })

  it('steps down from 728 to 720 upright at a scale of 1.5', () => {
    expect(large(820, 1180, true, 1.5)).toBe(720)
    expect(squareDevicePixels(720, 1.5)).toBe(135)
  })

  it('keeps 624 at a scale of 1.5, because that one already divides', () => {
    expect(large(1180, 820, false, 1.5)).toBe(624)
    expect(squareDevicePixels(624, 1.5)).toBe(117)
  })

  it('steps further at a scale of 1.25, which needs multiples of 32', () => {
    expect(large(1280, 1000, false, 1.25)).toBe(800)
    expect(large(1180, 820, false, 1.25)).toBe(608)
    expect(large(820, 1180, true, 1.25)).toBe(704)
  })

  it('gives whole squares at every scale and viewport it is asked about', () => {
    for (const scale of [1, 1.25, 1.5, 2]) {
      for (const [width, height, narrow] of [
        [1280, 1000, false],
        [1180, 820, false],
        [820, 1180, true],
        [1600, 1200, false],
      ] as [number, number, boolean][]) {
        const size = large(width, height, narrow, scale)
        expect(Number.isInteger(squareDevicePixels(size, scale))).toBe(true)
      }
    }
  })
})

describe('the limits', () => {
  it('never goes below the small board, however small the viewport', () => {
    expect(large(320, 480)).toBe(BOARD_SIZE)
    expect(large(1, 1)).toBe(BOARD_SIZE)
    expect(large(320, 480, false, 1.5)).toBe(BOARD_SIZE)
  })

  it('never gives more than was asked for', () => {
    expect(large(1600, 1200)).toBeLessThanOrEqual(BOARD_SIZE_LARGE)
    expect(large(1600, 1200, false, 1.5)).toBeLessThanOrEqual(BOARD_SIZE_LARGE)
  })

  it('always divides by eight in CSS pixels too', () => {
    for (let height = 500; height <= 1200; height += 7) {
      expect(large(1280, height) % 8).toBe(0)
      expect(large(1280, height, false, 1.5) % 8).toBe(0)
    }
  })
})

describe('the small board', () => {
  it('is 416 at every viewport this app is used at', () => {
    expect(fitBoardSize(BOARD_SIZE, 1280, 1000, false)).toBe(BOARD_SIZE)
    expect(fitBoardSize(BOARD_SIZE, 1180, 820, false)).toBe(BOARD_SIZE)
    expect(fitBoardSize(BOARD_SIZE, 820, 1180, true)).toBe(BOARD_SIZE)
  })

  /** 416 is a multiple of 32, so no scale this app meets has to step it down. */
  it('is 416 at every display scale, with whole squares', () => {
    for (const scale of [1, 1.25, 1.5, 2]) {
      expect(fitBoardSize(BOARD_SIZE, 1280, 1000, false, scale)).toBe(BOARD_SIZE)
      expect(Number.isInteger(squareDevicePixels(BOARD_SIZE, scale))).toBe(true)
    }
  })
})

describe('the narrow layout', () => {
  it('gives the board the width the sidebar would have taken', () => {
    expect(large(820, 1180, true)).toBeGreaterThan(large(820, 1180, false))
  })
})
