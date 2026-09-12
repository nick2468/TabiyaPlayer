import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { gameToPgn } from '../play'
import { recallGame } from '../storage/current-game'
import { openPgn, savePgn } from '../storage/files'
import { board, movesOnScreen, renderApp } from '../test/dom'
import { heldEngine } from '../test/held-engine'
import { playedMoves } from '../test/played-moves'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * Save game and Load game, on screen (spec section 9).
 *
 * The file itself is `game-pgn.test.ts`'s business and reading one is
 * `load-pgn.test.ts`'s. What this file asks is whether the buttons are wired
 * to them: whether Save hands over the game that is actually on the board, and
 * whether Load replaces the game, the side and the level together.
 *
 * The one thing mocked is `storage/files`, because what is under it is a save
 * dialog or a download, and neither exists in jsdom or can be driven by a
 * test. That seam is exactly where the app stops knowing where it is running.
 */
vi.mock('../storage/files', () => ({
  savePgn: vi.fn(async () => ({ message: 'Saved to your downloads folder' })),
  openPgn: vi.fn(async () => null),
}))

const saved = vi.mocked(savePgn)
const opened = vi.mocked(openPgn)

/** The message under the status line, or '' when there is none. */
function noticeSaid(): string {
  return document.querySelector('.play-column .notice')?.textContent ?? ''
}

function fileButton(name: 'Save game' | 'Load game'): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement
}

/** A file this app would have written, for Load game to read. */
function fileOf(sans: string[], side: 'white' | 'black', level: number): string {
  return gameToPgn({ moves: playedMoves(sans), side, level, at: '2026-09-11T14:32:00' })
}

describe('Save game', () => {
  it("hands the game's PGN to the file writer", async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))

    await user.click(fileButton('Save game'))
    await vi.waitFor(() => expect(saved).toHaveBeenCalled())

    const [text, name] = saved.mock.calls.at(-1) ?? []
    expect(text).toContain('[Event "Simple Chess"]')
    expect(text).toContain('1. d4')
    expect(name).toMatch(/^simple-chess-\d{4}-\d{2}-\d{2}-\d{4}\.pgn$/)
  })

  it('says where it went, and then stops saying it', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.click(fileButton('Save game'))
    await vi.waitFor(() => expect(noticeSaid()).toBe('Saved to your downloads folder'))
    // Three seconds, not a fake timer (docs/testing.md): the wait is on the
    // thing being waited for, and the default timeout is longer than it.
    await vi.waitFor(() => expect(noticeSaid()).toBe(''), { timeout: 5000 })
  }, 10000)

  it('says nothing at all when the dialog was cancelled', async () => {
    saved.mockResolvedValueOnce({ message: null })
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.click(fileButton('Save game'))
    await vi.waitFor(() => expect(saved).toHaveBeenCalled())
    expect(noticeSaid()).toBe('')
  })
})

describe('Load game', () => {
  it("replaces the game with the file's moves, side and level", async () => {
    // Three plies with the user on Black, so it is the user to move when the
    // game opens and the engine has nothing to add to the list.
    opened.mockResolvedValueOnce({
      name: 'a-game.pgn',
      text: fileOf(['e4', 'e5', 'Nf3'], 'black', 6),
    })
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.click(fileButton('Load game'))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['e4', 'e5', 'Nf3']))

    expect(board().orientation).toBe('black')
    expect((screen.getByLabelText('Black') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('Difficulty') as HTMLSelectElement).value).toBe('6')
    // And the loaded game is the one the app would reopen on (spec 10).
    expect(recallGame()).toEqual({
      version: 1,
      sans: ['e4', 'e5', 'Nf3'],
      side: 'black',
      level: 6,
    })
  })

  it('lets the engine move at once when the file leaves it to move', async () => {
    // Three plies with the user on White, so the engine is Black and Black is
    // to move the moment the file opens.
    opened.mockResolvedValueOnce({
      name: 'a-game.pgn',
      text: fileOf(['e4', 'e5', 'Nf3'], 'white', 4),
    })
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.click(fileButton('Load game'))
    // Three from the file, and the engine's reply on top of them.
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(4))
    expect(movesOnScreen().slice(0, 3)).toEqual(['e4', 'e5', 'Nf3'])
  })

  it('refuses a bad file and leaves the game alone', async () => {
    opened.mockResolvedValueOnce({ name: 'notes.pgn', text: 'just some writing about chess' })
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    const before = movesOnScreen()

    await user.click(fileButton('Load game'))
    await vi.waitFor(() =>
      expect(noticeSaid()).toBe('"just" is not a move, a comment, a variation or a header tag'),
    )
    expect(movesOnScreen()).toEqual(before)
  })

  it('changes nothing when the dialog was cancelled', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(2))
    const before = movesOnScreen()

    await user.click(fileButton('Load game'))
    await vi.waitFor(() => expect(opened).toHaveBeenCalled())
    expect(movesOnScreen()).toEqual(before)
    expect(noticeSaid()).toBe('')
  })
})

describe('while the engine is thinking', () => {
  it('offers neither button', async () => {
    const { engine, release } = heldEngine()
    const { user } = renderApp(() => engine)
    await screen.findByTestId('board')
    expect(fileButton('Save game').disabled).toBe(false)

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(fileButton('Save game').disabled).toBe(true))
    expect(fileButton('Load game').disabled).toBe(true)

    release()
    await vi.waitFor(() => expect(fileButton('Save game').disabled).toBe(false))
    expect(fileButton('Load game').disabled).toBe(false)
  })
})
