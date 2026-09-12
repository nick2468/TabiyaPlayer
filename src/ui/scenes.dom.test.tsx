import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { movesOnScreen, renderApp } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The dev scenes, opened from the address bar (spec 15.1).
 *
 * Vitest runs with `import.meta.env.DEV` true, so the hook is live here and
 * needs no mocking; `npm run build` is what turns it off, and the grep in the
 * phase 6 notes is what proves that.
 *
 * What is worth pinning is that a scene arrives through the ORDINARY start
 * path. It writes storage and nothing else, so these tests are also a second
 * check that a game in storage reopens with its side, its settings and its
 * outcome, reached the way a person reaches it rather than through a seam.
 */

/** Opens the app as a development build would with this address. */
function atAddress(search: string) {
  window.history.replaceState({}, '', search)
  return renderApp()
}

// The address is global to the file, as `localStorage` is, and jsdom keeps one
// of each for the whole run. `dom-setup.ts` empties storage after every test and
// would be the place for this too, except that it is byte-identical to the
// trainer's (spec S3) and this is the only file that touches the address.
afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('a scene in the address', () => {
  it('shows a finished game, with its outcome', async () => {
    atAddress('/?scene=mate&side=white')
    await screen.findByTestId('board')

    await vi.waitFor(() => expect(movesOnScreen().at(-1)).toBe('Qxf7#'))
    expect(screen.getByText('You won by checkmate')).toBeTruthy()
  })

  it('shows a pawn that can be promoted', async () => {
    atAddress('/?scene=promotion')
    await screen.findByTestId('board')

    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(8))
    const promotions = screen
      .getAllByRole('button')
      .map((button) => button.textContent ?? '')
      .filter((name) => name.startsWith('move axb8='))
    expect(promotions.sort()).toEqual([
      'move axb8=B',
      'move axb8=N',
      'move axb8=Q',
      'move axb8=R',
    ])
  })

  it('applies the settings the address carries', async () => {
    atAddress('/?scene=fresh&theme=light&size=large')
    await screen.findByTestId('board')

    await vi.waitFor(() => expect(document.documentElement.dataset.theme).toBe('light'))
    const large = screen.getByLabelText('Large') as HTMLInputElement
    expect(large.checked).toBe(true)
    // `fresh` is a fresh install: no game came back with it.
    expect(movesOnScreen()).toEqual([])
  })

  it('asks for a hint when the scene wants one', async () => {
    atAddress('/?scene=hint')
    await screen.findByTestId('board')

    // The one thing storage cannot carry, so `Shell` asks for it once the game
    // it is about exists.
    await vi.waitFor(() => expect(document.querySelector('.hint-said')).not.toBeNull())
    expect(document.querySelector('.hint-said')?.textContent).toMatch(/^The engine suggests \S+\.$/)
  })

  it('is ignored when the address asks for nothing', async () => {
    atAddress('/')
    await screen.findByTestId('board')

    expect(movesOnScreen()).toEqual([])
    expect(document.querySelector('.hint-said')).toBeNull()
  })
})
