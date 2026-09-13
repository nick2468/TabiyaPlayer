import { describe, expect, it } from 'vitest'
import { strengthProfile, type Engine } from '../engine'
import { PlaySession, fullMove, type SessionOptions } from './session'
import { fakeEngine } from '../test/fake-engine'
import { scriptedEngine } from '../test/scripted-engine'

/**
 * The session: moves, undo and redo in pairs, outcomes, and the level
 * reaching the engine. The engine is always a fake, so no worker starts.
 */

const CLUB = strengthProfile(4)

function session(options: Partial<SessionOptions> = {}): PlaySession {
  return new PlaySession({ engine: fakeEngine(), profile: CLUB, ...options })
}

/** A fake engine that notes the movetime of every search it is given. */
function recordingEngine(): { engine: Engine; movetimes: number[] } {
  const movetimes: number[] = []
  const plain = fakeEngine()
  const engine = fakeEngine({
    search: async (fen: string, movetime: number) => {
      movetimes.push(movetime)
      return plain.search(fen, movetime)
    },
  })
  return { engine, movetimes }
}

/** Fool's mate: 1.f3 e5 2.g4 Qh4#, White is mated. */
const FOOLS_MATE = ['f3', 'e5', 'g4', 'Qh4#']

describe('a game against the engine', () => {
  it("plays the user's move and refuses an illegal one", () => {
    const game = session()
    expect(game.playUser('d4')).toBe(true)
    expect(game.moves.map((move) => move.san)).toEqual(['d4'])
    // The engine's turn now, so even a legal Black move is not the user's.
    expect(game.playUser('d5')).toBe(false)

    const fresh = session()
    expect(fresh.playUser('Bf4')).toBe(false)
    expect(fresh.moves).toHaveLength(0)
  })

  it('the engine replies with what the fake engine chose', async () => {
    const game = session({ engine: fakeEngine({ move: 'e7e5' }) })
    game.playUser('e4')
    expect(await game.playEngine()).toBe('e5')
    expect(game.moves.map((move) => move.colour)).toEqual(['white', 'black'])
    expect(game.userToMove).toBe(true)
  })

  it("undo goes back a pair, to the user's move", async () => {
    const game = session()
    game.playUser('d4')
    await game.playEngine()
    expect(game.moves).toHaveLength(2)

    expect(game.undo()).toBe(true)
    expect(game.moves).toHaveLength(0)
    expect(game.canUndo()).toBe(false)
    expect(game.userToMove).toBe(true)
  })

  it('redo puts the pair back, and a new move clears the redo stack', async () => {
    const game = session()
    game.playUser('d4')
    await game.playEngine()
    const played = game.moves.map((move) => move.san)

    game.undo()
    expect(game.canRedo()).toBe(true)
    expect(game.redo()).toBe(true)
    expect(game.moves.map((move) => move.san)).toEqual(played)

    game.undo()
    game.playUser('e4')
    expect(game.canRedo()).toBe(false)
  })

  it('undo out of a checkmate clears the outcome', async () => {
    // Played rather than replayed: moves replayed through `startMoves` are the
    // floor, and undo may not go below them.
    const game = session({ engine: scriptedEngine(['e7e5', 'd8h4']) })
    game.playUser('f3')
    await game.playEngine()
    game.playUser('g4')
    await game.playEngine()
    expect(game.outcome).toBe('You were checkmated')
    expect(game.isFinished()).toBe(true)

    expect(game.undo()).toBe(true)
    expect(game.outcome).toBeUndefined()
    expect(game.isFinished()).toBe(false)
    expect(game.moves.map((move) => move.san)).toEqual(['f3', 'e5'])
  })

  /**
   * The moves a game is given when it starts are the game, not a floor under
   * it: they come from storage or from a PGN file (spec 9.2, spec 10), and a
   * game that has been reopened is the same game it was before it was closed.
   * The trainer treats them as a floor, because there they are an authored
   * line the exercise is set up on.
   */
  it('undo goes back through the moves the game started from', () => {
    const game = session({ startMoves: ['e4', 'e5'] })
    expect(game.canUndo()).toBe(true)
    expect(game.undo()).toBe(true)
    expect(game.moves).toEqual([])
    expect(game.canUndo()).toBe(false)
    // And redo puts them back, so the undo is not a way of losing the game.
    expect(game.redo()).toBe(true)
    expect(game.moves.map((move) => move.san)).toEqual(['e4', 'e5'])
  })

  it('has nothing to undo in a game the user has not moved in yet', () => {
    // The user is Black and White has opened: no move of the user's own.
    const game = session({ side: 'black', startMoves: ['e4'] })
    expect(game.canUndo()).toBe(false)
    expect(game.undo()).toBe(false)
    expect(game.moves).toHaveLength(1)
  })

  it('a game started with Black has the engine to move first', async () => {
    const game = session({ side: 'black' })
    expect(game.userColour).toBe('black')
    expect(game.engineColour).toBe('white')
    expect(game.userToMove).toBe(false)

    const san = await game.playEngine()
    expect(typeof san).toBe('string')
    expect(game.moves.map((move) => move.san)).toEqual([san])
    expect(game.userToMove).toBe(true)
  })

  it('setProfile changes the movetime the next search is given', async () => {
    const { engine, movetimes } = recordingEngine()
    const game = session({ engine })
    game.playUser('d4')
    await game.playEngine()

    game.setProfile(strengthProfile(8))
    game.playUser('c4')
    await game.playEngine()

    expect(movetimes).toEqual([CLUB.movetime, strengthProfile(8).movetime])
    expect(movetimes[0]).not.toBe(movetimes[1])
  })

  it('a replayed checkmate is finished on arrival', async () => {
    const game = session({ startMoves: FOOLS_MATE })
    expect(game.isFinished()).toBe(true)
    expect(game.outcome).toBe('You were checkmated')
    expect(await game.playEngine()).toBeNull()
  })

  it('a level 1 profile picks among candidates by the injected random', async () => {
    const candidates = ['a2a3', 'b2b3', 'h2h3']
    const engine = fakeEngine({
      search: async () => ({
        bestMove: candidates[0],
        candidates: candidates.map((move) => ({
          move,
          score: { kind: 'cp' as const, centipawns: 0 },
          depth: 1,
        })),
      }),
    })
    const game = session({
      engine,
      profile: strengthProfile(1),
      side: 'black',
      random: () => 0.99,
    })
    expect(await game.playEngine()).toBe('h3')
  })
})

describe('the hint count', () => {
  it('starts at nothing on a fresh game', () => {
    expect(session().hints).toBe(0)
  })

  it('rises with each hint, because the report says how a game was played', () => {
    const game = session()
    game.hints += 1
    game.hints += 1
    expect(game.hints).toBe(2)
  })
})

describe('fullMove', () => {
  it('numbers plies 0 and 1 as move 1, and 2 as move 2', () => {
    expect(fullMove(0)).toBe(1)
    expect(fullMove(1)).toBe(1)
    expect(fullMove(2)).toBe(2)
  })
})
