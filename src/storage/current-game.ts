import type { Colour } from '../model/types'
import { levelOrNull } from '../play'
import { SIDES, read, remove, write } from './prefs'

/**
 * Origin: Conquest src/ui/remembered-setup.ts recallSetup, adapted: one game rather than a game setup, and the storage helpers are prefs.ts's.
 * The game in progress, remembered between sessions (spec 10, Nick's Q9).
 *
 * The app reopens on the game it was closed on, so every field is checked on
 * the way back. Conquest's rule applies unchanged: a record that does not make
 * sense is quietly replaced, never argued with. It can be an older version, a
 * hand-edited value, or storage from a different app on the same origin, and
 * none of those may stop the app from opening.
 *
 * The moves are SAN and nothing else. Whether they still make a legal game is
 * `canReplayMoves`' question, not this file's: this one says the record is the
 * right shape, and chess says whether it is a game.
 */

const KEY = 'simple-chess.game'

/** The one version there has been. A record saying anything else is discarded. */
const VERSION = 1

export interface RememberedGame {
  readonly version: 1
  readonly sans: readonly string[]
  readonly side: Colour
  readonly level: number
}

export function rememberGame(game: RememberedGame): void {
  write(KEY, JSON.stringify(game))
}

export function recallGame(): RememberedGame | null {
  const text = read(KEY)
  if (text === null || text === '') return null

  let stored: unknown
  try {
    stored = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof stored !== 'object' || stored === null) return null

  const { version, sans, side, level } = stored as Record<string, unknown>
  if (version !== VERSION) return null
  if (!Array.isArray(sans) || sans.some((san) => typeof san !== 'string')) return null
  if (!SIDES.includes(side as Colour)) return null
  const checked = levelOrNull(level)
  if (checked === null) return null

  return {
    version: VERSION,
    sans: sans as string[],
    side: side as Colour,
    level: checked,
  }
}

export function forgetGame(): void {
  remove(KEY)
}
