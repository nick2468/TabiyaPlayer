import type { CSSProperties } from 'react'
import { fullMove, type PlayedMove } from '../play'
import { scrollToShow } from './keep-in-view'

/**
 * Origin: London src/ui/Play.tsx MoveList, adapted: its height is the board's rather than a row count, the marked move is brought into view by scrollToShow rather than scrollIntoView, and the trainer's `walkable` class is not set, because no rule in either app uses it.
 * The moves of the game, numbered, White and Black side by side.
 *
 * `activePly` is null during a game: the list is a record then (spec 5.7), and
 * a move that jumped the board mid-game would be a control that undoes without
 * saying so. After the review every move is a button and the one the board is
 * standing on is marked (spec 18.4).
 *
 * Its own column between the board and the side panel, as tall as the board
 * (spec 18.1). The trainer counts rows because its list stands beside a board
 * of one fixed size; this board is whatever fits the screen (spec S2), so the
 * height is the board's own number, handed down from where it is worked out.
 * It travels as a custom property rather than as an inline `height`, because
 * the narrow layout fixes the list at ten rows in `play.css` and an inline
 * height would outrank that rule.
 */
export function MoveList({
  moves,
  pixels,
  activePly,
  onSelect,
}: {
  moves: PlayedMove[]
  pixels: number
  /** Where the viewer is standing, or null while the game is being played. */
  activePly: number | null
  onSelect: (ply: number) => void
}) {
  const pairs: {
    number: number
    white?: { san: string; ply: number }
    black?: { san: string; ply: number }
  }[] = []
  for (const move of moves) {
    const number = fullMove(move.ply)
    const held = pairs.find((pair) => pair.number === number)
    const target = held ?? { number }
    const entry = { san: move.san, ply: move.ply }
    if (move.colour === 'white') target.white = entry
    else target.black = entry
    if (!held) pairs.push(target)
  }

  // The position after a move is that move's ply plus one, which is what the
  // list is pointing at: click a move and see what it did.
  const cell = (entry: { san: string; ply: number } | undefined, blank: string) => {
    if (!entry) return <span>{blank}</span>
    if (activePly === null) return <span>{entry.san}</span>
    const here = activePly === entry.ply + 1
    return (
      <button
        type="button"
        className={here ? 'move-step here' : 'move-step'}
        aria-current={here ? 'true' : undefined}
        ref={here ? keepInView : undefined}
        onClick={() => onSelect(entry.ply + 1)}
      >
        {entry.san}
      </button>
    )
  }

  return (
    <ol
      className="move-list"
      style={{ '--board-pixels': `${pixels}px` } as CSSProperties}
    >
      {pairs.map((pair, index) => (
        <li
          key={pair.number}
          ref={activePly === null && index === pairs.length - 1 ? keepInView : undefined}
        >
          <span className="move-number">{pair.number}.</span>
          {cell(pair.white, '...')}
          {cell(pair.black, '')}
        </li>
      ))}
    </ol>
  )
}

/**
 * A row or a marked move, brought to where it can be seen, by scrolling the
 * list and nothing else. It moves only when it has to, so a list that already
 * shows it stays still. One function for every render, so it runs when a node
 * becomes the newest row or the marked move rather than on every move.
 *
 * It was `scrollIntoView({ block: 'nearest' })`, which is the same idea and one
 * line shorter, and which scrolls every scrollable ancestor rather than the
 * list. Above 900 by 700 the shell pins itself to the window and `main` scrolls
 * instead of the page (`app.css`), and on a 1180 by 820 screen the side panel is
 * taller than `main`: so bringing the twentieth move into view scrolled `main`
 * by 26 px and cut the top rank off the board. See `keep-in-view.ts`. The
 * trainer's viewer still calls `scrollIntoView` on its marked move, which is
 * the same fault waiting on the same screen; this app keeps one way of doing it.
 */
function keepInView(node: HTMLElement | null): void {
  // The row for a record, the marked BUTTON for a viewer, so the list is two
  // levels up in the second case. `closest` finds it either way.
  const list = node?.closest('ol')
  if (!node || !list) return
  list.scrollTop += scrollToShow(node.getBoundingClientRect(), list.getBoundingClientRect())
}
