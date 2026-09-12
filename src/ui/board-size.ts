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
 * reason. It is what `fitBoardSize` asks for and rarely what it gets: 832 needs
 * a viewport about 1040 px tall, and neither an iPad nor the 1000 px Windows
 * window has one (spec S2).
 */
export const BOARD_SIZE_LARGE = 832

/**
 * Below this width the sidebar goes under the board column (spec 4.3), so the
 * board has the page's whole width rather than the width beside the sidebar.
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
 * Above: the page's top padding and the header, measured 80.67.
 * Below: the gap under the board, the button row, the gap under it, the status
 * line and the page's bottom padding, measured 109.33.
 * Beside, wide: the page padding both sides, the bar, the gap after it, the gap
 * to the sidebar, and the sidebar (24 + 24 + 24 + 20 + 24 + 280).
 * Beside, narrow: the padding both sides, the bar and its gap. The sidebar is
 * under the board there and takes none of the width.
 */
const CHROME_ABOVE = 81
const CHROME_BELOW = 110
const CHROME_BESIDE_WIDE = 396
const CHROME_BESIDE_NARROW = 92

/**
 * The board size that actually fits, which is the rule on every platform
 * (spec S2, as corrected at gate 2 and again by Nick on 2026-09-12).
 *
 * The answer is the largest size that is no bigger than the size asked for, the
 * width left beside the bar and the sidebar, or the height left under the
 * header and above the buttons, AND that draws whole squares.
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
 * multiple of 16, so a 1280 by 1000 window gets 800 rather than 808; at 1.25 it
 * is a multiple of 32 and gets 800 too. Nick ruled that the large board does not
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
