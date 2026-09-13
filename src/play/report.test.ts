import { describe, expect, it } from 'vitest'
import { positionKey } from '../model/position'
import { playedMoves } from '../test/played-moves'
import type { Evaluation } from './evalbar'
import {
  buildReport,
  describeSlip,
  scanForSlips,
  stoppedAt,
  verdictBand,
  verdictInWords,
  type Evaluations,
} from './report'

/**
 * Origin: London src/play/play.test.ts, the report describes, adapted: the map
 * holds an Evaluation, the trainee is the user, and nothing about the book.
 */

/** An entry as the bar makes one. Only `pawns` is read by the scan. */
function at(pawns: number): Evaluation {
  return { pawns, text: pawns.toFixed(1) }
}

describe('verdictInWords', () => {
  it('uses the bands from the spec', () => {
    expect(verdictInWords(0)).toBe('Level')
    expect(verdictInWords(0.39)).toBe('Level')
    expect(verdictInWords(0.7)).toBe('Slightly better for White')
    expect(verdictInWords(-0.7)).toBe('Slightly better for Black')
    expect(verdictInWords(1.8)).toBe('Clearly better for White')
    expect(verdictInWords(-3)).toBe('Winning for Black')
  })

  it('names a forced mate rather than showing a number', () => {
    expect(verdictInWords(100)).toBe('White has a forced mate')
    expect(verdictInWords(-100)).toBe('Black has a forced mate')
  })

  it('never puts a number in front of the user', () => {
    for (const pawns of [-100, -2.4, -0.2, 0, 0.9, 4, 100]) {
      expect(verdictInWords(pawns)).not.toMatch(/[0-9]/)
    }
  })

  it('names the band and who it favours', () => {
    expect(verdictBand(0.2)).toMatchObject({ band: 'level' })
    expect(verdictBand(1.4)).toEqual({ band: 'clear', ahead: true })
    expect(verdictBand(-100)).toEqual({ band: 'mate', ahead: false })
  })
})

describe('scanForSlips', () => {
  const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3'])

  function allLevel(): Evaluations {
    const map: Evaluations = new Map()
    for (const move of moves) {
      map.set(positionKey(move.fen), at(0))
      map.set(positionKey(move.after), at(0))
    }
    return map
  }

  it('finds nothing when nothing went wrong', () => {
    const evaluations: Evaluations = new Map()
    for (const move of moves) {
      evaluations.set(positionKey(move.fen), at(0.2))
      evaluations.set(positionKey(move.after), at(0.2))
    }
    expect(scanForSlips(moves, evaluations)).toEqual([])
  })

  it('grades a slip by how much it cost', () => {
    const evaluations = allLevel()
    // White's third move drops three pawns' worth.
    evaluations.set(positionKey(moves[4].fen), at(0.5))
    evaluations.set(positionKey(moves[4].after), at(-2.5))
    const slips = scanForSlips(moves, evaluations)
    expect(slips).toHaveLength(1)
    expect(slips[0]).toMatchObject({ san: 'e3', tag: 'blunder', loss: 3 })
  })

  it('scans only the user, since the report is on their play', () => {
    // Black blunders on move 1 and the evaluation stays there. White's moves
    // lose nothing, so the report has nothing to say, however bad Black was.
    const evaluations: Evaluations = new Map()
    evaluations.set(positionKey(moves[0].fen), at(0))
    evaluations.set(positionKey(moves[0].after), at(0))
    for (const move of moves.slice(1)) {
      evaluations.set(positionKey(move.fen), at(5))
      evaluations.set(positionKey(move.after), at(5))
    }
    expect(scanForSlips(moves, evaluations)).toEqual([])
  })

  it('turns the subtraction round for a user playing Black', () => {
    const evaluations = allLevel()
    // Black's first reply hands White two pawns, which is the number going UP.
    evaluations.set(positionKey(moves[1].fen), at(0))
    evaluations.set(positionKey(moves[1].after), at(2.2))
    const slips = scanForSlips(moves, evaluations, 'black')
    expect(slips).toHaveLength(1)
    expect(slips[0]).toMatchObject({ san: 'd5', tag: 'blunder' })
  })

  it('says nothing about a move it could not evaluate', () => {
    // Only the first position scanned, so nothing can be compared.
    const evaluations: Evaluations = new Map()
    evaluations.set(positionKey(moves[0].fen), at(0))
    expect(scanForSlips(moves, evaluations)).toEqual([])
  })

  it('lists slips most recent first, not worst first', () => {
    const evaluations = allLevel()
    // The blunder is EARLIER than the inaccuracy, so worst-first would put it
    // on top and move order puts it second.
    evaluations.set(positionKey(moves[0].after), at(-2.2))
    evaluations.set(positionKey(moves[4].after), at(-0.8))
    const slips = scanForSlips(moves, evaluations)
    expect(slips.map((slip) => [slip.ply, slip.tag])).toEqual([
      [4, 'inaccuracy'],
      [0, 'blunder'],
    ])
  })

  it('describes a slip in words, with no numbers', () => {
    const sentence = describeSlip({
      ply: 4,
      san: 'e3',
      before: 0.5,
      after: -2.5,
      loss: 3,
      tag: 'blunder',
    })
    expect(sentence).toBe(
      'A blunder on move 3: e3 turned "slightly better for white" into "winning for black".',
    )
  })

  it('does not say a move turned a verdict into the same verdict', () => {
    // A position can get worse without changing what it is called.
    const sentence = describeSlip({
      ply: 18,
      san: 'Qe2',
      before: -4,
      after: -9,
      loss: 5,
      tag: 'blunder',
    })
    expect(sentence).toBe(
      'A blunder on move 10: Qe2 gave up more ground in a position already winning for black.',
    )
  })
})

describe('what the engine preferred', () => {
  const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3'])

  function slipAtE3(): Evaluations {
    const map: Evaluations = new Map()
    for (const move of moves) {
      map.set(positionKey(move.fen), at(0))
      map.set(positionKey(move.after), at(0))
    }
    map.set(positionKey(moves[4].after), at(-0.8))
    return map
  }

  it("gives a slip the engine's move from the position it was played in, as SAN", () => {
    // e3 was the slip; the engine wanted the knight out. UCI, as the engine
    // says it; the slip says it the way a move list does.
    const bestMoves = new Map([[positionKey(moves[4].fen), 'g1f3']])
    const [slip] = scanForSlips(moves, slipAtE3(), 'white', bestMoves)
    expect(slip.san).toBe('e3')
    expect(slip.better).toBe('Nf3')
  })

  it('says nothing when no best move was kept, and carries no key for it', () => {
    const [slip] = scanForSlips(moves, slipAtE3(), 'white')
    expect(slip.better).toBeUndefined()
    expect('better' in slip).toBe(false)
  })

  it("says nothing when the engine's move is the move that was played", () => {
    const bestMoves = new Map([[positionKey(moves[4].fen), 'e2e3']])
    const [slip] = scanForSlips(moves, slipAtE3(), 'white', bestMoves)
    expect(slip.better).toBeUndefined()
  })

  it('names it in the sentence, numbered as the move list writes it', () => {
    expect(
      describeSlip({
        ply: 6,
        san: 'Nf3',
        before: 0.5,
        after: 0.1,
        loss: 0.4,
        tag: 'inaccuracy',
        better: 'Nc3',
      }),
    ).toBe(
      'An inaccuracy on move 4: Nf3 turned "slightly better for white" into "level". The engine preferred 4.Nc3.',
    )
    // Black's move, with the dots.
    expect(
      describeSlip({
        ply: 7,
        san: 'e6',
        before: 0.1,
        after: 1.2,
        loss: 1.1,
        tag: 'mistake',
        better: 'Bf5',
      }),
    ).toBe(
      'A mistake on move 4: e6 turned "level" into "clearly better for white". The engine preferred 4...Bf5.',
    )
  })

  it('reaches the report through buildReport', () => {
    const bestMoves = new Map([[positionKey(moves[4].fen), 'g1f3']])
    const report = buildReport(moves, slipAtE3(), 'white', undefined, 0, bestMoves)
    expect(report.slips[0].better).toBe('Nf3')
  })
})

describe('buildReport', () => {
  const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3'])

  it('takes the final position as the verdict, in words', () => {
    const evaluations: Evaluations = new Map([[positionKey(moves[4].after), at(1.4)]])
    const report = buildReport(moves, evaluations, 'white')
    expect(report.verdict).toBe('Clearly better for White')
    expect(report.finalEval).toBe(1.4)
  })

  it('produces no slips and says it was not scanned for a game with no evaluations', () => {
    // This app's own: a scan that answered nothing at all must not read as a
    // game in which nothing went wrong.
    const report = buildReport(moves, new Map(), 'white')
    expect(report.slips).toEqual([])
    expect(report.verdict).toBe('Not scanned')
    expect(report.finalEval).toBeUndefined()
  })

  it('takes the outcome as the verdict when the game ended in a checkmate', () => {
    // A mated position has no evaluation, because the engine has no move to
    // search there, and "Not scanned" beside a mate reads as a broken scan.
    const report = buildReport(moves, new Map(), 'white', 'You won by checkmate')
    expect(report.verdict).toBe('You won by checkmate')
    expect(report.outcome).toBe('You won by checkmate')
  })

  it('carries the hint count, and leaves it off entirely when there were none', () => {
    expect(buildReport(moves, new Map(), 'white', undefined, 2).hints).toBe(2)
    const clean = buildReport(moves, new Map(), 'white', undefined, 0)
    expect(clean.hints).toBeUndefined()
    expect('hints' in clean).toBe(false)
  })
})

describe('stoppedAt', () => {
  it('names the move a stopped game got to', () => {
    expect(stoppedAt(playedMoves(['d4', 'd5', 'Bf4']))).toBe('Stopped after move 2')
  })

  it('never names a move that was not played', () => {
    expect(stoppedAt([])).toBe('Stopped before the first move')
  })
})
