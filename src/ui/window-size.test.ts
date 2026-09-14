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
  it('is 1087 by 807 for the small board', () => {
    // 416 + 607 beside + the 64 of S24, and 416 + 167 above + 224 below.
    //
    // The width has moved twice. Spec 20.2 asked for the layout's exact
    // minimum, 1023, and `main`'s scrollbar took 15 px of it and wrapped the
    // side panel under the board (S23). 1047 allowed for the scrollbar and no
    // more, which left the panel at 309.67 px, where its full-width children
    // round one pixel past it and the page scrolls sideways (S24). 64 puts the
    // panel at 349, clear of the 327 where the rounding stops.
    //
    // The height is unchanged through all three, because the height was never
    // short.
    const target = windowForBoard('small', screen1080())
    expect(target.board).toBe(416)
    expect(target.inner).toEqual({ width: 1087, height: 807 })
  })

  it('is the board the work area allows, plus the chrome, for the large one', () => {
    // 1032 tall less the 39 px frame leaves 993 of contents, and 993 - 167 -
    // 224 leaves 602, so the board is 600. The width would have allowed far
    // more, as it does in every window this app opens.
    //
    // 1271 is 600 + 607 + the 64 of S24, where phase 15 asked for 1207 and
    // phase 16 for 1231. The BOARD is unaffected by the allowance: it is worked
    // out from the work area, not from the window the allowance asks for.
    const target = windowForBoard('large', screen1080())
    expect(target.board).toBe(600)
    expect(target.inner).toEqual({ width: 1271, height: 991 })
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
    // 832 + 607 + 64: this is Nick's own machine's large window. It read 1439
    // in 1.3.0, where the report wrapped under the board, and 1463 in 1.3.1,
    // where the panel was squeezed to 309.67 and the page scrolled sideways.
    const target = windowForBoard('large', tall)
    expect(target.board).toBe(832)
    expect(target.inner).toEqual({ width: 1503, height: 1223 })
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
/**
 * S15 item 27: the launch (spec S25).
 *
 * A launch is the one time the window is centred. Nobody has put it anywhere
 * yet - `tauri.conf.json` centres it at the size it declares - so a window that
 * resized from its top-left corner would sit off centre by half the difference.
 * The toggle never centres, and the test above holds that.
 */
describe('the window at a launch', () => {
  it('centres the window it asks for', () => {
    const target = windowForBoard('small', screen1080(), true)
    // 1087 + the 16 px frame is an outer width of 1103, and (1920 - 1103) / 2
    // is 408.5, which rounds to 409. The height: 807 + 39 is 846, and
    // (1032 - 846) / 2 is exactly 93.
    expect(target.inner).toEqual({ width: 1087, height: 807 })
    expect(target.position).toEqual({ x: 409, y: 93 })
  })

  it('centres a large window on the same screen', () => {
    const target = windowForBoard('large', screen1080(), true)
    expect(target.position).toEqual({
      x: Math.round((1920 - (target.inner.width + FRAME.width)) / 2),
      y: Math.round((1032 - (target.inner.height + FRAME.height)) / 2),
    })
  })

  it('always answers a position, even where the toggle would leave it alone', () => {
    // The toggle says null here, because the window already fits where it is.
    expect(windowForBoard('small', screen1080()).position).toBeNull()
    expect(windowForBoard('small', screen1080(), true).position).not.toBeNull()
  })

  it('keeps a window too big for the screen at the corner of the work area', () => {
    // Centring a window bigger than the screen would put it off the top left,
    // so the same push-inside rule holds it at the corner.
    const tiny = screen1080({ workArea: { x: 40, y: 20, width: 800, height: 600 } })
    const target = windowForBoard('small', tiny, true)
    expect(target.position).toEqual({ x: 40, y: 20 })
  })
})

/**
 * S15 item 28: the size the window is DECLARED at is the small board's own
 * (spec S25).
 *
 * `tauri.conf.json` is what the window opens at before any code runs, so a
 * small-board launch - which is every fresh install, since Small is the default
 * - is already the right size and nothing resizes. The two files cannot be made
 * to import from each other, so the test holds them together, the way it
 * already holds the minimum and the way `local-folder.test.ts` holds the data
 * folder's name across three files.
 */
describe('the size the window is declared at', () => {
  it('is the window the small board asks for', () => {
    const main = (
      JSON.parse(
        readFileSync(new URL('../../src-tauri/tauri.conf.json', import.meta.url), 'utf8'),
      ) as { app: { windows: { width: number; height: number }[] } }
    ).app.windows[0]
    const small = windowForBoard('small', screen1080()).inner
    expect({ width: main.width, height: main.height }).toEqual(small)
  })
})

describe('the room beyond the layout itself', () => {
  /** `main`'s vertical scrollbar, measured at a display scale of 1 and of 1.5. */
  const SCROLLBAR = 15
  /**
   * What the side panel needs beyond its 300 px minimum before its full-width
   * children stop rounding a pixel past it (spec S24, measured in the shipped
   * window at a display scale of 1.5: 311 and 319 overflowed, 327 did not).
   */
  const PANEL_ROOM = 327 - 300

  it('asks for more width than the layout itself needs', () => {
    const small = windowForBoard('small', screen1080()).inner
    const large = windowForBoard('large', screen1080()).inner

    // The width beside the board, from each of the two answers. They must
    // agree, and what they agree on is the chrome plus the allowance.
    const besideSmall = small.width - 416
    const besideLarge = large.width - 600
    expect(besideSmall).toBe(besideLarge)

    // 607 is what the three columns of spec 19.1 need, and it counts the side
    // panel at its 300 px minimum. Anything above it is the allowance, and the
    // allowance has to cover BOTH the scrollbar that takes width from the row
    // and the room the panel needs on top of its minimum. Held as a property
    // rather than as 64, so an allowance that looks plausible and is too small
    // cannot pass.
    expect(besideSmall - 607).toBeGreaterThanOrEqual(SCROLLBAR + PANEL_ROOM)
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
    // A 1280 by 800 screen: the small target is 1087 by 807 and the height
    // does not fit, so the height is the work area less the frame. The board
    // is then 416 in a window 46 px short of the room it wants, which is what
    // every version before this one already did. The width fits, allowance
    // and all, because 1087 is well inside 1280.
    const small = screen1080({ workArea: { x: 0, y: 0, width: 1280, height: 800 } })
    const target = windowForBoard('small', small)
    expect(target.inner.width).toBe(1087)
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
    // The window's outer width becomes 1271 + 16 = 1287, and 1920 - 1287 is
    // 633, so an x of 900 comes back to 633 and no further. The y is left
    // alone, because at the top of the screen there is room for the height.
    // It was 697 before any allowance and 673 with S23's 24.
    const target = windowForBoard('large', screen1080({ position: { x: 900, y: 0 } }))
    expect(target.position).toEqual({ x: 633, y: 0 })
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
