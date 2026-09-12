import type { Engine, SearchResult, StrengthProfile } from '../engine'
import { isAnalysisProfile } from '../play'
import { fakeEngine } from './fake-engine'

/** What a search answers with, which is all these fakes ever vary. */
export type Search = (fen: string, movetime: number) => Promise<SearchResult>

/**
 * A fake engine that answers the engine's MOVES and the app's ANALYSIS
 * differently.
 *
 * One engine gets three kinds of question: the move it is playing, the bar's
 * evaluation after every move, and a hint. A fake that answers all three the
 * same way makes a whole class of test impossible to write. A scripted mate
 * would hand its next move to the bar; a held move would hold the evaluation
 * that has to land before the move is even asked for; a hint cannot be pinned
 * to a chosen move without pinning the engine to it as well.
 *
 * They are told apart by the profile the provider sets before each search,
 * which is the seam the real engine sees too: the analysis profile is level 8
 * at 150 ms, and no playing level is both (spec 6.3). Nothing here knows
 * anything the shipped code does not.
 */
export function engineByProfile(answers: { analysis: Search; playing: Search }): Engine {
  let profile: StrengthProfile | null = null
  return fakeEngine({
    setStrength: async (next: StrengthProfile) => {
      profile = next
    },
    search: (fen: string, movetime: number) =>
      profile && isAnalysisProfile(profile)
        ? answers.analysis(fen, movetime)
        : answers.playing(fen, movetime),
  })
}
