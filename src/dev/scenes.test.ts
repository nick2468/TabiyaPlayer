import { Chess } from 'chess.js'
import { describe, expect, it } from 'vitest'
import { canReplayMoves } from '../play'
import { SCENES, sceneFromLocation, type SceneName } from './scenes'

/**
 * The scenes (spec 15.1).
 *
 * The move lists are the point of this file. A scene is used to look at the
 * app, so a scene that does not replay is not a failed test, it is a blank
 * screen an hour into a layout pass. Each one is checked against chess.js here,
 * where it costs a millisecond.
 */

describe('every scene', () => {
  it('replays as legal chess', () => {
    for (const [name, scene] of Object.entries(SCENES)) {
      // `fresh` is the start position, and `canReplayMoves` says an empty list
      // is not a game, which is right everywhere else it is asked.
      if (scene.sans.length === 0) continue
      expect(canReplayMoves(scene.sans), name).toBe(true)
    }
  })

  it('has one scene with no moves, and it is fresh', () => {
    const empty = Object.entries(SCENES)
      .filter(([, scene]) => scene.sans.length === 0)
      .map(([name]) => name)
    expect(empty).toEqual(['fresh'])
  })
})

describe('midgame', () => {
  it('is twenty moves and leaves White to play', () => {
    expect(SCENES.midgame.sans).toHaveLength(40)
    expect(positionAfter(SCENES.midgame.sans).turn()).toBe('w')
  })

  it('is what the hint scene shows, with a hint on top', () => {
    expect(SCENES.hint.sans).toEqual(SCENES.midgame.sans)
    expect(SCENES.hint.hint).toBe(true)
    expect(SCENES.midgame.hint).toBe(false)
  })
})

describe('mate', () => {
  it('ends in checkmate, delivered by White', () => {
    const position = positionAfter(SCENES.mate.sans)
    expect(position.isCheckmate()).toBe(true)
    expect(position.turn()).toBe('b')
  })
})

describe('promotion', () => {
  it('leaves White a pawn one step from the last rank', () => {
    const position = positionAfter(SCENES.promotion.sans)
    expect(position.turn()).toBe('w')
    expect(position.moves()).toContain('axb8=Q')
  })
})

describe('sceneFromLocation', () => {
  it('reads the example in the specification', () => {
    expect(sceneFromLocation('?scene=midgame&size=large&theme=light&side=black')).toEqual({
      scene: 'midgame',
      size: 'large',
      theme: 'light',
      side: 'black',
    })
  })

  it('asks for a scene and nothing else when nothing else is given', () => {
    expect(sceneFromLocation('?scene=fresh')).toEqual({
      scene: 'fresh',
      size: undefined,
      theme: undefined,
      side: undefined,
    })
  })

  it('ignores a scene that is not one of the five', () => {
    expect(sceneFromLocation('?scene=endgame')).toBeNull()
    expect(sceneFromLocation('?scene=')).toBeNull()
  })

  it('ignores a setting it does not recognise', () => {
    expect(sceneFromLocation('?scene=mate&size=enormous&theme=beige&side=green')).toEqual({
      scene: 'mate',
      size: undefined,
      theme: undefined,
      side: undefined,
    })
  })

  it('is null when the address asks for nothing', () => {
    expect(sceneFromLocation('')).toBeNull()
    expect(sceneFromLocation('?pretendUpdate')).toBeNull()
  })
})

/** The position a scene's moves reach. */
function positionAfter(sans: readonly string[]): Chess {
  const position = new Chess()
  for (const san of sans) position.move(san)
  return position
}

/** Every scene name, so a sixth one cannot be added without a move list. */
const NAMES: SceneName[] = ['fresh', 'midgame', 'mate', 'promotion', 'hint']

describe('the five scenes', () => {
  it('are the five the specification names', () => {
    expect(Object.keys(SCENES).sort()).toEqual([...NAMES].sort())
  })
})
