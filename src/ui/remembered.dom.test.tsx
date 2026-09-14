import { cleanup, screen } from '@testing-library/react'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
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

const GAME_KEY = 'simply-chess.game'

type User = ReturnType<typeof renderApp>['user']

/** What the second run of the app sees, after everything is put away. */
function restart(): User {
  cleanup()
  return renderApp().user
}

const levels = () => screen.getByLabelText('Difficulty') as HTMLSelectElement
const radio = (name: string) => screen.getByLabelText(name) as HTMLInputElement

/**
 * The board size toggle (spec S15 item 18), in the header. It reads the size it
 * would switch TO, so the name it answers to is also what it says about the
 * size in use: offering the large board means the small one is on screen.
 *
 * It spent version 1.2.0 in the settings row under the board and came back to
 * the header in 1.2.1 (spec Q27). Everything in this file that presses it was
 * unaffected, which is what finding a control by its name buys.
 */
const sizeToggle = (to: 'large' | 'small') =>
  screen.getByRole('button', { name: `Switch to the ${to} board` })

/**
 * How big the board is being drawn, which the ROW carries as a custom property
 * because two columns take a measurement from it: the move list its height and
 * the side panel its ceiling (spec S26). It was on the list itself until the
 * panel needed it too. jsdom lays nothing out, so an inline style is the only
 * place a size can be read at all.
 */
const boardPixels = () =>
  (document.querySelector('.play-body') as HTMLElement | null)?.style.getPropertyValue(
    '--board-pixels',
  )

/** The theme toggle, which reads the same way and sits beside it. */
const themeToggle = (to: 'light' | 'dark') =>
  screen.getByRole('button', { name: `Switch to the ${to} theme` })

describe('the settings', () => {
  it('remembers the level, the side, the board size and the theme', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.selectOptions(levels(), '6')
    await user.click(radio('Black'))
    await user.click(sizeToggle('large'))
    // The toggle flips its own label as well as the size.
    expect(sizeToggle('small')).toBeTruthy()
    await user.click(themeToggle('light'))
    expect(document.documentElement.dataset.theme).toBe('light')

    restart()
    await screen.findByTestId('board')
    expect(levels().value).toBe('6')
    expect(radio('Black').checked).toBe(true)
    expect(sizeToggle('small')).toBeTruthy()
    expect(themeToggle('dark')).toBeTruthy()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('starts at Club, White, Small and dark on a fresh install', async () => {
    renderApp()
    await screen.findByTestId('board')
    expect(levels().value).toBe('4')
    expect(radio('White').checked).toBe(true)
    expect(sizeToggle('large')).toBeTruthy()
    expect(themeToggle('light')).toBeTruthy()
  })

  /**
   * The other half of S15 item 18, S15 item 20 while a game is going, and the
   * header half of item 23: the select is in the selector row, every control
   * EXCEPT the two view toggles is under the board, and those two are in the
   * header (spec S19, Q27). Finding each by its NAME is the point: a control
   * that moves again keeps this test, and only the place it is asked about
   * changes, which is exactly what happened to the toggles in 1.2.1.
   */
  it('puts every control but the two toggles under the board', async () => {
    renderApp()
    await screen.findByTestId('board')

    expect(levels().closest('.course-switch')).not.toBeNull()
    expect(levels().closest('.play-side')).toBeNull()

    const named = [
      'New game',
      'Undo',
      'Redo',
      'Hint',
      'Stop and review',
      'Stop and discard',
      'Save game',
      'Load game',
    ]
    for (const name of named) {
      expect(screen.getByRole('button', { name }).closest('.play-column')).not.toBeNull()
    }
    expect(radio('White').closest('.play-column')).not.toBeNull()

    // The two that change how the page is drawn rather than anything about a
    // game are in the header, and nowhere near the board (Q27).
    for (const toggle of [sizeToggle('large'), themeToggle('light')]) {
      expect(toggle.closest('.app-nav')).not.toBeNull()
      expect(toggle.closest('.play-column')).toBeNull()
    }

    // And nothing is left in the panel to press.
    expect(document.querySelector('.play-side')).not.toBeNull()
    expect(document.querySelector('.play-side button')).toBeNull()
  })

  /**
   * The pairing half of Q27: New game and Play as are one row, because the side
   * chosen is the side the next new game is played at. The row is the last of
   * the four, so it is the last `.play-controls` in the column.
   */
  it('puts New game in the same row as Play as', async () => {
    renderApp()
    await screen.findByTestId('board')

    const rows = [...document.querySelectorAll('.play-column .play-controls')]
    const newGame = screen.getByRole('button', { name: 'New game' })
    expect(rows).toHaveLength(4)
    expect(newGame.closest('.play-controls')).toBe(rows[3])
    expect(radio('White').closest('.play-controls')).toBe(rows[3])
  })

  /**
   * S15 item 25: on the web the toggle changes the board and nothing else.
   *
   * jsdom is a browser as far as this app can tell, so `isDesktop()` is false
   * and `matchWindowToBoard` returns before it imports anything. That is the
   * half of spec S21 this test can hold: no test may start a Tauri call, and
   * the window half is driven in the packaged window instead.
   *
   * The viewport is widened first because jsdom's is 1024 by 768, where the
   * fit rule answers 416 for both sizes and the toggle would look inert here
   * for the very reason it looked inert to Nick.
   */
  it('changes the board and resizes nothing on the web', async () => {
    const was = { width: window.innerWidth, height: window.innerHeight }
    onTestFinished(() => {
      window.innerWidth = was.width
      window.innerHeight = was.height
    })
    window.innerWidth = 1600
    window.innerHeight = 1280
    const { user } = renderApp()
    await screen.findByTestId('board')
    expect(boardPixels()).toBe('416px')

    await user.click(sizeToggle('large'))
    expect(boardPixels()).toBe('832px')
    await user.click(sizeToggle('small'))
    expect(boardPixels()).toBe('416px')
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
