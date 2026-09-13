import { describe, expect, it } from 'vitest'
import { playedMoves } from '../test/played-moves'
import { canPlayFromPly, whyNotPlayable, type ReplayedGame } from './play-from-replay'

/**
 * Origin: London src/ui/play-from-replay.test.ts, adapted: the four
 * `whyNotPlayable` cases and the colour case, which are the ones this app has;
 * the label and request tests went with the functions that made them.
 *
 * Which plies can be played from. The DOM test beside this drives the button
 * through the screen; this holds the arithmetic.
 */

function game(sans: string[]): ReplayedGame {
  return { moves: playedMoves(sans) }
}

describe('which positions can be played from', () => {
  const g = game(['d4', 'd5', 'Bf4', 'Nf6'])

  it('says yes where it is the user move', () => {
    // White's game: even plies are White to move.
    expect(canPlayFromPly(g, 0, 'white')).toBe(true)
    expect(canPlayFromPly(g, 2, 'white')).toBe(true)
    expect(canPlayFromPly(g, 4, 'white')).toBe(true)
    expect(whyNotPlayable(g, 2, 'white')).toBe('')
  })

  it('says no where the engine is to move, with a step to take', () => {
    expect(canPlayFromPly(g, 1, 'white')).toBe(false)
    expect(whyNotPlayable(g, 1, 'white')).toBe(
      "It is the engine's move here. Step one move on or back.",
    )
  })

  it('says no at a finished position', () => {
    const mate = game(['f3', 'e5', 'g4', 'Qh4#'])
    expect(canPlayFromPly(mate, 4, 'white')).toBe(false)
    expect(whyNotPlayable(mate, 4, 'white')).toBe('The game is over here.')
    // And the position before the mate is still the engine's move, not the end.
    expect(whyNotPlayable(mate, 3, 'white')).toMatch(/engine/)
  })

  it('says no when there is no game at all', () => {
    expect(canPlayFromPly(game([]), 0, 'white')).toBe(false)
    expect(whyNotPlayable(game([]), 0, 'white')).toBe('There is no game to play from here.')
  })

  it('reads the colour it is given, not the one White would have', () => {
    const asBlack = game(['e4', 'c6', 'd4', 'd5'])
    expect(canPlayFromPly(asBlack, 1, 'black')).toBe(true)
    expect(canPlayFromPly(asBlack, 2, 'black')).toBe(false)
  })
})
