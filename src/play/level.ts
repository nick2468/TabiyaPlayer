import { STRENGTH_LEVELS } from '../engine'

/**
 * A level arriving from outside the app.
 *
 * Three things read a level back from somewhere the app does not control: the
 * remembered setting, the remembered game, and now the `Stockfish level N` tag
 * in a PGN file (spec 9.2). All three want the same answer to the same
 * question, so the question is asked once.
 *
 * It lived in `storage/prefs.ts` until phase 5, which is where the first two
 * callers are. The third is `load-pgn.ts`, and `src/play` imports no React
 * (spec S13), so a pure check had to come out of a module full of hooks.
 */

/**
 * A level, or null when what came back is not one.
 *
 * The scale is the engine's `STRENGTH_LEVELS` rather than a written-out 1 to 8,
 * so this cannot drift from the levels that actually exist.
 */
export function levelOrNull(value: unknown): number | null {
  const level = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isInteger(level) && STRENGTH_LEVELS.includes(level) ? level : null
}
