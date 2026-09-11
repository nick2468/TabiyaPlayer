import { describe, expect, it } from 'vitest'
import { canReplayMoves } from './replay'

describe('canReplayMoves', () => {
  it('accepts a legal game', () => {
    expect(canReplayMoves(['d4', 'd5', 'Bf4', 'Nf6'])).toBe(true)
  })

  it('refuses an empty list, because there is no game to reopen', () => {
    expect(canReplayMoves([])).toBe(false)
  })

  it('refuses a move that is not legal from the position before it', () => {
    expect(canReplayMoves(['d4', 'd5', 'Qh8'])).toBe(false)
  })

  it('refuses text that is not a move at all', () => {
    expect(canReplayMoves(['d4', 'hello'])).toBe(false)
  })
})
