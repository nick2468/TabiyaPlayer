import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Colour } from '../model/types'
import { Shell } from '../ui/App'
import { PlayProvider, type CreateEngine } from '../ui/play-context'
import { rememberGame } from '../storage/current-game'
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

/**
 * Puts a game in storage, so the next `renderApp` opens on that position.
 *
 * The app reopens on the game it was closed on (spec 10), and that is the one
 * way a test can start from a position rather than from the first move. A
 * promotion is eight moves in; playing them through the board would make the
 * test about those eight moves instead of about the picker.
 *
 * It writes the real record through the real writer, so a test cannot seed a
 * shape the app would not have written itself.
 */
export function seedGame(sans: string[], side: Colour = 'white', level = 4): void {
  rememberGame({ version: 1, sans, side, level })
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

/** What the board is showing, which way up, what it highlights, and its arrows. */
export function board(): {
  fen: string
  orientation: string
  lastMove: string
  shapes: string[]
} {
  const node = screen.getByTestId('board')
  const shapes = node.getAttribute('data-shapes') ?? ''
  return {
    fen: node.getAttribute('data-fen') ?? '',
    orientation: node.getAttribute('data-orientation') ?? '',
    lastMove: node.getAttribute('data-last-move') ?? '',
    shapes: shapes === '' ? [] : shapes.split(' '),
  }
}
