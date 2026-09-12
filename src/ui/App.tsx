import { useEffect, useRef, useState } from 'react'
import { useDevScene } from '../dev/use-dev-scene'
import type { Colour } from '../model/types'
import { canReplayMoves, gameToPgn, loadPgn, saveFileName } from '../play'
import { recallGame } from '../storage/current-game'
import { openPgn, savePgn } from '../storage/files'
import { useBoardSize, useLevel, useSide } from '../storage/prefs'
import { asMessage } from './message'
import { PlayProvider, usePlay } from './play-context'
import { Screen, type ScreenNotice } from './Screen'
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
/** How long a notice under the board stays up. */
const NOTICE_MS = 3000

export function Shell() {
  // First, and before anything that reads storage. In a development build this
  // writes the scene the address bar asked for; in a shipped one it is a
  // `return null` (spec 15.1).
  const scene = useDevScene()
  const game = usePlay()
  const { theme, toggle } = useTheme()
  const { level, setLevel } = useLevel()
  const { side, setSide } = useSide()
  const { boardSize, setBoardSize } = useBoardSize()
  const [notice, setNotice] = useState<ScreenNotice | null>(null)
  const switchTo = theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'

  // A notice says one thing about something that has just happened, so it goes
  // by itself rather than waiting to be dismissed. Cleared on the way out as
  // well, so a second message does not inherit the first one's timer.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  /**
   * Starts a game from a list of moves, with the side and level it carries.
   *
   * Two things arrive this way: the game the app was closed on (spec 10) and a
   * game loaded from a file (spec 9.2). They are the same act, so they are one
   * function: both make the file's or the record's settings the current ones,
   * because a game that came with its own is not a game to play at somebody
   * else's.
   */
  const startFrom = (sans: string[], from: Colour, atLevel: number) => {
    setLevel(atLevel)
    setSide(from)
    return game.start({ level: atLevel, side: from, startMoves: sans })
  }

  // StrictMode runs effects twice in development, and a second start would
  // throw the first game away. The ref survives the rerun; the flag in it is
  // what makes the start happen once.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true

    // The game the app was closed on comes back, and it wins over the
    // remembered settings, because it carries its own (spec 10). Nothing
    // remembered, or a record that no longer makes a legal game: a fresh one,
    // at the remembered settings, and no complaint about it.
    const remembered = recallGame()
    const opening =
      remembered && canReplayMoves(remembered.sans)
        ? startFrom([...remembered.sans], remembered.side, remembered.level)
        : game.start({ level, side })

    // A dev scene's hint, the one thing storage cannot carry (spec 15.1).
    void opening.then(() => {
      if (scene?.hint) void game.askHint()
    })
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

  /**
   * The game as a file (spec 9.1).
   *
   * The side and the level come from the RUNNING game rather than from the
   * settings beside it. They are usually the same, and they are not after a
   * game has been loaded from a file or the level has been changed mid-game,
   * and it is the game that is being written down.
   */
  const save = async () => {
    const running = game.session
    if (!running) return
    const at = new Date().toISOString()
    const text = gameToPgn({
      moves: running.moves,
      side: running.userColour,
      level: game.level ?? level,
      outcome: running.outcome,
      at,
    })
    try {
      const { message } = await savePgn(text, saveFileName(at))
      // Null is a cancelled dialog, which needs no comment at all.
      if (message) setNotice({ text: message, bad: false })
    } catch (error) {
      setNotice({ text: asMessage(error), bad: true })
    }
  }

  /**
   * A game from a file, in place of this one (spec 9.2).
   *
   * No confirmation, as New game has none: the game on the board is in
   * storage and the user asked for this. A file that cannot be read changes
   * nothing at all, which is why the reading happens before anything is
   * started.
   */
  const load = async () => {
    try {
      const file = await openPgn()
      if (!file) return
      const result = loadPgn(file.text)
      if ('error' in result) {
        setNotice({ text: result.error, bad: true })
        return
      }
      void startFrom(result.sans, result.side, result.level ?? level)
    } catch (error) {
      setNotice({ text: asMessage(error), bad: true })
    }
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
          files={{
            onSave: () => void save(),
            onLoad: () => void load(),
            thinking: game.thinking,
          }}
          notice={notice}
          onNewGame={newGame}
        />
      </main>
    </div>
  )
}
