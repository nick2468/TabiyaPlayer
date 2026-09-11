import { useCallback, useState } from 'react'
import { STRENGTH_LEVELS } from '../engine'
import type { Colour } from '../model/types'

/**
 * Origin: London src/ui/prefs.ts, adapted: this app's keys and three hooks; read, write, readOneOf and useRemembered keep the trainer's text, remove is new, and the show half is gone.
 * The settings, remembered between sessions (spec 10).
 *
 * Every setting is remembered, the way `theme.ts` remembers dark or light and
 * for the same reason the trainer gives: a setting the app forgets is one the
 * user has to make again every time they come back.
 *
 * In `localStorage`, and never in a file. On Windows that storage lives in the
 * WebView2 profile under `Simple Chess Data`, which survives an upgrade and
 * goes on a ticked uninstall, and that is the right life for a preference. A
 * file would have to be versioned, migrated and backed up; losing one of these
 * costs a click (spec S9).
 *
 * Storage can be refused outright, in a private window or a locked-down
 * profile. Every read and write here catches and carries on: the app works, it
 * just forgets.
 *
 * Each hook below is called ONCE, in `Shell`, and handed down, for the reason
 * the trainer gives on its drill scope: the sidebar shows a setting and the
 * game acts on it, and a hook called in two places would be two pieces of
 * state that drift apart the moment somebody presses a radio.
 */

const LEVEL_KEY = 'simple-chess.level'
const SIDE_KEY = 'simple-chess.side'
const BOARD_SIZE_KEY = 'simple-chess.board-size'

/** What a fresh install plays at: Club (spec 6.2). */
export const DEFAULT_LEVEL = 4

/** The two sides, in one place, so nothing writes the pair out twice. */
export const SIDES: readonly Colour[] = ['white', 'black']

/** How big the board is drawn (spec 3). */
export type BoardSizeName = 'small' | 'large'

export const BOARD_SIZES: readonly BoardSizeName[] = ['small', 'large']

export function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Not worth telling anyone about: the choice just will not be remembered.
  }
}

/** Takes a key away, for a game not worth reopening. */
export function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // As `write`: storage refused, and there is nothing useful to say about it.
  }
}

/** One of a fixed set of words, or the default when storage says anything else. */
export function readOneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  const saved = read(key)
  return allowed.includes(saved as T) ? (saved as T) : fallback
}

/**
 * A level, or null when what came back is not one.
 *
 * One home for the check, because two things read a level back: the setting
 * here, and the remembered game, which carries its own (spec 10). The scale is
 * the engine's `STRENGTH_LEVELS` rather than a written-out 1 to 8, so the two
 * cannot drift from the levels that actually exist.
 */
export function levelOrNull(value: unknown): number | null {
  const level = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isInteger(level) && STRENGTH_LEVELS.includes(level) ? level : null
}

/**
 * A remembered choice: read once when the hook mounts, written on change.
 *
 * Never read during a render. Storage is not React state, and a component
 * that read it while rendering would be one that renders differently for
 * reasons React cannot see.
 */
function useRemembered<T>(initial: () => T, save: (value: T) => void) {
  const [value, setStored] = useState<T>(initial)
  const set = useCallback(
    (next: T) => {
      setStored(next)
      save(next)
    },
    [save],
  )
  return [value, set] as const
}

/** The level the engine plays at (spec 6.2). */
export function useLevel(): { level: number; setLevel: (level: number) => void } {
  const [level, setLevel] = useRemembered<number>(
    () => levelOrNull(read(LEVEL_KEY)) ?? DEFAULT_LEVEL,
    useCallback((next: number) => write(LEVEL_KEY, String(next)), []),
  )
  return { level, setLevel }
}

/** The colour the user plays. Applied at the next new game (spec 5.1). */
export function useSide(): { side: Colour; setSide: (side: Colour) => void } {
  const [side, setSide] = useRemembered<Colour>(
    () => readOneOf(SIDE_KEY, SIDES, 'white'),
    useCallback((next: Colour) => write(SIDE_KEY, next), []),
  )
  return { side, setSide }
}

/** Small or large. The pixels it comes to are `useBoardPixels`' business. */
export function useBoardSize(): {
  boardSize: BoardSizeName
  setBoardSize: (size: BoardSizeName) => void
} {
  const [boardSize, setBoardSize] = useRemembered<BoardSizeName>(
    () => readOneOf(BOARD_SIZE_KEY, BOARD_SIZES, 'small'),
    useCallback((next: BoardSizeName) => write(BOARD_SIZE_KEY, next), []),
  )
  return { boardSize, setBoardSize }
}
