import { useCallback, useEffect, useState } from 'react'
import { read, write } from '../storage/prefs'

/**
 * Origin: London src/ui/theme.ts, adapted: the storage key, the storage goes through prefs.ts, and the comment (the trainer's spoke of its progress file).
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

const KEY = 'simple-chess.theme'

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => (read(KEY) === 'light' ? 'light' : 'dark'))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    write(KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
