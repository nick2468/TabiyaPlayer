/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  MIN_INNER_HEIGHT,
  MIN_INNER_WIDTH,
  matchWindowToBoard,
  windowForBoard,
  type WindowNow,
} from './window-size'

/**
 * The window a board size asks for (spec S21; S15 item 24).
 *
 * All of it without a window and without a Tauri call, which is the point of
 * the function being pure: the suite cannot start one, so the arithmetic that
 * decides where the window goes has to be reachable on its own.
 *
 * The frame is a Windows one: an 8 px border either side and a title bar, which
 * is 16 by 39 on this machine at a display scale of 1. It is measured at the
 * moment of the change in the real thing and only ever an example here.
 */
const FRAME = { width: 16, height: 39 }

/**
 * Whether anything reached for the Tauri window API. Nothing in this suite may:
 * the factory below runs only when something imports the module, and it is here
 * so that "no test starts a Tauri call" is held rather than hoped for.
 */
const touched = vi.hoisted(() => ({ tauri: false }))
vi.mock('@tauri-apps/api/window', () => {
  touched.tauri = true
  return {
    currentMonitor: async () => null,
    getCurrentWindow: () => ({}),
    LogicalSize: class {},
    LogicalPosition: class {},
  }
})

/** A 1920 by 1080 screen with a 48 px taskbar, and the window near its middle. */
function screen1080(over: Partial<WindowNow> = {}): WindowNow {
  return {
    workArea: { x: 0, y: 0, width: 1920, height: 1032 },
    frame: FRAME,
    position: { x: 200, y: 100 },
    pixelRatio: 1,
    ...over,
  }
}

describe('the window a board needs', () => {
  it('is 1047 by 807 for the small board', () => {
    // 416 + 607 beside + 24 for the scrollbar, and 416 + 167 above + 224
    // below. The width was 1023 until phase 16: spec 20.2 asked for the
    // layout's exact minimum, and `main`'s scrollbar then took 15 px of it and
    // wrapped the side panel under the board (spec S23). The height is
    // unchanged, because the height was never short.
    const target = windowForBoard('small', screen1080())
    expect(target.board).toBe(416)
    expect(target.inner).toEqual({ width: 1047, height: 807 })
  })

  it('is the board the work area allows, plus the chrome, for the large one', () => {
    // 1032 tall less the 39 px frame leaves 993 of contents, and 993 - 167 -
    // 224 leaves 602, so the board is 600. The width would have allowed far
    // more, as it does in every window this app opens.
    //
    // 1231 is 600 + 607 + the 24 of S23, where phase 15 asked for 1207. The
    // BOARD is unaffected by the allowance: it is worked out from the work
    // area, not from the window the allowance asks for.
    const target = windowForBoard('large', screen1080())
    expect(target.board).toBe(600)
    expect(target.inner).toEqual({ width: 1231, height: 991 })
  })

  it('asks for the board the screen can show, not the one the window can', () => {
    // The same screen, with the window already shrunk into the dead band Nick
    // found. The answer is the screen's board, which is the bug being fixed:
    // the toggle stops depending on the size the window happens to be.
    const shrunk = windowForBoard('large', screen1080({ position: { x: 0, y: 0 } }))
    expect(shrunk.board).toBe(600)
  })

  it('gives the full 832 on a screen with room for it', () => {
    const tall = screen1080({ workArea: { x: 0, y: 0, width: 2560, height: 1392 } })
    // 832 + 607 + 24: this is Nick's own machine's large window, which read
    // 1439 wide in 1.3.0 and wrapped its report under the board there.
    const target = windowForBoard('large', tall)
    expect(target.board).toBe(832)
    expect(target.inner).toEqual({ width: 1463, height: 1223 })
  })

  it('steps the board down so the squares land on whole device pixels', () => {
    // The same screen at 1.5, where 600 wants squares of 112.5 and 592 wants
    // 111. The fit rule does this; the window follows whatever it answers.
    const target = windowForBoard('large', screen1080({ pixelRatio: 1.5 }))
    expect(target.board).toBe(592)
    expect(target.inner.height).toBe(983)
  })
})

/**
 * S15 item 26: the window asks for more than the layout's bare minimum, by at
 * least a scrollbar (spec S23).
 *
 * The bare minimum is not imported, because `CHROME_BESIDE_WIDE` is private to
 * `board-size.ts` and should stay that way. It is reconstructed instead from
 * two answers of the same function, which is the one thing a test may assume
 * about it: the width beside the board is the same for every board size, so
 * the difference between two targets is the difference between two boards, and
 * what is left over in either is the chrome and the allowance together.
 */
describe('the room for the scrollbar', () => {
  /** A vertical scrollbar in CSS pixels at a display scale of 1, the worst case. */
  const SCROLLBAR = 15

  it('asks for more width than the layout itself needs', () => {
    const small = windowForBoard('small', screen1080()).inner
    const large = windowForBoard('large', screen1080()).inner

    // The width beside the board, from each of the two answers. They must
    // agree, and what they agree on is the chrome plus the allowance.
    const besideSmall = small.width - 416
    const besideLarge = large.width - 600
    expect(besideSmall).toBe(besideLarge)

    // 607 is what the three columns of spec 19.1 need. Anything above it is
    // the allowance, and it has to cover a scrollbar.
    expect(besideSmall - 607).toBeGreaterThanOrEqual(SCROLLBAR)
  })

  it('leaves the height exactly as the layout needs it', () => {
    // The height was never short: with the panel beside the board the page
    // fits its window, and only the wrap ever made it tall (spec S23). 807 is
    // 416 + 167 + 224 with nothing added.
    expect(windowForBoard('small', screen1080()).inner.height).toBe(416 + 167 + 224)
  })
})

describe('the clamps', () => {
  it('never asks for more than the work area holds', () => {
    // A 1280 by 800 screen: the small target is 1047 by 807 and the height
    // does not fit, so the height is the work area less the frame. The board
    // is then 416 in a window 46 px short of the room it wants, which is what
    // every version before this one already did. The width fits, allowance
    // and all, because 1047 is well inside 1280.
    const small = screen1080({ workArea: { x: 0, y: 0, width: 1280, height: 800 } })
    const target = windowForBoard('small', small)
    expect(target.inner.width).toBe(1047)
    expect(target.inner.height).toBe(800 - FRAME.height)
  })

  it('clamps up to the window minimum, which still binds', () => {
    // A work area under the declared minimum. Windows would refuse anything
    // smaller anyway, so the answer says so rather than asking for it.
    const tiny = screen1080({ workArea: { x: 0, y: 0, width: 800, height: 600 } })
    const target = windowForBoard('small', tiny)
    expect(target.inner).toEqual({ width: MIN_INNER_WIDTH, height: MIN_INNER_HEIGHT })
  })

  it('reads the minimum the window was actually declared with', () => {
    const config = JSON.parse(
      readFileSync(new URL('../../src-tauri/tauri.conf.json', import.meta.url), 'utf8'),
    ) as { app: { windows: { minWidth: number; minHeight: number }[] } }
    const main = config.app.windows[0]
    expect(main.minWidth).toBe(MIN_INNER_WIDTH)
    expect(main.minHeight).toBe(MIN_INNER_HEIGHT)
  })
})

describe('staying inside the screen', () => {
  it('does not move a window that already fits where it is', () => {
    expect(windowForBoard('small', screen1080()).position).toBeNull()
  })

  it('moves a window at the right edge back inside, by the least that does it', () => {
    // The window's outer width becomes 1231 + 16 = 1247, and 1920 - 1247 is
    // 673, so an x of 900 comes back to 673 and no further. The y is left
    // alone, because at the top of the screen there is room for the height.
    // It was 697 before S23's allowance widened the window by 24.
    const target = windowForBoard('large', screen1080({ position: { x: 900, y: 0 } }))
    expect(target.position).toEqual({ x: 673, y: 0 })
  })

  it('moves a window at the bottom edge up, and leaves x alone', () => {
    // The outer height becomes 991 + 39 = 1030, and 1032 - 1030 is 2.
    const target = windowForBoard('large', screen1080({ position: { x: 100, y: 500 } }))
    expect(target.position).toEqual({ x: 100, y: 2 })
  })

  it('puts a window too big for the screen at the corner of the work area', () => {
    // A second monitor left of the first, so the corner is not the origin,
    // and one too small for the minimum in both directions.
    const left = screen1080({
      workArea: { x: -1920, y: 0, width: 1000, height: 700 },
      position: { x: -1000, y: 300 },
    })
    expect(windowForBoard('small', left).position).toEqual({ x: -1920, y: 0 })
  })
})

describe('the web', () => {
  /**
   * S15 item 25's other half, and the rule that no test starts a Tauri call.
   *
   * There is no window here at all, so `isDesktop()` is false and the function
   * returns BEFORE the dynamic import. The mock is how that is held rather
   * than assumed: its factory runs only if something imports the module, and
   * nothing here may.
   */
  it('does nothing, and imports no Tauri, where there is no window', async () => {
    await expect(matchWindowToBoard('large')).resolves.toBeUndefined()
    await expect(matchWindowToBoard('small')).resolves.toBeUndefined()
    expect(touched.tauri).toBe(false)
  })
})
