import { useCallback, useState } from 'react'
import type { Colour } from '../model/types'
import { levelOrNull } from '../play'

/**
 * Origin: London src/ui/prefs.ts, adapted: this app's keys and three hooks; read, write and useRemembered keep the trainer's text, readOneOf now asks oneOf, remove and the two remember functions are new, and the show half is gone.
 * The settings, remembered between sessions (spec 10).
 *
 * Every setting is remembered, the way `theme.ts` remembers dark or light and
 * for the same reason the trainer gives: a setting the app forgets is one the
 * user has to make again every time they come back.
 *
 * In `localStorage`, and never in a file. On Windows that storage lives in the
 * WebView2 profile under `Tabiya Player Data`, which survives an upgrade and
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

// These keys say `simply-chess` and stay that way on purpose. The app was
// renamed Tabiya Player when it went public (spec S27), and a storage key is
// invisible: nobody reads one, so renaming them would reset every setting for
// no gain. The same holds for `simply-chess.theme` in `ui/theme.ts`,
// `simply-chess.game` in `current-game.ts`, and the Tauri identifier.
const LEVEL_KEY = 'simply-chess.level'
const SIDE_KEY = 'simply-chess.side'
const BOARD_SIZE_KEY = 'simply-chess.board-size'

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

/**
 * One of a fixed set of words, or nothing when it is not one of them.
 *
 * Storage is one source of a word this app has to check; the address bar is
 * another, in a development build (spec 15.1). Both ask the same question, so
 * they ask it here.
 */
export function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined
}

/** One of a fixed set of words, or the default when storage says anything else. */
export function readOneOf<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  return oneOf(read(key), allowed) ?? fallback
}

/**
 * The one writer for each setting that is not a number.
 *
 * The hooks below write through these, and so do the dev scenes, which put a
 * scene's settings in storage and let the ordinary start path pick them up
 * (spec 15.1). That is why they exist: a key string belongs to the module that
 * owns it, and a harness that wrote its own copy of one would be a second
 * place for the two to drift apart.
 */
export function rememberSide(side: Colour): void {
  write(SIDE_KEY, side)
}

export function rememberBoardSize(size: BoardSizeName): void {
  write(BOARD_SIZE_KEY, size)
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
    rememberSide,
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
    rememberBoardSize,
  )
  return { boardSize, setBoardSize }
}
