import { fullMove, type PlayedMove } from '../play'

/**
 * Origin: London src/ui/Play.tsx MoveList, adapted: a record only, with no review buttons, and it fills its column rather than counting rows.
 * The moves of the game, numbered, White and Black side by side.
 *
 * A record and nothing else (spec 5.7): a move that jumped the board mid-game
 * would be a control that undoes without saying so.
 */
export function MoveList({ moves }: { moves: PlayedMove[] }) {
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
    <ol className="move-list">
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
 * The newest row, brought to where it can be seen. `nearest` scrolls only when
 * it has to, so a list that already shows the row stays still. One function
 * for every render, so it runs when a row becomes the last, not on every move.
 */
function keepInView(node: HTMLLIElement | null): void {
  node?.scrollIntoView({ block: 'nearest' })
}
