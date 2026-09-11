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
 * reason. It always fits the Windows window; on an iPad it cannot, and phase 3
 * brings the fit rule that takes the largest multiple of 8 that does (spec S2).
 */
export const BOARD_SIZE_LARGE = 832
