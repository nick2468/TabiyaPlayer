import { useEffect, useRef } from 'react'
import { canReplayMoves } from '../play'
import { recallGame } from '../storage/current-game'
import { useBoardSize, useLevel, useSide } from '../storage/prefs'
import { PlayProvider, usePlay } from './play-context'
import { Screen } from './Screen'
import { useTheme } from './theme'
import './app.css'

/**
 * Origin: London src/ui/App.tsx, adapted: the header and the theme toggle, the App and Shell split, one screen, and the settings read here.
 * The app shell: the header, and the one screen under it (spec section 4).
 *
 * The header holds the name with the version beside it, and the theme toggle,
 * and nothing else. There is no nav to a second screen, because there is no
 * second screen (spec S1).
 *
 * The three settings are read here, once, and handed down (spec 10). This is
 * also the one place that knows what each one does to the running game, so the
 * sidebar can stay a sidebar: the level reaches the engine at once, the side
 * waits for the next new game, and the board size touches nothing but pixels.
 */

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
  const { level, setLevel } = useLevel()
  const { side, setSide } = useSide()
  const { boardSize, setBoardSize } = useBoardSize()
  const switchTo = theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'

  // StrictMode runs effects twice in development, and a second start would
  // throw the first game away. The ref survives the rerun; the flag in it is
  // what makes the start happen once.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true

    // The game the app was closed on comes back, and it wins over the
    // remembered settings, because it carries its own (spec 10). A game loaded
    // from a file in phase 5 arrives the same way, with the file's side and
    // level, and neither should be overwritten by what was set before it.
    const remembered = recallGame()
    if (remembered && canReplayMoves(remembered.sans)) {
      setLevel(remembered.level)
      setSide(remembered.side)
      void game.start({
        level: remembered.level,
        side: remembered.side,
        startMoves: [...remembered.sans],
      })
      return
    }

    // Nothing remembered, or a record that no longer makes a legal game: a
    // fresh one, at the remembered settings, and no complaint about it.
    void game.start({ level, side })
    // Once, on mount. `game` is a fresh object every render by design, and the
    // settings here are the ones storage gave when this component mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /** A fresh game at whatever the sidebar now says (spec 5.1). */
  const newGame = () => void game.start({ level, side })

  /**
   * A new level: remembered, and heard by the engine's next move (spec S6).
   *
   * The two halves belong together and neither belongs in `Sidebar`, which
   * knows nothing about the running game, so this is where they are joined.
   */
  const chooseLevel = (next: number) => {
    setLevel(next)
    void game.setLevel(next)
  }

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
        <Screen
          settings={{
            level,
            onLevel: chooseLevel,
            side,
            onSide: setSide,
            boardSize,
            onBoardSize: setBoardSize,
          }}
          onNewGame={newGame}
        />
      </main>
    </div>
  )
}
