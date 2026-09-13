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
 * The numbers came down in phase 9 and again in phase 13, and that is the
 * layout doing its job. The selector row and the head row sit above the board,
 * and under it are the four rows of spec S19, so the chrome is 167 above and
 * 224 below where version 1's was 81 and 110. The board gives up the difference
 * rather than the page scrolling.
 *
 * What that costs is worth reading off the numbers below: the Windows window's
 * large board is 584 where phase 9 measured 688, and on a landscape iPad the
 * large board is 424 against the small board's 416. Nick ruled the trade when
 * he asked for the room (spec 19.1): the report has the side panel now, and the
 * board has what is left.
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
  it('is 584 in the Windows window, where the height runs out first', () => {
    // 980 - 167 above - 224 below leaves 589, and 584 is the multiple of 8 in
    // it. The width would have allowed 793 (1400 - 607).
    expect(large(1400, 980)).toBe(584)
  })

  it('is 424 on a landscape iPad, where the height runs out first', () => {
    // 820 - 167 - 224 leaves 429; the width would have allowed 573. Eight
    // pixels more than the small board, which is what a 820px screen has room
    // for with four rows of controls under the board.
    expect(large(1180, 820)).toBe(424)
  })

  it('is 728 on an upright iPad, where the width runs out first', () => {
    // The list and the panel are under the board below 900, so only the bar is
    // beside it: 820 - 92 leaves 728. The height would have allowed 789, so
    // this is the one viewport of the three that phase 13 did not change.
    expect(large(820, 1180, true)).toBe(728)
  })

  it('is the full 832 on a screen with room for it', () => {
    // 1280 - 167 - 224 leaves 889, and 1600 - 607 leaves 993. A 1200px screen
    // no longer has the height for it: 832 now needs 1223.
    expect(large(1600, 1280)).toBe(832)
  })

  it('gives the same answers at a scale of 2, which divides everything', () => {
    expect(large(1400, 980, false, 2)).toBe(584)
    expect(large(1180, 820, false, 2)).toBe(424)
    expect(large(820, 1180, true, 2)).toBe(728)
  })
})

describe('the large board at a fractional display scale', () => {
  /**
   * The case that was found on screen in phase 3: a size whose squares do not
   * land on whole device pixels draws short inside its own box, and the bar
   * overhangs the board.
   */
  it('steps down from 584 to 576 in the Windows window at a scale of 1.5', () => {
    // 584 at 1.5 wants squares of 109.5 device pixels; 576 wants 108.
    expect(large(1400, 980, false, 1.5)).toBe(576)
    expect(squareDevicePixels(576, 1.5)).toBe(108)
  })

  it('steps down from 728 to 720 upright at a scale of 1.5', () => {
    expect(large(820, 1180, true, 1.5)).toBe(720)
    expect(squareDevicePixels(720, 1.5)).toBe(135)
  })

  it('steps down to the small board in landscape at a scale of 1.5', () => {
    // 424 at 1.5 wants squares of 79.5, and the next size down is 416 itself.
    expect(large(1180, 820, false, 1.5)).toBe(416)
    expect(squareDevicePixels(416, 1.5)).toBe(78)
  })

  it('steps further at a scale of 1.25, which needs multiples of 32', () => {
    // 584, 424 and 728 are not multiples of 32; 576, 416 and 704 are.
    expect(large(1400, 980, false, 1.25)).toBe(576)
    expect(large(1180, 820, false, 1.25)).toBe(416)
    expect(large(820, 1180, true, 1.25)).toBe(704)
  })

  it('gives whole squares at every scale and viewport it is asked about', () => {
    for (const scale of [1, 1.25, 1.5, 2]) {
      for (const [width, height, narrow] of [
        [1400, 980, false],
        [1180, 820, false],
        [820, 1180, true],
        [1600, 1280, false],
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
    expect(large(1600, 1280)).toBeLessThanOrEqual(BOARD_SIZE_LARGE)
    expect(large(1600, 1280, false, 1.5)).toBeLessThanOrEqual(BOARD_SIZE_LARGE)
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
