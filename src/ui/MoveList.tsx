import type { CSSProperties } from 'react'
import { fullMove, type PlayedMove } from '../play'
import { scrollToShow } from './keep-in-view'

/**
 * Origin: London src/ui/Play.tsx MoveList, adapted: a record only, with no review buttons, and its height is the board's rather than a row count.
 * The moves of the game, numbered, White and Black side by side.
 *
 * A record and nothing else (spec 5.7): a move that jumped the board mid-game
 * would be a control that undoes without saying so.
 *
 * Its own column between the board and the side panel, as tall as the board
 * (spec 18.1). The trainer counts rows because its list stands beside a board
 * of one fixed size; this board is whatever fits the screen (spec S2), so the
 * height is the board's own number, handed down from where it is worked out.
 * It travels as a custom property rather than as an inline `height`, because
 * the narrow layout fixes the list at ten rows in `play.css` and an inline
 * height would outrank that rule.
 */
export function MoveList({ moves, pixels }: { moves: PlayedMove[]; pixels: number }) {
  const pairs: { number: number; white?: string; black?: string }[] = []
  for (const move of moves) {
    const number = fullMove(move.ply)
    const held = pairs.find((pair) => pair.number === number)
    const target = held ?? { number }
    if (move.colour === 'white') target.white = move.san
    else target.black = move.san
    if (!held) pairs.push(target)
  }

  return (
    <ol className="move-list" style={{ '--board-pixels': `${pixels}px` } as CSSProperties}>
      {pairs.map((pair, index) => (
        <li key={pair.number} ref={index === pairs.length - 1 ? keepInView : undefined}>
          <span className="move-number">{pair.number}.</span>
          <span>{pair.white ?? '...'}</span>
          <span>{pair.black ?? ''}</span>
        </li>
      ))}
    </ol>
  )
}

/**
 * The newest row, brought to where it can be seen, by scrolling the list and
 * nothing else. It moves only when it has to, so a list that already shows the
 * row stays still. One function for every render, so it runs when a row becomes
 * the last, not on every move.
 *
 * It was `scrollIntoView({ block: 'nearest' })`, which is the same idea and one
 * line shorter, and which scrolls every scrollable ancestor rather than the
 * list. Above 900 by 700 the shell pins itself to the window and `main` scrolls
 * instead of the page (`app.css`), and on a 1180 by 820 screen the sidebar is
 * taller than `main`: so bringing the twentieth move into view scrolled `main`
 * by 26 px and cut the top rank off the board. See `keep-in-view.ts`.
 */
function keepInView(node: HTMLLIElement | null): void {
  const list = node?.parentElement
  if (!node || !list) return
  list.scrollTop += scrollToShow(node.getBoundingClientRect(), list.getBoundingClientRect())
}
