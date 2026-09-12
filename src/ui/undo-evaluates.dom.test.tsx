import { screen } from '@testing-library/react'
import { Chess } from 'chess.js'
import { describe, expect, it, vi } from 'vitest'
import type { Engine, SearchResult } from '../engine'
import { engineByProfile } from '../test/by-profile'
import { movesOnScreen, renderApp, seedGame } from '../test/dom'
import { fakeEngine } from '../test/fake-engine'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Undoing into a position the bar has never seen (spec 9.2, amended at gate 4).
 *
 * A game played forward has a number for every position, because one was
 * fetched after every move. A game that arrived whole - loaded from a file, or
 * reopened from storage - has one number, for the position it arrived at.
 * Undoing along it used to show the last number known, which is a number about
 * a different position.
 *
 * So undo and redo fetch one when they land somewhere unevaluated. The point
 * of the design is what they do NOT do: they do not wait for it. The game
 * moves, the screen moves, and the number turns up a moment later.
 */

const SEEDED = ['e4', 'e5', 'Nf3', 'Nc6']

/** Where an Undo from the seeded game lands: back to the user's own move. */
function afterTwoMoves(): string {
  const chess = new Chess()
  chess.move('e4')
  chess.move('e5')
  return chess.fen()
}

/**
 * An engine whose every evaluation is a different number, and which can be
 * made to stop on one position and wait.
 *
 * A different number each time is what lets a test say the bar is showing THIS
 * position's evaluation rather than the one before it; two equal numbers would
 * prove nothing either way.
 */
function evaluatingEngine(holdAt?: string): {
  engine: Engine
  /** How many evaluations have been asked for. */
  asked: () => number
  release: () => void
} {
  const plain = fakeEngine()
  const asked: string[] = []
  let letGo: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    letGo = resolve
  })
  const engine = engineByProfile({
    analysis: async (fen: string, movetime: number): Promise<SearchResult> => {
      const order = asked.push(fen)
      if (holdAt !== undefined && fen === holdAt) await held
      const result = await plain.search(fen, movetime)
      return {
        ...result,
        candidates: result.candidates.map((candidate) => ({
          ...candidate,
          score: { kind: 'cp' as const, centipawns: 100 * order },
        })),
      }
    },
    playing: plain.search,
  })
  return { engine, asked: () => asked.length, release: () => letGo() }
}

/** The number printed on the bar, or '' when there is none. */
function barNumber(): string {
  return document.querySelector('.live-eval-number')?.textContent ?? ''
}

/** What the status line under the buttons says. */
function status(): string {
  return document.querySelector('.play-status')?.textContent ?? ''
}

describe('Undo into a position with no number', () => {
  it('fetches one, and the bar changes to it', async () => {
    seedGame(SEEDED)
    const watcher = evaluatingEngine()
    const { user } = renderApp(() => watcher.engine)
    await screen.findByTestId('board')

    // The game arrives evaluated at its final position and nowhere else.
    await vi.waitFor(() => expect(barNumber()).toBe('+1.0'))
    expect(watcher.asked()).toBe(1)

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['e4', 'e5']))

    // One more evaluation, for the position the undo landed on, and the bar
    // now shows that one rather than the number it arrived with.
    await vi.waitFor(() => expect(barNumber()).toBe('+2.0'))
    expect(watcher.asked()).toBe(2)
  })

  it('does not make the user wait for it', async () => {
    seedGame(SEEDED)
    const watcher = evaluatingEngine(afterTwoMoves())
    const { user } = renderApp(() => watcher.engine)
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(barNumber()).toBe('+1.0'))

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    // The evaluation is still out. The game has moved anyway, nothing says the
    // engine is thinking, and the buttons are live.
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['e4', 'e5']))
    expect(status()).toBe('Your move')
    expect((screen.getByRole('button', { name: 'Hint' }) as HTMLButtonElement).disabled).toBe(false)
    // The bar has no number for a moment, and that is the right answer rather
    // than a gap: the number it arrived with was about a position two moves
    // further on, and printing it here would be printing it about this one.
    expect(barNumber()).toBe('')

    watcher.release()
    await vi.waitFor(() => expect(barNumber()).toBe('+2.0'))
  })

  /**
   * The engine is one worker with a queue, and that evaluation is the one
   * thing in this app nobody is waiting for. While it is out, the engine is at
   * the analysis profile, and a search asked for in the middle of it lands
   * between the profile being set and being put back. So a move played before
   * it finishes waits for it.
   *
   * Without that wait, the move's own evaluation goes to the engine at once
   * and the reply lands while the first number is still out.
   */
  it('holds a move played on top of it until it is finished', async () => {
    seedGame(SEEDED)
    const watcher = evaluatingEngine(afterTwoMoves())
    const { user } = renderApp(() => watcher.engine)
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(barNumber()).toBe('+1.0'))

    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['e4', 'e5']))

    await user.click(await screen.findByRole('button', { name: 'move Nf3' }))
    // The move is on the board, because the session plays it before anything
    // is asked of the engine.
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(3))

    // Nothing more has been asked. A real wait rather than a fake timer
    // (docs/testing.md): the claim is that nothing happens, and the only
    // honest way to watch nothing happen is to watch for a while.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(watcher.asked()).toBe(2)
    expect(movesOnScreen()).toHaveLength(3)

    watcher.release()
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(4))
  })
})
