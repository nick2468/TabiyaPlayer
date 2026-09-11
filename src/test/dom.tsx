import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Shell } from '../ui/App'
import { PlayProvider, type CreateEngine } from '../ui/play-context'
import { fakeEngine } from './fake-engine'

/**
 * Origin: London src/test/dom.tsx, adapted: one provider, an engine a test can choose; board and movesOnScreen identical.
 * The app in jsdom, driven the way a person drives it.
 *
 * The real provider, so the code under test is the code that ships. The one
 * substitution is the engine: `PlayProvider` takes a `createEngine` and the
 * tests give it a fake, which is what keeps a Stockfish worker out of the
 * suite and what makes the provider reachable at all.
 *
 * `Shell` rather than `App` because `App` builds the provider itself with no
 * way in. Everything below the provider is identical.
 */
export function renderApp(createEngine: CreateEngine = () => fakeEngine()) {
  const user = userEvent.setup()
  render(
    <PlayProvider createEngine={createEngine}>
      <Shell />
    </PlayProvider>,
  )
  return { user }
}

/** The moves in the Play screen's move list, in order. */
export function movesOnScreen(): string[] {
  const list = document.querySelector('.move-list')
  if (!list) return []
  return [...list.querySelectorAll('li')].flatMap((row) =>
    [...row.children]
      .slice(1)
      .map((cell) => cell.textContent?.trim() ?? '')
      .filter((text) => text !== '' && text !== '...'),
  )
}

/** What the board is showing, what it is highlighting, and its arrows. */
export function board(): { fen: string; lastMove: string; shapes: string[] } {
  const node = screen.getByTestId('board')
  const shapes = node.getAttribute('data-shapes') ?? ''
  return {
    fen: node.getAttribute('data-fen') ?? '',
    lastMove: node.getAttribute('data-last-move') ?? '',
    shapes: shapes === '' ? [] : shapes.split(' '),
  }
}
