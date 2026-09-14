/**
 * Origin: London src/ui/board-size.ts, adapted: the large size is added and the Study line is gone.
 * How big the board is drawn, in CSS pixels.
 *
 * 416, and the number is not arbitrary. Chessground floors each square to a
 * whole CSS pixel, so a board box of 420 gets squares of 52 and the eight of
 * them come to 416: the box is four pixels taller than the chess. Nothing on
 * the board shows that, but the evaluation bar beside it is stretched to the
 * BOX, so it ran about a millimetre past the last square, which is what the
 * trainer's users saw on its 1.6.8.
 *
 * 416 divides by eight exactly, so the squares fill the box and the bar ends
 * where the board does. It is also a whole number of device pixels per square
 * at the scales this app is used at: 65 at 1.25, 78 at 1.5, 104 at 2.0.
 */
export const BOARD_SIZE = 416

/**
 * The large board, twice the small one, so it divides by eight for the same
 * reason. It is what `fitBoardSize` asks for and rarely what it gets: with the
 * layout of spec 19.1 above and below it, 832 needs a viewport 1223 px tall,
 * and neither an iPad nor the 980 px Windows window has one (spec S2).
 */
export const BOARD_SIZE_LARGE = 832

/**
 * Below this width the move list and the side panel go under the board column
 * (spec 18.1), so the board has the page's whole width rather than the width
 * beside them.
 *
 * The same number is the media query in `play.css`. THE TWO MUST MOVE
 * TOGETHER: a board sized for the narrow layout inside the wide one overflows
 * the page sideways, which is the one thing spec S16 forbids.
 */
export const NARROW_BELOW = 900

/**
 * What the page takes around the board, in CSS pixels.
 *
 * Measured on the built screen rather than added up from the stylesheet, and
 * then rounded UP, so the rule never claims a pixel it does not have. A board
 * one pixel too big for its column is a page that scrolls sideways.
 *
 * Re-measured in phase 9 for the layout of spec 18.1, in the pane at 1400 by
 * 980 with the small board, from the probe's own numbers. `CHROME_BELOW` was
 * measured again in phase 13, when two rows under the board became four.
 *
 * Above, 167: the page's top padding and the header take 81 (the selector row's
 * y), the selector row 34 and its margin 12, the head row 24 and its margin 16.
 * The board's y was measured at exactly 167 at a display scale of 1 and at 164
 * at 1.5, where a row of text is a third of a pixel shorter; the larger of the
 * two is the one that has to fit. Nothing above the board moved in phase 13:
 * the header lost its two toggles and the selector row moved to the left, and
 * neither changes a height.
 * Below, 224: the column's gap under the board 12, then the four rows of spec
 * S19 at 38 each with a 12px gap between them, and the page's bottom padding
 * 24. Measured at a display scale of 1, where a row is 38 rather than 37.33 and
 * so is the one that has to fit. Row two is the taller of its two states here:
 * the review row is the same 38 with a -4px top margin, so a report showing
 * takes four pixels LESS than a game in progress, and the board does not change
 * size when the report arrives.
 * Beside, wide, 607: the page padding both sides 48, the bar 24, the gap after
 * it 20, the gap to the move list 24, the list column 167, the gap to the side
 * panel 24, and the panel's own minimum 300. The panel takes what is left
 * beyond that minimum, so the board is never sized against its maximum.
 * Beside, narrow, 92: the padding both sides, the bar and its gap. The list and
 * the panel are under the board there and take none of the width.
 */
const CHROME_ABOVE = 167
const CHROME_BELOW = 224
const CHROME_BESIDE_WIDE = 607
const CHROME_BESIDE_NARROW = 92

/**
 * Room the window asks for beyond the layout's own minimum, in CSS pixels
 * (spec S23, widened by S24).
 *
 * Two things need it and neither is visible from inside the page.
 *
 * ONE, the scrollbar. `main` is the scrolling element in any window at least
 * 900 by 700 (`app.css`), so its vertical scrollbar takes 15 px out of the
 * three columns WITHOUT changing `document.documentElement.clientWidth`. The
 * page therefore reports no scrollbar at all while behaving as though one is
 * there: `innerWidth - clientWidth` reads 0 either way. It appears whenever the
 * report is long enough to make the panel taller than the board column, which
 * is an ordinary game rather than an unusual one.
 *
 * TWO, the side panel's own breathing room. With only the scrollbar allowed
 * for, the panel is squeezed to 309.67 px, and at a display scale of 1.5 its
 * full-width children round up one pixel past it: `scrollWidth` 311 against a
 * box of 309.67. One pixel is a horizontal scrollbar across the bottom of the
 * page, which is what Nick met on 1.3.1 after loading a 23-move game and
 * reviewing it. Measured in the shipped window by widening it a step at a time
 * with the same report on screen:
 *
 *   panel 311 and 319: scrollWidth one pixel over, the page scrolls sideways.
 *   panel 327 and up: scrollWidth exact, and it never came back.
 *
 * So the allowance is the scrollbar's 15 plus enough to keep the panel clear of
 * the 327 where the rounding stops, and 64 puts it at 349 at BOTH board sizes,
 * 22 px clear. It is one number for both because the board and the move list
 * grow together: the panel is what is left, and it was 309.67 in each.
 *
 * It is NOT part of the chrome constants, on purpose. Those describe what the
 * layout truly needs, and the fit rule of S2 uses them to answer honestly
 * about a window the user sized; an allowance buried in them would take pixels
 * off the board on every screen, for a scrollbar that is only sometimes there.
 */
const WINDOW_ALLOWANCE = 64

/**
 * The inner size a window needs to show a board of this size (spec S21, S23).
 *
 * The chrome constants above are the only pixel numbers this app writes in a
 * `.ts` file, and they stay in this one. Phase 15 needed them outside it, to
 * work out how big the Windows window has to be for the board the user has
 * just chosen, so it asks for the answer rather than for the numbers.
 *
 * The wide chrome, always. A window this app runs in is never narrow: its
 * declared minimum is 960 and the narrow layout starts below 900, so the only
 * way to reach the narrow layout is a work area smaller than the window's own
 * minimum, and there the work-area clamp answers before this does.
 *
 * The width carries the allowance and the height does not, because the height
 * was never short: with the panel beside the board the page fits its window,
 * and it was only the wrap that ever made it tall.
 *
 * The small board therefore needs 1087 by 807, where spec 20.2 quoted 1023 and
 * 1.3.1 asked for 1047.
 */
export function innerSizeForBoard(board: number): { width: number; height: number } {
  return {
    width: board + CHROME_BESIDE_WIDE + WINDOW_ALLOWANCE,
    height: board + CHROME_ABOVE + CHROME_BELOW,
  }
}

/**
 * The board size that actually fits, which is the rule on every platform
 * (spec S2, as corrected at gate 2 and again by Nick on 2026-09-12).
 *
 * The answer is the largest size that is no bigger than the size asked for, the
 * width left beside the bar, the move list and the side panel, or the height
 * left under the head row and above the buttons, AND that draws whole squares.
 *
 * Whole squares is two conditions, not one. A multiple of 8 in CSS pixels, and
 * a whole number of DEVICE pixels per square. The second is the one this app
 * learnt the hard way. Chessground floors each square to whole device pixels,
 * so at a display scale of 1.5 a board of 808 wants squares of 151.5 device
 * pixels, gets 151, and draws 805.33 inside an 808 box. The bar is stretched to
 * the box, so it ended 2.67px below the board, which is exactly what spec S16
 * forbids and exactly the overrun BOARD_SIZE's own comment exists to prevent.
 *
 * So the rule steps down in eights until the squares come out whole. At a scale
 * of 1 every multiple of 8 does and nothing is given up. At 1.5 the answer is a
 * multiple of 16, and at 1.25 a multiple of 32: the 1400 by 980 window has room
 * for 688, which is already a multiple of 16 and so costs nothing at 1.5, and
 * gives up 16 pixels at 1.25 to reach 672. Nick ruled that the large board does not
 * have to be literally double, which is what makes this the honest rule rather
 * than a compromise: the point was always a board the bar ends level with.
 *
 * Never below 416, which needs no stepping at any scale this app is used at
 * (416 is a multiple of 32, so 1.25, 1.5 and 2.0 all divide it whole). A
 * viewport too small for the small board is one where scrolling to the board
 * beats shrinking the pieces past reading.
 */
export function fitBoardSize(
  wanted: number,
  viewportWidth: number,
  viewportHeight: number,
  narrow: boolean,
  pixelRatio = 1,
): number {
  const beside = narrow ? CHROME_BESIDE_NARROW : CHROME_BESIDE_WIDE
  const room = Math.min(
    wanted,
    viewportWidth - beside,
    viewportHeight - CHROME_ABOVE - CHROME_BELOW,
  )
  for (let size = Math.floor(room / 8) * 8; size >= BOARD_SIZE; size -= 8) {
    if (hasWholeSquares(size, pixelRatio)) return size
  }
  return BOARD_SIZE
}

/**
 * Whether a board of this size draws squares on whole device pixels.
 *
 * The tolerance is there because the ratio is a float: 800 at 1.5 comes to
 * exactly 150, but arithmetic on other scales lands a hair either side of a
 * whole number, and a board rejected for that would be a board a pixel smaller
 * for no reason anybody could see.
 */
function hasWholeSquares(size: number, pixelRatio: number): boolean {
  const square = (size * pixelRatio) / 8
  return Math.abs(square - Math.round(square)) < 1e-6
}
