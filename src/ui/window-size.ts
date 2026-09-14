import type { BoardSizeName } from '../storage/prefs'
import { isDesktop } from '../storage/paths'
import { BOARD_SIZE, BOARD_SIZE_LARGE, fitBoardSize, innerSizeForBoard } from './board-size'

/**
 * The window matches the board, on Windows (spec section 20, S21).
 *
 * Nick shrank the window and found the size toggle inert. It was not broken:
 * `fitBoardSize` never answers less than 416, so in a window with less than a
 * large board's worth of room, Large computes the small board and nothing on
 * the screen changes. The window's own minimum is 960 by 720 and the first
 * board bigger than 416 needs about 1039 by 823, so there is a band of window
 * sizes, reachable by dragging a corner, where the toggle has nothing to say.
 * The answer he chose is that the window follows the board, both ways.
 *
 * The arithmetic and the window are kept apart, and that is the only shape in
 * which any of this can be tested: no test may start a Tauri call, so
 * everything that can be decided without a window is decided in
 * `windowForBoard`, which is pure, and `matchWindowToBoard` reads four things
 * off the real window, calls it, and does what it says.
 *
 * On the web this module does nothing at all. A page cannot resize a window it
 * did not open, and an iPad has no window, so the toggle keeps the behaviour of
 * every version before this one. The Tauri API is imported inside the function
 * and behind `isDesktop()` (spec S14), so the browser bundle never pulls it in.
 */

/** The monitor without its taskbar, in logical pixels. */
export interface WorkArea {
  x: number
  y: number
  width: number
  height: number
}

/** What the real window can say about itself, all in logical pixels. */
export interface WindowNow {
  workArea: WorkArea
  /** The title bar and the borders: `outerSize` minus `innerSize`, measured. */
  frame: { width: number; height: number }
  /** Where the window's outer rectangle starts now. */
  position: { x: number; y: number }
  /** The display scale, which decides which board sizes draw whole squares. */
  pixelRatio: number
}

/** What to do to the window, in logical pixels. */
export interface WindowTarget {
  /** The board this window is being sized for, and the one that will be drawn. */
  board: number
  /** The size to set. It is an INNER size, which is what `setSize` takes. */
  inner: { width: number; height: number }
  /** Where to move the window, or null when it is already inside the work area. */
  position: { x: number; y: number } | null
}

/**
 * The window's declared minimum, which is `tauri.conf.json`'s `minWidth` and
 * `minHeight` and is an inner size like every other number here.
 *
 * It is written twice because the window is built from the configuration file
 * and this arithmetic cannot read it. `window-size.test.ts` reads both and
 * holds them together, the way `local-folder.test.ts` holds the data folder's
 * name across its three files: a minimum changed in one place fails the suite.
 *
 * The minimum binds after the work-area clamp, not before. A screen too small
 * for the small target gets the work area, and then a work area smaller than
 * the minimum gets the minimum, which is what Windows would give it anyway.
 */
export const MIN_INNER_WIDTH = 960
export const MIN_INNER_HEIGHT = 720

/**
 * The window a board size asks for (spec S21). Pure: no window, no Tauri.
 *
 * Large is `fitBoardSize` asked against the WORK AREA rather than against the
 * window, so the window is never sized for a board the screen cannot show, and
 * the board it is sized for is the board that will then be drawn.
 */
export function windowForBoard(size: BoardSizeName, now: WindowNow): WindowTarget {
  // The room for a window's contents is the screen less what the frame takes.
  const roomWide = now.workArea.width - now.frame.width
  const roomTall = now.workArea.height - now.frame.height

  const board =
    size === 'small'
      ? BOARD_SIZE
      : fitBoardSize(BOARD_SIZE_LARGE, roomWide, roomTall, false, now.pixelRatio)

  const wanted = innerSizeForBoard(board)
  const inner = {
    width: clamp(wanted.width, MIN_INNER_WIDTH, roomWide),
    height: clamp(wanted.height, MIN_INNER_HEIGHT, roomTall),
  }

  // Moved, not centred: a window the user placed stays where they put it as
  // far as it can, and is pushed back inside by the least that puts it there.
  const x = pushInside(now.position.x, inner.width + now.frame.width, now.workArea.x, now.workArea.width)
  const y = pushInside(now.position.y, inner.height + now.frame.height, now.workArea.y, now.workArea.height)
  const moved = x !== now.position.x || y !== now.position.y

  return { board, inner, position: moved ? { x, y } : null }
}

/** The wanted size, never under the least and never over the most. */
function clamp(wanted: number, least: number, most: number): number {
  return Math.max(least, Math.min(wanted, most))
}

/**
 * Where a window of this width or height has to start to be inside the screen.
 *
 * A window wider than the work area is put at its left or top edge, because
 * something has to give and the corner the user reads from is that one.
 */
function pushInside(at: number, span: number, edge: number, room: number): number {
  return Math.max(edge, Math.min(at, edge + room - span))
}

/**
 * Sets the real window to the size the chosen board needs (spec S21).
 *
 * It fails quietly on purpose. A window that will not resize, a monitor the
 * platform will not describe, a permission that turns out to be missing: none
 * of them is a reason to stop the user changing the board size, and the board
 * itself changes whatever happens here, because the setting is remembered
 * before this is called and `useBoardPixels` answers the `resize` event.
 */
export async function matchWindowToBoard(size: BoardSizeName): Promise<void> {
  if (!isDesktop()) return
  try {
    const { currentMonitor, getCurrentWindow, LogicalPosition, LogicalSize } = await import(
      '@tauri-apps/api/window'
    )
    const monitor = await currentMonitor()
    if (!monitor) return
    const win = getCurrentWindow()

    // A maximised window ignores a size, so it is restored first. Its own
    // geometry is read afterwards, because un-maximising changes all of it.
    if (await win.isMaximized()) await win.unmaximize()

    const scale = await win.scaleFactor()
    const inner = (await win.innerSize()).toLogical(scale)
    const outer = (await win.outerSize()).toLogical(scale)
    const position = (await win.outerPosition()).toLogical(scale)
    const area = monitor.workArea.size.toLogical(monitor.scaleFactor)
    const areaAt = monitor.workArea.position.toLogical(monitor.scaleFactor)

    const target = windowForBoard(size, {
      workArea: { x: areaAt.x, y: areaAt.y, width: area.width, height: area.height },
      // Measured at the moment of the change rather than assumed. A frame
      // added where it should be subtracted is a window a title bar too short,
      // every time.
      frame: { width: outer.width - inner.width, height: outer.height - inner.height },
      position: { x: position.x, y: position.y },
      pixelRatio: window.devicePixelRatio,
    })

    await win.setSize(new LogicalSize(target.inner.width, target.inner.height))
    if (target.position) {
      await win.setPosition(new LogicalPosition(target.position.x, target.position.y))
    }
  } catch {
    // Quietly (see above). The board size still changes.
  }
}
