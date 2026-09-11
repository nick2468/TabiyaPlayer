import { StrictMode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { board, movesOnScreen, renderApp } from '../test/dom'
import { fakeEngine } from '../test/fake-engine'
import { scriptedEngine } from '../test/scripted-engine'
import type { SearchResult } from '../engine'
import { Shell } from './App'
import { PlayProvider } from './play-context'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Origin: London src/ui/play-game.dom.test.tsx, adapted: the game starts on mount, and the status, New game, checkmate and StrictMode tests are new.
 * Playing a game, in a DOM, through the buttons a person presses.
 *
 * This file exists because of a bug in the trainer. Its provider's value was
 * memoised; the session is a mutable object, so the counter that says it
 * changed was not a field of that value and was left out of the memo's
 * dependencies. React skips a provider's children unless the context value
 * changes, so Undo moved the game and left the screen showing the position
 * before it. Every test passed. It was found by pressing Undo in a browser.
 *
 * Nothing here mocks the provider or the session. The engine is a fake because
 * the alternative is a Stockfish worker in the suite, and the board is a stub
 * because chessground wants a `ResizeObserver` jsdom does not have; everything
 * between them is the code that ships.
 */

/** The app opens on a game with the user as White: wait for its board. */
async function startGame() {
  await screen.findByTestId('board')
}

/** What the status line under the buttons says. */
function status(): string {
  return document.querySelector('.play-status')?.textContent ?? ''
}

describe('a game on screen', () => {
  it('shows the move that was played, and the one that answered it', async () => {
    const { user } = renderApp()
    await startGame()

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    // Two moves: the user's, and the fake engine's reply.
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    expect(movesOnScreen()[0]).toBe('d4')
    expect(board().lastMove).not.toBe('')
  })

  /**
   * The trainer's bug, pinned. With the provider's value memoised and the
   * counter left out of its dependencies, the session goes back and the screen
   * does not: the move list still shows both moves and the board still
   * highlights the reply.
   */
  it('takes the moves off the screen when Undo takes them off the game', async () => {
    const { user } = renderApp()
    await startGame()

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    const afterTwo = board().fen

    await user.click(screen.getByRole('button', { name: 'Undo' }))

    // Undo works in pairs, so the user is to move again with nothing played.
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(0))
    expect(board().fen).not.toBe(afterTwo)
    expect(board().lastMove).toBe('')
  })

  it('puts them back when Redo puts them back', async () => {
    const { user } = renderApp()
    await startGame()

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    const played = movesOnScreen()

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(0))

    await user.click(screen.getByRole('button', { name: 'Redo' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(played))
  })

  /**
   * The guard the whole rig rests on. A real engine here would be a worker
   * spawning per test and a suite that fails on a machine with no engine
   * build, which is the reason the provider was unreachable in the first
   * place.
   */
  it('never starts a Stockfish worker', async () => {
    // jsdom has no `Worker` at all, so one is put there to be caught. If the
    // provider ever built its own engine again this would be constructed, and
    // on a real browser it would be a Stockfish worker per test.
    const built: string[] = []
    ;(globalThis as unknown as { Worker: unknown }).Worker = class {
      constructor(url: string) {
        built.push(url)
      }
    }
    try {
      const { user } = renderApp()
      await startGame()
      await user.click(await screen.findByRole('button', { name: 'move d4' }))
      await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
      expect(built).toEqual([])
    } finally {
      delete (globalThis as unknown as { Worker?: unknown }).Worker
    }
  })

  it('New game empties the list and the redo stack', async () => {
    const { user } = renderApp()
    await startGame()

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    const redo = screen.getByRole('button', { name: 'Redo' }) as HTMLButtonElement
    await vi.waitFor(() => expect(redo.disabled).toBe(false))

    await user.click(screen.getByRole('button', { name: 'New game' }))
    await vi.waitFor(() => {
      const again = screen.getByRole('button', { name: 'Redo' }) as HTMLButtonElement
      expect(again.disabled).toBe(true)
    })
    expect(movesOnScreen()).toEqual([])
  })

  it('says who is thinking and then Your move', async () => {
    // The reply waits until the test lets it go, so the status line can be
    // read while the engine is still thinking.
    let release: () => void = () => undefined
    const held = new Promise<void>((resolve) => {
      release = resolve
    })
    const plain = fakeEngine()
    const slow = fakeEngine({
      search: async (fen: string, movetime: number): Promise<SearchResult> => {
        await held
        return plain.search(fen, movetime)
      },
    })
    const { user } = renderApp(() => slow)
    await startGame()
    await vi.waitFor(() => expect(status()).toBe('Your move'))

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(status()).toBe('Black is thinking...'))

    release()
    await vi.waitFor(() => expect(status()).toBe('Your move'))
    expect(movesOnScreen()).toHaveLength(2)
  })

  it('ends in the outcome sentence when the engine is mated', async () => {
    // Scholar's mate: 1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#.
    const { user } = renderApp(() => scriptedEngine(['e7e5', 'b8c6', 'g8f6']))
    await startGame()

    const moves = ['e4', 'Qh5', 'Bc4']
    for (const [index, san] of moves.entries()) {
      await user.click(await screen.findByRole('button', { name: `move ${san}` }))
      await vi.waitFor(() => expect(movesOnScreen()).toHaveLength((index + 1) * 2))
    }
    await user.click(await screen.findByRole('button', { name: 'move Qxf7#' }))

    await vi.waitFor(() => expect(status()).toBe('You won by checkmate'))
    expect(movesOnScreen()).toEqual(['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#'])
    // Locked: the stub offers no moves once the game is over.
    expect(screen.queryAllByRole('button', { name: /^move / })).toEqual([])
  })
})

describe('the engine and the provider', () => {
  /**
   * StrictMode mounts every effect, unmounts it and mounts it again in
   * development. The provider stops the engine when it unmounts, and the game
   * starts in an effect, so a stop that ran at once would take the engine out
   * from under the first game.
   */
  it("keeps its engine through StrictMode's second mount", async () => {
    let stopped = false
    const plain = fakeEngine()
    const engine = fakeEngine({
      stop: () => {
        stopped = true
      },
      search: async (fen: string, movetime: number): Promise<SearchResult> => {
        if (stopped) throw new Error('the engine was stopped')
        return plain.search(fen, movetime)
      },
    })
    const user = userEvent.setup()
    render(
      <StrictMode>
        <PlayProvider createEngine={() => engine}>
          <Shell />
        </PlayProvider>
      </StrictMode>,
    )
    await startGame()
    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    expect(stopped).toBe(false)
  })

  it('stops the engine when the app goes away', async () => {
    let stopped = false
    const engine = fakeEngine({
      stop: () => {
        stopped = true
      },
    })
    const { unmount } = render(
      <PlayProvider createEngine={() => engine}>
        <Shell />
      </PlayProvider>,
    )
    await startGame()
    expect(stopped).toBe(false)
    unmount()
    await vi.waitFor(() => expect(stopped).toBe(true))
  })
})
