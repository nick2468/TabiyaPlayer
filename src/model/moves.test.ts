import { describe, expect, it } from 'vitest'
import { sanForMove, squaresForSan } from './moves'

/**
 * Origin: London src/model/grade.test.ts, the sanForMove and squaresForSan tests only; one test renamed.
 * The trainer's tests read the position from a drill card. Here it is written
 * out: the position after 1.d4 d5 2.Bf4 Nf6, White to move.
 */
const FEN = 'rnbqkb1r/ppp1pppp/5n2/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR w KQkq - 2 3'

describe('sanForMove', () => {
  it('turns a move made on the board into notation', () => {
    expect(sanForMove(FEN, 'e2', 'e3')).toBe('e3')
    expect(sanForMove(FEN, 'b1', 'c3')).toBe('Nc3')
  })

  it('returns nothing for a move that is not legal', () => {
    expect(sanForMove(FEN, 'e2', 'e5')).toBeNull()
  })

  it('promotes to a queen when no piece is given', () => {
    const promoting = '8/4P3/8/8/8/8/8/4K2k w - - 0 1'
    expect(sanForMove(promoting, 'e7', 'e8')).toBe('e8=Q')
  })
})

describe('squaresForSan', () => {
  it('finds the squares a move runs between', () => {
    expect(squaresForSan(FEN, 'e3')).toEqual({ from: 'e2', to: 'e3' })
    expect(squaresForSan(FEN, 'Bxc7')).toEqual({ from: 'f4', to: 'c7' })
  })

  it('returns nothing for a move that is not legal here', () => {
    expect(squaresForSan(FEN, 'Qh5')).toBeNull()
  })
})
