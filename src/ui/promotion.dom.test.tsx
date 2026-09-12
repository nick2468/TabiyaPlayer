import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { SearchResult } from '../engine'
import { board, movesOnScreen, renderApp, seedGame } from '../test/dom'
import { fakeEngine } from '../test/fake-engine'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The promotion picker (spec 5.3, spec S15 item 2).
 *
 * The rule worth holding is that NOTHING happens until a piece is chosen. The
 * board has already drawn the pawn on the last rank by the time it reports the
 * move, so a picker that quietly played a queen would look identical to one
 * that asked, right up to the moment somebody wanted a knight.
 *
 * Eight moves in, so the game is seeded rather than played: after
 * 1.a4 b5 2.axb5 a6 3.bxa6 Nc6 4.a7 Nb8 it is White to move and all four of
 * axb8=Q, axb8=R, axb8=B and axb8=N are legal.
 */

const READY = ['a4', 'b5', 'axb5', 'a6', 'bxa6', 'Nc6', 'a7', 'Nb8']

/** The four buttons the picker offers, by their accessible names. */
const PIECES = ['Queen', 'Rook', 'Bishop', 'Knight']

function pickerButtons(): string[] {
  const picker = document.querySelector('.promotion')
  if (!picker) return []
  return [...picker.querySelectorAll('button')].map((button) => button.getAttribute('aria-label') ?? '')
}

/** Opens the picker by playing the pawn onto the last rank. */
async function reachTheLastRank(user: ReturnType<typeof renderApp>['user']) {
  await user.click(await screen.findByRole('button', { name: 'move axb8=Q' }))
  await vi.waitFor(() => expect(pickerButtons()).toEqual(PIECES))
}

describe('a pawn reaching the last rank', () => {
  it('asks which piece, and plays the one chosen', async () => {
    seedGame(READY)
    const { user } = renderApp()
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(READY.length))

    await reachTheLastRank(user)
    // The move is held, not played: the picker is a question about a move that
    // has not happened yet.
    expect(movesOnScreen()).toHaveLength(READY.length)

    await user.click(screen.getByRole('button', { name: 'Knight' }))
    await vi.waitFor(() => expect(movesOnScreen().length).toBeGreaterThan(READY.length))
    expect(movesOnScreen()[READY.length]).toBe('axb8=N')
    expect(document.querySelector('.promotion')).toBeNull()
  })

  it('puts the pawn back when the picker is cancelled with Escape', async () => {
    seedGame(READY)
    const { user } = renderApp()
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(READY.length))
    const before = board().fen

    await reachTheLastRank(user)
    await user.keyboard('{Escape}')

    await vi.waitFor(() => expect(document.querySelector('.promotion')).toBeNull())
    expect(movesOnScreen()).toHaveLength(READY.length)
    expect(board().fen).toBe(before)
  })

  it('does not ask the engine anything until a piece is chosen', async () => {
    // Every search is counted: the engine's reply and the bar's evaluation
    // alike. Neither may happen while the question is still open.
    const searches: string[] = []
    const plain = fakeEngine()
    const counting = fakeEngine({
      search: async (fen: string, movetime: number): Promise<SearchResult> => {
        searches.push(fen)
        return plain.search(fen, movetime)
      },
    })
    seedGame(READY)
    const { user } = renderApp(() => counting)
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(READY.length))
    // The evaluation of the seeded position has landed; count from here.
    await vi.waitFor(() => expect(searches.length).toBeGreaterThan(0))
    const asked = searches.length

    await reachTheLastRank(user)
    expect(searches).toHaveLength(asked)

    await user.click(screen.getByRole('button', { name: 'Queen' }))
    await vi.waitFor(() => expect(searches.length).toBeGreaterThan(asked))
    expect(movesOnScreen()[READY.length]).toBe('axb8=Q')
  })
})
