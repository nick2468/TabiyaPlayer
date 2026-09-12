import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Engine, SearchResult } from '../engine'
import { engineByProfile } from '../test/by-profile'
import { board, movesOnScreen, renderApp } from '../test/dom'
import { fakeEngine } from '../test/fake-engine'
import { heldEngine } from '../test/held-engine'
import { scriptedEngine } from '../test/scripted-engine'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The bar and the hint, on screen (spec sections 7 and 8).
 *
 * Both are things a person reads rather than things a function returns, and
 * both have a sign or a state that is easy to get backwards. The arithmetic is
 * pinned in `evalbar.test.ts`; what this file asks is whether the right number
 * reaches the right end of the right bar, and whether Hint is offered exactly
 * when it can be answered.
 */

/** The bar's accessible name, which is the same text a screen reader gets. */
function barName(): string {
  return document.querySelector('.live-eval')?.getAttribute('aria-label') ?? ''
}

/** The number printed on the bar, or '' when there is none. */
function barNumber(): string {
  return document.querySelector('.live-eval-number')?.textContent ?? ''
}

function hintButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Hint' }) as HTMLButtonElement
}

/** The sentence under the status line, or '' when there is no hint. */
function hintSaid(): string {
  return document.querySelector('.hint-said')?.textContent ?? ''
}

/**
 * An engine that plays ordinary moves but always suggests one particular one.
 *
 * `fakeEngine({ move })` cannot do this: it would play that move as well, and
 * a move that is legal for the side asking for the hint is usually illegal for
 * the side replying to it.
 */
function suggesting(move: string): Engine {
  const plain = fakeEngine()
  const named = fakeEngine({ move })
  return engineByProfile({ analysis: named.search, playing: plain.search })
}

describe('the bar', () => {
  /**
   * The fake's `cp` is from the side to move, exactly as the real engine's is,
   * and the bar always reads from White's. So the same 40 centipawns is -0.4
   * with Black to move and +0.4 with White to move, and the flip between them
   * is the thing worth holding.
   *
   * The engine's REPLY is held so the two can be read one at a time. The bar is
   * brought up to date before the engine is asked to move, which is the order
   * spec 5.2 gives: it answers the move that was just played rather than the
   * reply that has not landed.
   */
  it("shows the engine's number after each move, from White's point of view", async () => {
    const { engine, release } = heldEngine({ cp: 40 })
    const { user } = renderApp(() => engine)
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    // Black to move and 40 for Black, so White is four tenths down.
    await vi.waitFor(() => expect(barName()).toBe('Evaluation: -0.4'))
    expect(barNumber()).toBe('-0.4')

    release()
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    // White to move and 40 for White.
    await vi.waitFor(() => expect(barName()).toBe('Evaluation: +0.4'))
    expect(barNumber()).toBe('+0.4')
  })

  it('says the engine has not looked yet before the first evaluation', async () => {
    // Nothing ever answers, so the bar has no value to show and must say so
    // rather than draw a level bar that looks like a real nought.
    const quiet = fakeEngine({ search: () => new Promise<SearchResult>(() => undefined) })
    renderApp(() => quiet)
    await screen.findByTestId('board')

    expect(barName()).toBe('Evaluation: the engine has not looked yet')
    expect(document.querySelector('.live-eval-number')).toBeNull()
  })

  /**
   * Spec S15 item 9, second half. The bar follows the board: the user's colour
   * is at the bottom of it whichever colour they play, so White's share grows
   * down from the top for a user playing Black.
   */
  it("puts White's share at the top when the user plays Black", async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')
    const white = () => document.querySelector('.live-eval-white') as HTMLElement
    expect(white().style.top).toBe('auto')
    expect(white().style.bottom).toBe('0px')

    await user.click(screen.getByLabelText('Black'))
    await user.click(screen.getByRole('button', { name: 'New game' }))
    await vi.waitFor(() => expect(board().orientation).toBe('black'))

    expect(white().style.top).toBe('0px')
    expect(white().style.bottom).toBe('auto')
  })
})

describe('Hint', () => {
  it('draws the move on the board and says it', async () => {
    const { user } = renderApp(() => suggesting('g1f3'))
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))

    await user.click(hintButton())
    await vi.waitFor(() => expect(hintSaid()).toBe('The engine suggests Nf3.'))
    expect(board().shapes).toEqual(['blueg1f3'])
  })

  it('goes when a move is played', async () => {
    const { user } = renderApp(() => suggesting('g1f3'))
    await screen.findByTestId('board')
    await user.click(hintButton())
    await vi.waitFor(() => expect(hintSaid()).toBe('The engine suggests Nf3.'))

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(hintSaid()).toBe(''))
    expect(board().shapes).toEqual([])
  })

  it('is offered on the first move of a fresh game', async () => {
    renderApp()
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(hintButton().disabled).toBe(false))
  })

  it('is not offered while the engine thinks', async () => {
    const { engine, release } = heldEngine()
    const { user } = renderApp(() => engine)
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(hintButton().disabled).toBe(false))

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(hintButton().disabled).toBe(true))

    release()
    await vi.waitFor(() => expect(hintButton().disabled).toBe(false))
  })

  it('is not offered once the game is over', async () => {
    // Scholar's mate: 1.e4 e5 2.Qh5 Nc6 3.Bc4 Nf6 4.Qxf7#.
    const { user } = renderApp(() => scriptedEngine(['e7e5', 'b8c6', 'g8f6']))
    await screen.findByTestId('board')

    for (const [index, san] of ['e4', 'Qh5', 'Bc4'].entries()) {
      await user.click(await screen.findByRole('button', { name: `move ${san}` }))
      await vi.waitFor(() => expect(movesOnScreen()).toHaveLength((index + 1) * 2))
    }
    await user.click(await screen.findByRole('button', { name: 'move Qxf7#' }))

    await vi.waitFor(() => expect(hintButton().disabled).toBe(true))
  })
})
