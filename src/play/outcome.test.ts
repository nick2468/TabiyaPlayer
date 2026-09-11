import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { endingFromMoves, isCheckmateOutcome, outcomeOf } from './outcome'

/**
 * The outcome sentences of spec section 5.5, one position for each.
 *
 * The trainer tests these through its session tests, which this app does not
 * copy, so they are held here directly.
 */

/** Fool's mate: 1.f3 e5 2.g4 Qh4#, White is mated. */
const FOOLS_MATE = ['f3', 'e5', 'g4', 'Qh4#']

function afterMoves(sans: string[]): Chess {
  const chess = new Chess()
  for (const san of sans) chess.move(san)
  return chess
}

describe('outcomeOf', () => {
  it("says the user was checkmated after fool's mate when the user plays White", () => {
    expect(outcomeOf(afterMoves(FOOLS_MATE), 'white')).toBe('You were checkmated')
  })

  it("says the user won after fool's mate when the user plays Black", () => {
    expect(outcomeOf(afterMoves(FOOLS_MATE), 'black')).toBe('You won by checkmate')
  })

  it('calls a black king on a8 with no move against a queen on b6 stalemate', () => {
    const chess = new Chess('k7/8/1Q6/8/8/8/8/7K b - - 0 1')
    expect(outcomeOf(chess, 'white')).toBe('Drawn by stalemate')
  })

  it('calls two bare kings a draw for want of material', () => {
    const chess = new Chess('8/8/4k3/8/8/4K3/8/8 w - - 0 1')
    expect(outcomeOf(chess, 'white')).toBe('Drawn: neither side has enough to mate')
  })

  it('calls the knights going out and back twice a draw by repetition', () => {
    const chess = afterMoves(['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8'])
    expect(outcomeOf(chess, 'white')).toBe('Drawn by repetition')
  })

  it('calls a king and rook position with the halfmove clock at 100 the fifty move rule', () => {
    const chess = new Chess('8/8/4k3/8/8/4K3/8/R7 w - - 100 80')
    expect(outcomeOf(chess, 'white')).toBe('Drawn by the fifty move rule')
  })

  it('says nothing about the starting position, which has not ended', () => {
    expect(outcomeOf(new Chess(), 'white')).toBeUndefined()
  })
})

describe('endingFromMoves', () => {
  it("gives the sentence for fool's mate played from its moves", () => {
    expect(endingFromMoves(FOOLS_MATE, 'white')).toBe('You were checkmated')
  })

  it('gives nothing for a move list that does not replay (e4 twice)', () => {
    expect(endingFromMoves(['e4', 'e4'], 'white')).toBeUndefined()
  })
})

describe('isCheckmateOutcome', () => {
  it('knows a mate from a draw and from a game still going', () => {
    expect(isCheckmateOutcome('You won by checkmate')).toBe(true)
    expect(isCheckmateOutcome('You were checkmated')).toBe(true)
    expect(isCheckmateOutcome('Drawn by stalemate')).toBe(false)
    expect(isCheckmateOutcome(undefined)).toBe(false)
  })
})
