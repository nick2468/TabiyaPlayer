import { describe, expect, it } from 'vitest'
import { BOARD_SIZE, BOARD_SIZE_LARGE, fitBoardSize } from './board-size'

/**
 * The fit rule (spec S15 item 11).
 *
 * The viewports are the three of spec 15.2, with the Windows window at the size
 * spec 18.1 opens it: 1400 by 980, an iPad in landscape, and an iPad held
 * upright. The display scales are the ones this app is actually used at: 1 and
 * 2 are whole, and 1.25 and 1.5 are what Windows offers on most laptops.
 *
 * The numbers came down in phase 9, and that is the layout doing its job. The
 * selector row and the head row sit above the board and the review row is
 * counted below it, so the chrome is 167 above and 120 below where it was 81
 * and 110. The board gives up the difference rather than the page scrolling.
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
  it('is 688 in the Windows window, where the height runs out first', () => {
    // 980 - 167 above - 120 below leaves 693, and 688 is the multiple of 8 in
    // it. The width would have allowed 793 (1400 - 607).
    expect(large(1400, 980)).toBe(688)
  })

  it('is 528 on a landscape iPad, where the height runs out first', () => {
    // 820 - 167 - 120 leaves 533; the width would have allowed 573.
    expect(large(1180, 820)).toBe(528)
  })

  it('is 728 on an upright iPad, where the width runs out first', () => {
    // The list and the panel are under the board below 900, so only the bar is
    // beside it: 820 - 92 leaves 728. The height would have allowed 893.
    expect(large(820, 1180, true)).toBe(728)
  })

  it('is the full 832 on a screen with room for it', () => {
    // 1200 - 167 - 120 leaves 913, and 1600 - 607 leaves 993.
    expect(large(1600, 1200)).toBe(832)
  })

  it('gives the same answers at a scale of 2, which divides everything', () => {
    expect(large(1400, 980, false, 2)).toBe(688)
    expect(large(1180, 820, false, 2)).toBe(528)
    expect(large(820, 1180, true, 2)).toBe(728)
  })
})

describe('the large board at a fractional display scale', () => {
  /**
   * The case that was found on screen in phase 3: a size whose squares do not
   * land on whole device pixels draws short inside its own box, and the bar
   * overhangs the board.
   */
  it('keeps 688 in the Windows window at a scale of 1.5', () => {
    // 688 at 1.5 wants squares of 129 device pixels, which is whole already.
    expect(large(1400, 980, false, 1.5)).toBe(688)
    expect(squareDevicePixels(688, 1.5)).toBe(129)
  })

  it('steps down from 728 to 720 upright at a scale of 1.5', () => {
    expect(large(820, 1180, true, 1.5)).toBe(720)
    expect(squareDevicePixels(720, 1.5)).toBe(135)
  })

  it('keeps 528 in landscape at a scale of 1.5', () => {
    expect(large(1180, 820, false, 1.5)).toBe(528)
    expect(squareDevicePixels(528, 1.5)).toBe(99)
  })

  it('steps further at a scale of 1.25, which needs multiples of 32', () => {
    // 688, 528 and 728 are not multiples of 32; 672, 512 and 704 are.
    expect(large(1400, 980, false, 1.25)).toBe(672)
    expect(large(1180, 820, false, 1.25)).toBe(512)
    expect(large(820, 1180, true, 1.25)).toBe(704)
  })

  it('gives whole squares at every scale and viewport it is asked about', () => {
    for (const scale of [1, 1.25, 1.5, 2]) {
      for (const [width, height, narrow] of [
        [1400, 980, false],
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
      expect(large(1400, height) % 8).toBe(0)
      expect(large(1400, height, false, 1.5) % 8).toBe(0)
    }
  })
})

describe('the small board', () => {
  it('is 416 at every viewport this app is used at', () => {
    expect(fitBoardSize(BOARD_SIZE, 1400, 980, false)).toBe(BOARD_SIZE)
    expect(fitBoardSize(BOARD_SIZE, 1180, 820, false)).toBe(BOARD_SIZE)
    expect(fitBoardSize(BOARD_SIZE, 820, 1180, true)).toBe(BOARD_SIZE)
  })

  /** 416 is a multiple of 32, so no scale this app meets has to step it down. */
  it('is 416 at every display scale, with whole squares', () => {
    for (const scale of [1, 1.25, 1.5, 2]) {
      expect(fitBoardSize(BOARD_SIZE, 1400, 980, false, scale)).toBe(BOARD_SIZE)
      expect(Number.isInteger(squareDevicePixels(BOARD_SIZE, scale))).toBe(true)
    }
  })
})

describe('the narrow layout', () => {
  it('gives the board the width the other two columns would have taken', () => {
    expect(large(820, 1180, true)).toBeGreaterThan(large(820, 1180, false))
  })
})
