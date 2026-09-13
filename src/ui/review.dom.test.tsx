import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Engine, SearchResult } from '../engine'
import { positionKey } from '../model/position'
import { recallGame } from '../storage/current-game'
import { savePgn } from '../storage/files'
import { engineByProfile } from '../test/by-profile'
import { movesOnScreen, renderApp, seedGame } from '../test/dom'
import { fakeEngine } from '../test/fake-engine'
import { playedMoves } from '../test/played-moves'
import { scoredEngine } from '../test/scored-engine'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The same seam `files.dom.test.tsx` uses: under it is a save dialog or a
 * download, and neither exists in jsdom.
 */
vi.mock('../storage/files', () => ({
  savePgn: vi.fn(async () => ({ message: 'Saved to your downloads folder' })),
  openPgn: vi.fn(async () => null),
}))

/**
 * Stop and review, and Stop and discard (spec 18.3, S15 items 12 and 13).
 *
 * The report's own arithmetic is `report.test.ts`'s business and the scan is
 * `scan.test.ts`'s. What this file asks is whether the two buttons are wired to
 * them: whether a game with a blunder in it comes back named and graded with
 * the engine's better move, and whether discarding one really leaves nothing.
 */

/** The game the blunder tests play: 1.d4 d5 2.e3 Nf6, with e3 the slip. */
const GAME = ['d4', 'd5', 'e3', 'Nf6']
/** The engine's two replies, so the game is the same one every run. */
const REPLIES = ['d7d5', 'g8f6']
const PLAYED = playedMoves(GAME)

/**
 * White is slightly better before e3 and losing after it: three pawns, which is
 * a blunder. It stays lost to the end, so the final position's verdict is the
 * blunder's own. Every other position is level, so the scan has exactly one
 * thing to say.
 */
const SCORES: Record<string, number> = {
  [positionKey(PLAYED[2].fen)]: 0.5,
  [positionKey(PLAYED[2].after)]: -2.5,
  [positionKey(PLAYED[3].after)]: -2.5,
}

function report(): HTMLElement | null {
  return document.querySelector('.report')
}

function slipsSaid(): string[] {
  return [...document.querySelectorAll('.slips li')].map((item) => item.textContent ?? '')
}

function button(name: string): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement
}

describe('Stop and review', () => {
  it('names a blunder with its move number, its tag and the better move', async () => {
    // The engine plays d5 for Black; the user plays the two White moves.
    const { user } = renderApp(() => scoredEngine(SCORES, REPLIES))
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['d4', 'd5']))
    await user.click(await screen.findByRole('button', { name: 'move e3' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(GAME))

    await user.click(button('Stop and review'))
    await vi.waitFor(() => expect(report()).not.toBeNull())

    const slips = slipsSaid()
    expect(slips).toHaveLength(1)
    // Move 2, because e3 is White's second move, and the words of the bands
    // either side of it.
    expect(slips[0]).toContain('A blunder on move 2: e3')
    expect(slips[0]).toContain('turned "slightly better for white" into "winning for black"')
    expect(slips[0]).toMatch(/The engine preferred 2\.\S+\./)

    // The verdict is the FINAL position's, in words, with the bar beside it.
    expect(report()?.textContent).toContain('Winning for Black')
    expect(screen.getByRole('img', { name: 'Evaluation: winning for black' })).toBeTruthy()
  })

  it('says so plainly when nothing went wrong', async () => {
    const { user } = renderApp(() => scoredEngine({}, REPLIES))
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['d4', 'd5']))

    await user.click(button('Stop and review'))
    await vi.waitFor(() => expect(report()).not.toBeNull())
    expect(report()?.textContent).toContain('Nothing the engine calls an inaccuracy or worse')
  })

  it('locks the board and the two move buttons once the report is up', async () => {
    const { user } = renderApp(() => scoredEngine(SCORES, REPLIES))
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['d4', 'd5']))
    await user.click(button('Stop and review'))
    await vi.waitFor(() => expect(report()).not.toBeNull())

    // No move to click: the board is given no movable colour, so the stub
    // renders none. Undo, Redo and Hint are greyed with it (spec 18.4).
    expect(screen.queryByRole('button', { name: /^move / })).toBeNull()
    expect(button('Undo').disabled).toBe(true)
    expect(button('Redo').disabled).toBe(true)
    expect(button('Hint').disabled).toBe(true)
    // And the two buttons that got here are gone, replaced by the report.
    expect(screen.queryByRole('button', { name: 'Stop and review' })).toBeNull()
    // The head row says so, rather than asking for a move it will not take.
    expect(document.querySelector('.play-status')?.textContent).toBe('Game reviewed')
  })

  it('reviews a game that ended in checkmate without a scan failure', async () => {
    // Fool's mate, with the user as White: the final position is mated, so the
    // engine has no move to search there and no evaluation to give it.
    const { user } = renderApp(() => scoredEngine({}, ['e7e5', 'd8h4']))
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move f3' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['f3', 'e5']))
    await user.click(await screen.findByRole('button', { name: 'move g4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toHaveLength(4))

    // The notice says the game is not finished with until it has been looked at.
    expect(document.querySelector('.play-actions .notice')?.textContent).toBe(
      'You were checkmated. Review it to see what it cost.',
    )

    await user.click(button('Review the game'))
    await vi.waitFor(() => expect(report()).not.toBeNull())
    // The outcome stands in for a verdict, rather than "Not scanned".
    expect(report()?.textContent).toContain('You were checkmated')
  })

  it('carries the hint count into the report', async () => {
    const { user } = renderApp(() => scoredEngine({}, REPLIES))
    await screen.findByTestId('board')

    await user.click(button('Hint'))
    await vi.waitFor(() => expect(document.querySelector('.hint-said')).not.toBeNull())
    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['d4', 'd5']))

    await user.click(button('Stop and review'))
    await vi.waitFor(() => expect(report()).not.toBeNull())
    expect(document.querySelector('.hint-count')?.textContent).toBe('You used 1 hint.')
  })
})

/**
 * An engine whose ANALYSIS answers stop arriving after the first few, so a test
 * can look at the screen while a scan is half done.
 *
 * `heldEngine` holds the engine's MOVE, which is the other half of the same
 * problem and no use here. The first answers are let through because the app
 * evaluates the position it opens on before anything else, and a scan cannot be
 * watched from a game that never started.
 */
function heldScan(letThrough: number): { engine: Engine; release: () => void } {
  let letGo: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    letGo = resolve
  })
  const plain = fakeEngine()
  let seen = 0
  const engine = engineByProfile({
    analysis: async (fen: string, movetime: number): Promise<SearchResult> => {
      seen += 1
      if (seen > letThrough) await held
      return plain.search(fen, movetime)
    },
    playing: plain.search,
  })
  return { engine, release: () => letGo() }
}

describe('while the scan runs', () => {
  it('says how far it has got and greys everything that touches the engine', async () => {
    // A game reopened from storage: only its final position was ever evaluated,
    // so the scan has the rest of them to do. A game played through in the app
    // has every position already and scans nothing.
    seedGame(GAME)
    const { engine, release } = heldScan(1)
    const { user } = renderApp(() => engine)
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(GAME))

    await user.click(button('Stop and review'))
    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: /^Scanning \d+ of \d+\.\.\.$/ })).toBeTruthy(),
    )
    expect(button('Undo').disabled).toBe(true)
    expect(button('Redo').disabled).toBe(true)
    expect(button('Hint').disabled).toBe(true)
    expect(button('Save game').disabled).toBe(true)
    expect(button('Load game').disabled).toBe(true)
    expect(button('Stop and discard').disabled).toBe(true)

    release()
    await vi.waitFor(() => expect(report()).not.toBeNull())
  })
})

describe('Copy game and Save game', () => {
  /**
   * jsdom has no clipboard. `userEvent.setup()` installs one, which is why
   * nothing here stubs `navigator.clipboard` itself: a second stub would be
   * replaced by user-event's on the next render and the test would read an
   * array nothing ever wrote to. The app's `execCommand` fallback is for an
   * embedded browser that refuses permission, and there is none here to refuse.
   */
  it('write the same text for a reviewed game, with the report in it', async () => {
    const { user } = renderApp(() => scoredEngine(SCORES, REPLIES))
    await screen.findByTestId('board')

    await user.click(button('Hint'))
    await vi.waitFor(() => expect(document.querySelector('.hint-said')).not.toBeNull())
    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['d4', 'd5']))
    await user.click(await screen.findByRole('button', { name: 'move e3' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(GAME))

    await user.click(button('Stop and review'))
    await vi.waitFor(() => expect(report()).not.toBeNull())

    await user.click(button('Copy game'))
    await vi.waitFor(() =>
      expect(document.querySelector('.copy-game .hint')?.textContent).toBe('Copied'),
    )
    await user.click(button('Save game'))
    await vi.waitFor(() => expect(vi.mocked(savePgn)).toHaveBeenCalled())

    const copied = await navigator.clipboard.readText()
    const [saved] = vi.mocked(savePgn).mock.calls.at(-1) ?? []
    expect(saved).toBe(copied)
    // And what the report put in it: the hint count before the first move, the
    // slip beside the move that was it, and the verdict at the end.
    expect(copied).toContain('{Played with 1 hint.}')
    expect(copied).toContain('blunder: slightly better for white to winning for black')
    expect(copied).toContain('Winning for Black. Stopped after move 2.')
  })

})

describe('Stop and discard', () => {
  it('leaves no report, no remembered game and a fresh board', async () => {
    const { user } = renderApp(() => fakeEngine({ move: 'd7d5' }))
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['d4', 'd5']))
    expect(recallGame()).not.toBeNull()

    await user.click(button('Stop and discard'))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual([]))
    expect(report()).toBeNull()
    expect(recallGame()).toBeNull()
    // A fresh game, not an empty screen: the two buttons are back.
    expect(button('Stop and review')).toBeTruthy()
  })

  it('puts a report away and starts again, with nothing kept', async () => {
    const { user } = renderApp(() => scoredEngine(SCORES, REPLIES))
    await screen.findByTestId('board')

    await user.click(await screen.findByRole('button', { name: 'move d4' }))
    await vi.waitFor(() => expect(movesOnScreen()).toEqual(['d4', 'd5']))
    await user.click(button('Stop and review'))
    await vi.waitFor(() => expect(report()).not.toBeNull())

    // New game is the way out of a report this phase; Keep playing is phase 11.
    await user.click(button('New game'))
    await vi.waitFor(() => expect(report()).toBeNull())
    expect(movesOnScreen()).toEqual([])
  })
})
