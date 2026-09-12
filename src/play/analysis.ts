import { strengthProfile, type Engine, type StrengthProfile } from '../engine'

/**
 * Origin: London src/ui/play-context.tsx SCAN_MOVETIME, HINT_MOVETIME and analysisProfile, adapted: their own module, and isAnalysisProfile is new.
 * The one profile every evaluation and every hint is made at (spec 6.3).
 *
 * Full strength, one line, a fixed 150 ms. Two numbers can only be compared
 * when they were made the same way, so the bar never shows a score the playing
 * level happened to produce.
 *
 * It lives here rather than in the provider that uses it because two other
 * things need to recognise it: the provider puts the playing profile back after
 * every analysis search, and a test engine has to tell an analysis search from a
 * move it is meant to play.
 */

/** How long one evaluation for the bar thinks. The trainer's `SCAN_MOVETIME`. */
export const ANALYSIS_MOVETIME = 150

/**
 * How long a hint thinks. Longer than an evaluation, because a hint is a single
 * answer somebody is waiting on rather than one of a game's worth of positions,
 * and short enough that the answer arrives before the question is forgotten.
 */
export const HINT_MOVETIME = 500

/** Level 8, one candidate, 150 ms. */
export function analysisProfile(): StrengthProfile {
  return { ...strengthProfile(8), multiPv: 1, movetime: ANALYSIS_MOVETIME }
}

/**
 * Whether a profile is the analysis one rather than a level being played at.
 *
 * Level and movetime together, because neither alone says it: level 8 is also a
 * level the engine plays at, and level 3 also thinks for 150 ms. No playing
 * level is both, which is what makes the pair an answer.
 */
export function isAnalysisProfile(profile: StrengthProfile): boolean {
  return profile.level === 8 && profile.movetime === ANALYSIS_MOVETIME
}

/**
 * Asks the engine something at the analysis profile, and puts the level the
 * game is being played at back afterwards (spec 6.3).
 *
 * The restore is in a `finally`, and that is the whole reason this exists as a
 * function rather than as four lines in each caller. The engine is one worker
 * with a promise queue, so a search that threw and skipped the restore would
 * leave the opponent playing the rest of the game at level 8 with one
 * candidate: a game quietly made harder by a failure nobody saw. Two callers
 * want it, the bar after every move and a hint, and one of them getting the
 * `finally` wrong would stay invisible until somebody wondered why the engine
 * had become so good.
 */
export async function atAnalysisProfile<T>(
  engine: Engine,
  playing: number,
  ask: () => Promise<T>,
): Promise<T> {
  await engine.setStrength(analysisProfile())
  try {
    return await ask()
  } finally {
    await engine.setStrength(strengthProfile(playing))
  }
}
