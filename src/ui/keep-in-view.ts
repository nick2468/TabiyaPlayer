/**
 * How far a scrolling box has to move to show a row inside it.
 *
 * This exists because `scrollIntoView` is not contained. It scrolls every
 * scrollable ancestor, and on a 1180 by 820 screen the sidebar is taller than
 * the shell's scrolling `main`, so bringing the newest move into view scrolled
 * `main` as well and took the top of the board off the screen with it. Found by
 * the layout probe in phase 6: the same page showed the board at y 81 with no
 * moves in the list and at y 55 with twenty, and nothing but the list had
 * changed.
 *
 * Positive scrolls down, negative up, zero leaves it alone, which is the
 * "nearest" behaviour worth keeping. The arithmetic is here rather than in the
 * component because a number is testable and a scroll is not: jsdom has no
 * layout, so every rectangle in a DOM test is zero and a fault like this one
 * cannot fail a test there.
 */

/** The two edges of a box, which is all of a rectangle this needs. */
export interface Edges {
  top: number
  bottom: number
}

export function scrollToShow(row: Edges, box: Edges): number {
  if (row.bottom > box.bottom) return row.bottom - box.bottom
  if (row.top < box.top) return row.top - box.top
  return 0
}
