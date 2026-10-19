import { describe, expect, it } from 'vitest'
import { playedMoves } from '../test/played-moves'
import { gameToPgn } from './game-pgn'
import { loadPgn, type LoadedGame } from './load-pgn'

/**
 * Reading a game back (spec 9.2, and spec S15 items 5 and 6).
 *
 * The test that matters most is the round trip: what the app writes has to be
 * what the app reads, including the side and the level, which live in the tags
 * rather than in the moves. After that come the files the app did not write,
 * because those are the ones that can be anything at all, and the rule for
 * every one of them is the same: say what is wrong in a sentence and leave the
 * game on the board alone.
 */

/** The result, when the test expects a game rather than a complaint. */
function loaded(text: string): LoadedGame {
  const result = loadPgn(text)
  if ('error' in result) throw new Error(`expected a game, got: ${result.error}`)
  return result
}

/** The complaint, when the test expects one. */
function refused(text: string): string {
  const result = loadPgn(text)
  return 'error' in result ? result.error : `no complaint: it loaded ${result.sans.length} moves`
}

const sans = ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6']

describe('the round trip', () => {
  it('brings a White game back with its moves, side and level', () => {
    const text = gameToPgn({
      moves: playedMoves(sans),
      side: 'white',
      level: 4,
      at: '2026-09-11T14:32:00',
    })
    expect(loaded(text)).toEqual({ sans, side: 'white', level: 4 })
  })

  it('brings a Black game back the same way', () => {
    const text = gameToPgn({
      moves: playedMoves(sans),
      side: 'black',
      level: 7,
      at: '2026-09-11T14:32:00',
    })
    expect(loaded(text)).toEqual({ sans, side: 'black', level: 7 })
  })

  it('brings a finished game back, outcome and all', () => {
    // Fool's mate, so the file carries a result token and an outcome sentence.
    const mate = ['f3', 'e5', 'g4', 'Qh4#']
    const text = gameToPgn({
      moves: playedMoves(mate),
      side: 'white',
      level: 2,
      outcome: 'You were checkmated',
      at: '2026-09-11T14:32:00',
    })
    expect(loaded(text)).toEqual({ sans: mate, side: 'white', level: 2 })
  })
})

describe('a file from somewhere else', () => {
  // Variations, comments, glyphs and tags this app never writes: a perfectly
  // ordinary PGN from another program.
  const foreign = [
    '[Event "Rated blitz game"]',
    '[Site "https://example.org/abc"]',
    '[White "hikaru"]',
    '[Black "magnus"]',
    '[Result "1-0"]',
    '',
    '1. e4 {The most common first move.} e5 2. Nf3 (2. f4 exf4 {The King\'s Gambit.})',
    '2... Nc6 3. Bb5! a6 1-0',
    '',
  ].join('\n')

  it('loads its main line and nothing else', () => {
    expect(loaded(foreign).sans).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'])
  })

  it('puts the user on White, because neither player is "You"', () => {
    expect(loaded(foreign).side).toBe('white')
  })

  it('names no level, so the current one stays', () => {
    expect(loaded(foreign).level).toBeNull()
  })

  it('ignores every game after the first', () => {
    const two = `${foreign}\n[Event "Another"]\n[White "someone"]\n\n1. d4 d5 *\n`
    expect(loaded(two).sans).toEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'])
  })

  it('refuses a game that starts from a set position', () => {
    const fromPosition = [
      '[Event "Puzzle"]',
      '[SetUp "1"]',
      '[FEN "8/8/8/8/8/5k2/6q1/7K b - - 0 1"]',
      '',
      '1... Qg1# 0-1',
      '',
    ].join('\n')
    expect(refused(fromPosition)).toBe('That file starts from a position this app cannot load')
  })

  // Saved before the rename, so the Event tag still says Simply Chess. Those
  // files are on people's disks and must go on loading (spec S27).
  it('reads a level out of a file saved as Simply Chess, whichever side wrote it', () => {
    const theirs = [
      '[Event "Simply Chess"]',
      '[White "Stockfish level 6"]',
      '[Black "You"]',
      '',
      '1. e4 e5 *',
      '',
    ].join('\n')
    expect(loaded(theirs)).toEqual({ sans: ['e4', 'e5'], side: 'black', level: 6 })
  })

  it('refuses a level that is not one this app plays at', () => {
    const wild = [
      '[Event "Tabiya Player"]',
      '[White "You"]',
      '[Black "Stockfish level 12"]',
      '',
      '1. e4 e5 *',
      '',
    ].join('\n')
    expect(loaded(wild).level).toBeNull()
  })
})

describe('a file that is no good', () => {
  it('refuses moves that do not make a legal game', () => {
    expect(refused('[Event "x"]\n\n1. e4 e4 *\n')).toBe(
      "That file's moves do not make a legal game",
    )
  })

  it('refuses text that is not PGN at all, in the parser own words', () => {
    expect(refused('just some writing about chess')).toBe(
      '"just" is not a move, a comment, a variation or a header tag',
    )
  })

  it('refuses an empty file', () => {
    expect(refused('')).toBe('That file has no game in it')
    expect(refused('   \n\n  ')).toBe('That file has no game in it')
  })

  it('refuses a file with tags and no moves', () => {
    expect(refused('[Event "Tabiya Player"]\n[White "You"]\n')).toBe(
      'That file has no moves in it',
    )
  })
})
