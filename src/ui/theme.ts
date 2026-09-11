import { useCallback, useEffect, useState } from 'react'

/**
 * Origin: London src/ui/theme.ts, adapted: the storage key, and the comment (the trainer's spoke of its progress file).
 * Dark or light, remembered between sessions.
 *
 * The choice is a display preference, kept in `localStorage` like every other
 * setting (spec section 10). Losing it costs one click.
 */

export type Theme = 'dark' | 'light'

const KEY = 'simple-chess.theme'

function saved(): Theme {
  try {
    return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'
  } catch {
    // Private windows and locked-down profiles can refuse storage entirely.
    return 'dark'
  }
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(saved)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      // Not worth telling anyone about: the theme just will not be remembered.
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle }
}
