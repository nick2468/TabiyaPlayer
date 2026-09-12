import { useCallback, useEffect, useState } from 'react'
import { read, write } from '../storage/prefs'

/**
 * Origin: London src/ui/theme.ts, adapted: the storage key, the storage goes through prefs.ts, THEMES and rememberTheme are new, and the comment (the trainer's spoke of its progress file).
 * Dark or light, remembered between sessions.
 *
 * The choice is a display preference, kept in `localStorage` like every other
 * setting (spec section 10). Losing it costs one click.
 *
 * The reading and writing go through `prefs.ts` rather than through a
 * `localStorage` of their own. Storage can be refused outright, in a private
 * window or a locked-down profile, and the catch that carries on anyway is
 * worth having in exactly one place: `src/storage` is the only part of this app
 * that touches storage at all (spec S13).
 */

export type Theme = 'dark' | 'light'

/** The two words, in one place, so nothing writes the pair out twice. */
export const THEMES: readonly Theme[] = ['dark', 'light']

const KEY = 'simple-chess.theme'

/**
 * The one writer, shared by the toggle below and by the dev scenes, which put
 * a theme in storage and let the ordinary start path pick it up (spec 15.1).
 */
export function rememberTheme(theme: Theme): void {
  write(KEY, theme)
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => (read(KEY) === 'light' ? 'light' : 'dark'))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    rememberTheme(theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
