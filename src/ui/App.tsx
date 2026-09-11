import { useEffect, useRef } from 'react'
import type { Colour } from '../model/types'
import { PlayProvider, usePlay } from './play-context'
import { Screen } from './Screen'
import { useTheme } from './theme'
import './app.css'

/**
 * Origin: London src/ui/App.tsx, adapted: the header and the theme toggle, the App and Shell split, and one screen.
 * The app shell: the header, and the one screen under it (spec section 4).
 *
 * The header holds the name with the version beside it, and the theme toggle,
 * and nothing else. There is no nav to a second screen, because there is no
 * second screen (spec S1).
 */

/**
 * The level and side of the game started on open and by New game. Phase 3
 * replaces both with the remembered settings.
 */
const FIRST_LEVEL = 4
const FIRST_SIDE: Colour = 'white'

export function App() {
  return (
    <PlayProvider>
      <Shell />
    </PlayProvider>
  )
}

/**
 * The header and the screen.
 *
 * Exported for the DOM tests: `App` builds the provider itself, and a test
 * that wants the app with a fake engine has to supply it. Nothing else uses
 * this directly.
 */
export function Shell() {
  const game = usePlay()
  const { theme, toggle } = useTheme()
  const switchTo = theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'

  // StrictMode runs effects twice in development, and a second start would
  // throw the first game away. The ref survives the rerun; the flag in it is
  // what makes the start happen once.
  const started = useRef(false)
  useEffect(() => {
    if (!started.current) {
      started.current = true
      void game.start({ level: FIRST_LEVEL, side: FIRST_SIDE })
    }
    // Once, on mount. `game` is a fresh object every render by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newGame = () => void game.start({ level: game.level ?? FIRST_LEVEL, side: FIRST_SIDE })

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Simple Chess <span className="app-version">v{__APP_VERSION__}</span>
        </h1>
        <nav className="app-nav">
          <button
            type="button"
            className="nav-link theme-toggle"
            onClick={toggle}
            title={switchTo}
            aria-label={switchTo}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </nav>
      </header>

      <main>
        <Screen onNewGame={newGame} />
      </main>
    </div>
  )
}
