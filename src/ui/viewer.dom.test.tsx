import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { positionKey } from '../model/position'
import { board, movesOnScreen, renderApp, seedGame } from '../test/dom'
import { playedMoves } from '../test/played-moves'
import { scoredEngine } from '../test/scored-engine'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The review viewer, Keep playing and Play from here (spec 18.4, S15 items 14,
 * 15 and 16).
 *
 * The arithmetic underneath is `replay.test.ts`'s and
 * `play-from-replay.test.ts`'s. What this file asks is whether the screen is
 * wired to it: whether clicking a move really moves the board, whether the keys
 * step, and whether the two ways on from a report do what they say.
 *
 * Three mounts and no more. Each is a whole app with a scan in it, and the
 * suite's twenty-second rule is spent on mounts before anything else, so every
 * test here shares one with as many of its neighbours as the state allows.
 *
 * One thing no test here can hold: that the list scrolls ITSELF to keep the
 * marked move in view. jsdom has no layout, so every rectangle is zero and
 * `scrollToShow` always answers 0. That is proved in the pane (spec 15), as
 * phase 6's fault was.
 */

/** The game every test walks: 1.d4 d5 2.e3 Nf6, with e3 the slip. */
const GAME = ['d4', 'd5', 'e3', 'Nf6']
const PLAYED = playedMoves(GAME)

/**
 * White is slightly better before e3 and losing after it: three pawns, which is
 * a blunder, so the report has exactly one slip and it is at ply 2.
 */
const SCORES: Record<string, number> = {
  [positionKey(PLAYED[2].fen)]: 0.5,
  [positionKey(PLAYED[2].after)]: -2.5,
  [positionKey(PLAYED[3].after)]: -2.5,
}

function button(name: string | RegExp): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement
}

/** The move button the board is standing on, by its `aria-current`. */
function markedMove(): string | null {
  return document.querySelector('.move-step.here')?.textContent ?? null
}

/** Opens the app on the seeded game and reviews it. */
async function reviewed(sans: string[] = GAME) {
  seedGame(sans)
  const { user } = renderApp(() => scoredEngine(SCORES))
  await vi.waitFor(() => expect(movesOnScreen()).toEqual(sans))
  // "Review the game" for a game that ended by itself, "Stop and review" for
  // one still going (spec 18.3). Both are the same button.
  await user.click(button(/^(Stop and review|Review the game)$/))
  await vi.waitFor(() => expect(document.querySelector('.report')).not.toBeNull())
  return { user }
}

describe('walking a reviewed game', () => {
  it('clicks, steps and marks, with the board still locked', async () => {
    const { user } = await reviewed()

    // A report nobody has walked shows the end of the game.
    expect(board().fen).toBe(PLAYED[3].after)
    expect(markedMove()).toBe('Nf6')

    // Clicking a move shows the position AFTER it (spec 18.4).
    await user.click(button('d5'))
    await vi.waitFor(() => expect(board().fen).toBe(PLAYED[1].after))
    expect(markedMove()).toBe('d5')
    expect(document.querySelector('.move-step.here')?.getAttribute('aria-current')).toBe('true')

    // The arrow keys step, back and forward.
    await user.keyboard('{ArrowLeft}')
    await vi.waitFor(() => expect(board().fen).toBe(PLAYED[0].after))
    expect(markedMove()).toBe('d4')
    await user.keyboard('{ArrowRight}')
    await vi.waitFor(() => expect(board().fen).toBe(PLAYED[1].after))

    // Never from inside a field: a left arrow in the difficulty select belongs
    // to the select.
    screen.getByLabelText('Difficulty').focus()
    await user.keyboard('{ArrowLeft}')
    expect(board().fen).toBe(PLAYED[1].after)

    // And the board is locked throughout: the stub renders a move button per
    // legal move only when it is given a movable colour.
    expect(screen.queryByRole('button', { name: /^move / })).toBeNull()
    expect(button('Undo').disabled).toBe(true)
    expect(button('Redo').disabled).toBe(true)

    // S15 item 20 in the OTHER state of row two: the row that replaced Stop and
    // review is under the board like the rest, and the panel is the report
    // (spec S19, Q24). The only buttons in it are the report's own, which are
    // its slips and Copy game rather than controls (spec 18.5).
    for (const name of ['Keep playing', 'Play from here', 'Back one move']) {
      expect(button(name).closest('.play-column')).not.toBeNull()
    }
    expect(screen.queryByRole('button', { name: 'Stop and review' })).toBeNull()
    for (const inPanel of document.querySelectorAll('.play-side button')) {
      expect(inPanel.closest('.report')).not.toBeNull()
    }

    // S15 item 23: the two arrows are in the FIRST row under the board, with
    // Undo, Redo and Hint, which is what puts them at the board's bottom right
    // corner (spec Q27). They were in row two until 1.2.1. Row two is Keep
    // playing and Play from here and nothing else.
    const rows = [...document.querySelectorAll('.play-column .play-controls')]
    for (const name of ['Back one move', 'Forward one move', 'Undo', 'Redo', 'Hint']) {
      expect(button(name).closest('.play-controls')).toBe(rows[0])
    }
    expect(button('Keep playing').closest('.play-controls')).toBe(rows[1])
    expect(rows[1].querySelector('.play-steps')).toBeNull()
  })

  it("stands on the slip's own position, with the engine's move beside it", async () => {
    const { user } = await reviewed()

    // The sentence is the button: it puts the board on the position the move
    // was played FROM, which is the only place the alternative can be seen.
    await user.click(button(/^A blunder on move 2: e3/))
    await vi.waitFor(() => expect(board().fen).toBe(PLAYED[2].fen))

    // The slip itself is the highlight, so what was played and what the engine
    // preferred are on the board at once. e3 is e2 to e3.
    expect(board().lastMove).toBe('e2e3')
    expect(board().shapes).toHaveLength(1)
    expect(board().shapes[0]).toMatch(/^blue/)

    // One step on and the arrow is gone: it belongs to that position only.
    await user.keyboard('{ArrowRight}')
    await vi.waitFor(() => expect(board().fen).toBe(PLAYED[2].after))
    expect(board().shapes).toEqual([])
  })
})

describe('the two ways on from a report', () => {
  it('keeps playing from the final position, then plays from a viewed one', async () => {
    const { user } = await reviewed()

    // Keep playing hands the board back at the game's own final position, not
    // at wherever the reader has walked to (spec 18.4).
    await user.click(button('d4'))
    await vi.waitFor(() => expect(board().fen).toBe(PLAYED[0].after))
    await user.click(button('Keep playing'))
    await vi.waitFor(() => expect(document.querySelector('.report')).toBeNull())
    expect(board().fen).toBe(PLAYED[3].after)
    expect(movesOnScreen()).toEqual(GAME)
    // Row one is live again, and row two has gone with the report.
    expect(button('Undo').disabled).toBe(false)
    expect(screen.queryByRole('button', { name: 'Back one move' })).toBeNull()

    // Review it again, and walk to a position the engine is to move in.
    await user.click(button('Stop and review'))
    await vi.waitFor(() => expect(document.querySelector('.report')).not.toBeNull())
    await user.click(button('Back one move'))
    await vi.waitFor(() => expect(board().fen).toBe(PLAYED[2].after))
    const engineMove = button('Play from here')
    expect(engineMove.disabled).toBe(true)
    expect(engineMove.title).toBe("It is the engine's move here. Step one move on or back.")

    // One more step back and it is the user's move, so the button is on.
    await user.click(button('Back one move'))
    await vi.waitFor(() => expect(board().fen).toBe(PLAYED[2].fen))
    expect(button('Play from here').disabled).toBe(false)

    // The new game is the old one's moves up to here, and nothing else.
    await user.click(button('Play from here'))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['d4', 'd5']))
    expect(document.querySelector('.report')).toBeNull()
    expect(board().fen).toBe(PLAYED[2].fen)
    // A game to play, not a game to read: the board takes moves again.
    expect(screen.getAllByRole('button', { name: /^move / }).length).toBeGreaterThan(0)
  })

  it('offers neither way on at the end of a game that ended by itself', async () => {
    // Fool's mate, with the user as White: there is nothing to keep playing.
    const mate = ['f3', 'e5', 'g4', 'Qh4#']
    const { user } = await reviewed(mate)

    expect(screen.queryByRole('button', { name: 'Keep playing' })).toBeNull()
    const here = button('Play from here')
    expect(here.disabled).toBe(true)
    expect(here.title).toBe('The game is over here.')

    // Two steps back and it is the user's move in a game that is not over, so
    // the same button comes on.
    await user.click(button('Back one move'))
    await user.click(button('Back one move'))
    await vi.waitFor(() => expect(button('Play from here').disabled).toBe(false))
    expect(screen.queryByRole('button', { name: 'Keep playing' })).toBeNull()

    // And two more, to the start, where it goes off again: ply 0 is the opening
    // position in every game here, so playing from it is New game with a
    // different name (spec 18.4). Back is disabled there, which is the other
    // reason the engine's-move sentence would be the wrong one to show.
    await user.click(button('Back one move'))
    await user.click(button('Back one move'))
    await vi.waitFor(() => expect(button('Play from here').disabled).toBe(true))
    expect(button('Play from here').title).toBe('This is the start of the game. Use New game.')
    expect(button('Back one move').disabled).toBe(true)
  })
})
