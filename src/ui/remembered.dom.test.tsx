import { cleanup, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { StrengthProfile } from '../engine'
import { board, movesOnScreen, renderApp } from '../test/dom'
import { fakeEngine } from '../test/fake-engine'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * What the app remembers, and what it does with it (spec 10; S15 items 7, 8
 * and 9).
 *
 * A remount is the closest thing a jsdom test has to a restart, which is the
 * trainer's `restart` helper: `cleanup` throws the tree away and `renderApp`
 * builds a new one over the same storage, exactly as happens when the window
 * opens again. `dom-setup.ts` empties storage between tests, so each one starts
 * from a fresh install unless it writes storage before rendering.
 */

const GAME_KEY = 'simple-chess.game'

type User = ReturnType<typeof renderApp>['user']

/** What the second run of the app sees, after everything is put away. */
function restart(): User {
  cleanup()
  return renderApp().user
}

const levels = () => screen.getByLabelText('Difficulty') as HTMLSelectElement
const radio = (name: string) => screen.getByLabelText(name) as HTMLInputElement

describe('the settings', () => {
  it('remembers the level, the side and the board size across a restart', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.selectOptions(levels(), '6')
    await user.click(radio('Black'))
    await user.click(radio('Large'))

    restart()
    await screen.findByTestId('board')
    expect(levels().value).toBe('6')
    expect(radio('Black').checked).toBe(true)
    expect(radio('Large').checked).toBe(true)
  })

  it('starts at Club, White and Small on a fresh install', async () => {
    renderApp()
    await screen.findByTestId('board')
    expect(levels().value).toBe('4')
    expect(radio('White').checked).toBe(true)
    expect(radio('Small').checked).toBe(true)
  })

  /**
   * Spec S15 item 3, at the level a person changes it: the select. The session
   * reads its profile at each search and the engine is told through its own
   * queue, so both halves have to happen before the next move is asked for.
   */
  it('tells the engine a new level before its next move', async () => {
    const told: StrengthProfile[] = []
    const engine = fakeEngine({
      setStrength: async (profile: StrengthProfile) => {
        told.push(profile)
      },
    })
    const { user } = renderApp(() => engine)
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(told.at(-1)?.level).toBe(4))

    await user.selectOptions(levels(), '6')
    // Level 6 is the engine's own limiter at 1750 (spec 6.2).
    await vi.waitFor(() => expect(told.at(-1)?.uciElo).toBe(1750))

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    expect(told.at(-1)?.uciElo).toBe(1750)
  })
})

describe('the game in progress', () => {
  it('reopens on the game the app was closed on', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')
    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    const played = movesOnScreen()
    const position = board().fen

    restart()
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(played))
    expect(board().fen).toBe(position)
  })

  it('remembers a level changed in the middle of a game', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')
    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    await user.selectOptions(levels(), '2')

    restart()
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    expect(levels().value).toBe('2')
  })

  it('forgets the game when a fresh one has no moves in it', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')
    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    await vi.waitFor(() => expect(window.localStorage.getItem(GAME_KEY)).not.toBeNull())

    await user.click(screen.getByRole('button', { name: 'New game' }))
    await vi.waitFor(() => expect(window.localStorage.getItem(GAME_KEY)).toBeNull())
  })

  it('discards a stored game that is not a record, and starts a fresh one', async () => {
    window.localStorage.setItem(GAME_KEY, '{ not json at all')
    renderApp()

    await screen.findByTestId('board')
    expect(movesOnScreen()).toEqual([])
    expect(document.querySelector('.notice.bad')).toBeNull()
    // The fresh game has nothing worth reopening, so the junk is gone with it.
    await vi.waitFor(() => expect(window.localStorage.getItem(GAME_KEY)).toBeNull())
  })

  it('discards a stored game whose moves are not legal chess', async () => {
    window.localStorage.setItem(
      GAME_KEY,
      JSON.stringify({ version: 1, sans: ['d4', 'd4'], side: 'white', level: 4 }),
    )
    renderApp()

    await screen.findByTestId('board')
    expect(movesOnScreen()).toEqual([])
    expect(document.querySelector('.notice.bad')).toBeNull()
  })
})

describe('playing Black', () => {
  /**
   * Spec S15 item 9, without the bar, which arrives in phase 4. The side is
   * applied at the next new game (spec 5.1), so the radio alone changes
   * nothing about the game already on the board.
   */
  it('lets the engine open, and turns the board the other way up', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')
    expect(board().orientation).toBe('white')

    await user.click(radio('Black'))
    // Still the old game, still White's, until a new game is started.
    expect(board().orientation).toBe('white')

    await user.click(screen.getByRole('button', { name: 'New game' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(1))
    expect(board().orientation).toBe('black')
    // The moves on offer are Black's, because it is Black's turn.
    expect(screen.getByRole('button', { name: 'move e5' })).toBeTruthy()
  })

  it('reopens a game played as Black on the same side', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')
    await user.click(radio('Black'))
    await user.click(screen.getByRole('button', { name: 'New game' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(1))
    const opening = movesOnScreen()

    restart()
    await screen.findByTestId('board')
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(opening))
    expect(board().orientation).toBe('black')
  })
})
