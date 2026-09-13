import { describe, expect, it } from 'vitest'
import { parsePgn } from '../model/pgn'
import { playedMoves } from '../test/played-moves'
import { gameToPgn, pgnDate, pgnResult, saveFileName, type GameForPgn } from './game-pgn'
import { loadPgn } from './load-pgn'

/**
 * The game as text, which is how it leaves the app (spec 9.1).
 *
 * The first test is a string comparison against the specification's own
 * example, because that example is the agreement: every tag, the comment and
 * the result token, in order. The rest ask the app's own reader, which is the
 * judge that matters for a file that has to come back.
 *
 * Every timestamp here is written WITHOUT a zone, so it is read as local time
 * on whatever machine runs the suite. `pgnDate` and `saveFileName` both stamp
 * local time, because both are for the person who will look at the file, and a
 * `Z` here would make the day depend on the timezone the test ran in.
 */

const moves = playedMoves(['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6'])

const game: GameForPgn = {
  moves,
  side: 'white',
  level: 4,
  at: '2026-09-11T14:32:00',
}

describe('gameToPgn', () => {
  it('writes the file the specification shows', () => {
    expect(gameToPgn(game)).toBe(
      [
        '[Event "Simply Chess"]',
        '[Site "-"]',
        '[Date "2026.09.11"]',
        '[Round "-"]',
        '[White "You"]',
        '[Black "Stockfish level 4"]',
        '[Result "*"]',
        '',
        '1. d4 d5 2. Bf4 Nf6 3. e3 e6 ' +
          '{Stopped after move 3. White was played by you at level 4.} *',
        '',
      ].join('\n'),
    )
  })

  it('is read back by the app own reader, with no errors', () => {
    const result = parsePgn(gameToPgn(game))
    expect(result.errors).toEqual([])
    expect(result.games).toHaveLength(1)
    expect(result.games[0].moves.map((move) => move.san)).toEqual(moves.map((move) => move.san))
  })

  it('puts you on the right side of the board when you played Black', () => {
    const { tags } = parsePgn(gameToPgn({ ...game, side: 'black' })).games[0]
    expect(tags.White).toBe('Stockfish level 4')
    expect(tags.Black).toBe('You')
  })

  it('says the outcome in words when the game ended, and puts it in the result', () => {
    const text = gameToPgn({ ...game, outcome: 'You won by checkmate' })
    expect(parsePgn(text).games[0].tags.Result).toBe('1-0')
    expect(parsePgn(text).games[0].moves.at(-1)?.comment).toBe(
      'You won by checkmate. White was played by you at level 4.',
    )
    expect(text.trimEnd().endsWith('1-0')).toBe(true)
  })

  /**
   * The one case the trainer never meets: it writes a game out when the game is
   * over, and this app has a Save game button on a board nobody has touched.
   * "Stopped after move 1" would name a move that was never played.
   */
  it('says so when the game has not started', () => {
    const text = gameToPgn({ ...game, moves: [] })
    expect(text).toContain('{Stopped before the first move. White was played by you at level 4.}')
    expect(parsePgn(text).errors).toEqual([])
  })

  it('says nothing about a report, because there is none', () => {
    const text = gameToPgn(game)
    expect(text).not.toContain('hint')
    expect(parsePgn(text).games[0].intro).toBeNull()
    // Every move but the last carries no comment at all.
    const played = parsePgn(text).games[0].moves
    expect(played.slice(0, -1).map((move) => move.comment)).toEqual([null, null, null, null, null])
  })
})

/**
 * What the report adds to the file, once a game has been reviewed (spec 18.6).
 * A game saved before it is reviewed is untouched by any of this, which is what
 * the describe above holds.
 */
describe('a reviewed game', () => {
  /** The report the provider would have built for `moves`, with e3 the slip. */
  const reviewed: GameForPgn = {
    ...game,
    report: {
      slips: [
        {
          ply: 4,
          san: 'e3',
          before: 0.5,
          after: -2.5,
          loss: 3,
          tag: 'blunder',
          better: 'Nf3',
        },
      ],
      verdict: 'Winning for Black',
      finalEval: -2.5,
      outcome: undefined,
      hints: 2,
    },
  }

  it('says how many hints were used, before the first move', () => {
    expect(parsePgn(gameToPgn(reviewed)).games[0].intro).toBe('Played with 2 hints.')
  })

  it('counts one hint in the singular', () => {
    const text = gameToPgn({ ...reviewed, report: { ...reviewed.report!, hints: 1 } })
    expect(parsePgn(text).games[0].intro).toBe('Played with 1 hint.')
  })

  it('says nothing about hints when there were none', () => {
    const text = gameToPgn({ ...reviewed, report: { ...reviewed.report!, hints: undefined } })
    expect(parsePgn(text).games[0].intro).toBeNull()
    expect(text).not.toContain('hint')
  })

  it('comments the move that was the slip, and no other', () => {
    const played = parsePgn(gameToPgn(reviewed)).games[0].moves
    expect(played[4].comment).toBe(
      'blunder: slightly better for white to winning for black; the engine preferred 3.Nf3',
    )
    expect(played.slice(0, 4).map((move) => move.comment)).toEqual([null, null, null, null])
  })

  it('ends on the verdict as well as where the game got to', () => {
    expect(parsePgn(gameToPgn(reviewed)).games[0].moves.at(-1)?.comment).toBe(
      'Winning for Black. Stopped after move 3. White was played by you at level 4.',
    )
  })

  /**
   * A mated position has no evaluation, so the report takes the outcome as its
   * verdict. The trainer's writer then prints it twice, once as the verdict and
   * once as the outcome: "You won by checkmate. You won by checkmate."
   */
  it('does not say a checkmate twice', () => {
    const text = gameToPgn({
      ...reviewed,
      outcome: 'You won by checkmate',
      report: {
        ...reviewed.report!,
        verdict: 'You won by checkmate',
        outcome: 'You won by checkmate',
        finalEval: undefined,
      },
    })
    expect(parsePgn(text).games[0].moves.at(-1)?.comment).toBe(
      'You won by checkmate. White was played by you at level 4.',
    )
  })

  it('still loads back as the same game, because the reader ignores comments', () => {
    const result = parsePgn(gameToPgn(reviewed))
    expect(result.errors).toEqual([])
    expect(result.games[0].moves.map((move) => move.san)).toEqual(moves.map((move) => move.san))

    // And through the app's own loader, which is what Load game calls (S8).
    const loaded = loadPgn(gameToPgn(reviewed))
    expect(loaded).toEqual({ sans: moves.map((move) => move.san), side: 'white', level: 4 })
  })
})

describe('the result', () => {
  it('is a star for a game that was stopped rather than finished', () => {
    expect(pgnResult(undefined, 'white')).toBe('*')
    expect(pgnResult('Stopped after move 12', 'white')).toBe('*')
  })

  it('turns the outcome round for the colour the user played', () => {
    expect(pgnResult('You won by checkmate', 'white')).toBe('1-0')
    expect(pgnResult('You won by checkmate', 'black')).toBe('0-1')
    expect(pgnResult('You were checkmated', 'white')).toBe('0-1')
    expect(pgnResult('You were checkmated', 'black')).toBe('1-0')
  })

  it('calls every draw a draw', () => {
    expect(pgnResult('Drawn by stalemate', 'white')).toBe('1/2-1/2')
    expect(pgnResult('Drawn by repetition', 'black')).toBe('1/2-1/2')
    expect(pgnResult('Drawn: neither side has enough to mate', 'white')).toBe('1/2-1/2')
  })
})

describe('the date', () => {
  it('is the PGN shape', () => {
    expect(pgnDate('2026-09-03T02:15:00')).toBe('2026.09.03')
  })

  it('is the standard unknown date when the record has no usable one', () => {
    expect(pgnDate('not a date')).toBe('????.??.??')
  })
})

describe('the file name', () => {
  it('stamps the clock to the minute, padded', () => {
    expect(saveFileName('2026-09-11T14:32:00')).toBe('simply-chess-2026-09-11-1432.pgn')
    expect(saveFileName('2026-01-02T03:04:00')).toBe('simply-chess-2026-01-02-0304.pgn')
  })

  it('loses the stamp rather than printing nonsense', () => {
    expect(saveFileName('not a date')).toBe('simply-chess.pgn')
  })
})
