import { describe, expect, it } from 'vitest'
import { STRENGTH_LEVELS, strengthProfile, type Engine, type StrengthProfile } from '../engine'
import { fakeEngine } from '../test/fake-engine'
import { ANALYSIS_MOVETIME, analysisProfile, atAnalysisProfile, isAnalysisProfile } from './analysis'

describe('the analysis profile', () => {
  it('is level 8 at 150 ms with one candidate', () => {
    const profile = analysisProfile()
    expect(profile.level).toBe(8)
    expect(profile.movetime).toBe(ANALYSIS_MOVETIME)
    expect(profile.multiPv).toBe(1)
  })

  it('recognises itself', () => {
    expect(isAnalysisProfile(analysisProfile())).toBe(true)
  })

  /**
   * The half that matters. A search made at a playing level is the engine
   * making its move, and anything that answers an evaluation from a script
   * would play that script onto the board instead of into the bar. Level 8 is
   * a level people play at and level 3 also thinks for 150 ms, so this holds
   * every one of the eight rather than the two that are nearly it.
   */
  it('is none of the eight levels the engine plays at', () => {
    for (const level of STRENGTH_LEVELS) {
      expect(isAnalysisProfile(strengthProfile(level))).toBe(false)
    }
  })
})

describe('asking the engine something at the analysis profile', () => {
  /** An engine that writes down every strength it is set to. */
  function recording(): { engine: Engine; told: StrengthProfile[] } {
    const told: StrengthProfile[] = []
    const engine = fakeEngine({
      setStrength: async (profile: StrengthProfile) => {
        told.push(profile)
      },
    })
    return { engine, told }
  }

  it('sets the analysis profile and puts the playing level back', async () => {
    const { engine, told } = recording()
    const answer = await atAnalysisProfile(engine, 4, async () => 'asked')

    expect(answer).toBe('asked')
    expect(told).toHaveLength(2)
    expect(isAnalysisProfile(told[0])).toBe(true)
    expect(told[1]).toEqual(strengthProfile(4))
  })

  /**
   * The one that matters, and the reason this is a function rather than four
   * lines in each caller. The engine is one worker with a queue, so a search
   * that threw without the restore would leave the opponent playing the rest
   * of the game at level 8: a game quietly made harder by a failure nobody
   * saw.
   */
  it('puts the playing level back even when the search throws', async () => {
    const { engine, told } = recording()
    await expect(
      atAnalysisProfile(engine, 2, async () => {
        throw new Error('the engine stopped answering')
      }),
    ).rejects.toThrow('the engine stopped answering')

    expect(told.at(-1)).toEqual(strengthProfile(2))
  })
})
