import { describe, expect, it } from 'vitest'
import { positionKey } from '../model/position'
import { fakeEngine } from '../test/fake-engine'
import { playedMoves } from '../test/played-moves'
import type { Evaluations } from './report'
import { scanGame } from './scan'

/** Origin: London src/play/play.test.ts scanGame, adapted to the entry type. */

describe('scanGame', () => {
  it("evaluates every position once, from White's point of view", async () => {
    const moves = playedMoves(['d4', 'd5'])
    const engine = fakeEngine({ cp: 30 })
    const { evaluations, bestMoves } = await scanGame(moves, engine, 50)
    // Three positions: before d4, after d4, after d5.
    expect(evaluations.size).toBe(3)
    // And the engine's move at each, from the same search: the fake plays the
    // first legal move, which from the start is a3.
    expect(bestMoves.size).toBe(3)
    expect(bestMoves.get(positionKey(moves[0].fen))).toBe('a2a3')
    // The engine always says +0.30 for the side to move, so White's view flips.
    expect(evaluations.get(positionKey(moves[0].fen))?.pawns).toBe(0.3)
    expect(evaluations.get(positionKey(moves[1].fen))?.pawns).toBe(-0.3)
  })

  it('keeps the text the bar prints, so the report and the bar agree', async () => {
    // The entry is the bar's own, made where the side to move is still known.
    const moves = playedMoves(['d4'])
    const { evaluations } = await scanGame(moves, fakeEngine({ cp: 30 }), 10)
    expect(evaluations.get(positionKey(moves[0].fen))?.text).toBe('+0.3')
  })

  it('reports progress so a long scan can show it', async () => {
    const seen: [number, number][] = []
    await scanGame(playedMoves(['d4', 'd5']), fakeEngine(), 10, (done, total) =>
      seen.push([done, total]),
    )
    expect(seen).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ])
  })

  it('keeps what the live bar already worked out rather than searching it again', async () => {
    const moves = playedMoves(['d4', 'd5'])
    const known: Evaluations = new Map([
      [positionKey(moves[0].fen), { pawns: 1.5, text: '+1.5' }],
    ])
    let searches = 0
    const engine = fakeEngine({ cp: 30 })
    const counted = {
      ...engine,
      search: (fen: string, movetime: number) => {
        searches += 1
        return engine.search(fen, movetime)
      },
    }
    const { evaluations } = await scanGame(moves, counted, 10, undefined, known)
    // The report is judged by the number that was on the screen, not by a fresh
    // search that might disagree with it.
    expect(evaluations.get(positionKey(moves[0].fen))?.pawns).toBe(1.5)
    expect(evaluations.size).toBe(3)
    // And the scan is one position shorter than it would have been.
    expect(searches).toBe(2)
  })
})
