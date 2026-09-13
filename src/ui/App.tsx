import { useEffect, useRef, useState } from 'react'
import { useDevScene } from '../dev/use-dev-scene'
import type { Colour } from '../model/types'
import { canReplayMoves, gameToPgn, loadPgn, saveFileName } from '../play'
import { recallGame } from '../storage/current-game'
import { openPgn, savePgn } from '../storage/files'
import { isDesktop } from '../storage/paths'
import { useBoardSize, useLevel, useSide } from '../storage/prefs'
import { DifficultyRow } from './DifficultyRow'
import { asMessage } from './message'
import { PlayProvider, usePlay } from './play-context'
import { Screen, type ScreenNotice } from './Screen'
import { useTheme } from './theme'
import { UpdateWatch } from './UpdateWatch'
import './app.css'

/**
 * Origin: London src/ui/App.tsx, adapted: the header and its two toggles, the selector row chooses a difficulty, the App and Shell split, one screen, and the settings read here.
 * The app shell: the header, the selector row, and the one screen under them
 * (spec 19.1).
 *
 * The header holds the name with the version beside it and the two toggles,
 * the board size and the theme. The selector row under it holds the
 * difficulty, where the trainer holds its course. There is no nav to a second
 * screen, because there is no second screen (spec S1).
 *
 * The toggles spent version 1.2.0 under the board and came back here in 1.2.1
 * (spec Q27): they change how the page is drawn and nothing about the position,
 * the game or the file, so they sit with the name rather than with the
 * controls.
 *
 * The four settings are read here, once, and handed down (spec 10). This is
 * also the one place that knows what each one does to the running game, so no
 * control has to know: the level reaches the engine at once, the side waits for
 * the next new game, and the board size and the theme touch nothing but pixels
 * and colours.
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
  const switchSize =
    boardSize === 'small' ? 'Switch to the large board' : 'Switch to the small board'

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

  /** A fresh game at whatever the settings row now says (spec 5.1). */
  const newGame = () => void game.start({ level, side })

  /**
   * A new level: remembered, and heard by the engine's next move (spec S6).
   *
   * The two halves belong together and neither belongs in `DifficultyRow`,
   * which knows nothing about the running game, so this is where they are
   * joined.
   */
  const chooseLevel = (next: number) => {
    setLevel(next)
    void game.setLevel(next)
  }

  /** A fresh game with this one thrown away (spec 18.3). */
  const discardGame = () => game.discard({ level, side })

  /**
   * Play from here: a new game from the position being looked at (spec 18.4).
   *
   * It is `start` with a prefix of the old game's moves, which is the path a
   * loaded game already takes. A position handed over as a FEN would need a
   * `SetUp` tag in the file and would leave Undo with nothing behind it; handed
   * over as the moves that reach it, Save, Load and Undo all work on the new
   * game for nothing.
   *
   * The side and the level are the RUNNING game's, so a game reviewed after a
   * mid-game level change is carried on at the level it was being played at,
   * not the one the select happens to show.
   */
  const playFrom = (sans: string[]) =>
    void game.start({ level: game.level ?? level, side: game.side ?? side, startMoves: sans })

  /**
   * The running game as text, with the report's comments once it has been
   * reviewed (spec 9.1, spec 18.6).
   *
   * One function, because two things write this game out and they must write
   * the same one: Save game puts it in a file and Copy game puts it on the
   * clipboard. Two builders would be two files claiming to be the same game.
   *
   * The side and the level come from the RUNNING game rather than from the
   * settings beside it. They are usually the same, and they are not after a
   * game has been loaded from a file or the level has been changed mid-game,
   * and it is the game that is being written down.
   */
  const pgnNow = (at: string): string | null => {
    const running = game.session
    if (!running) return null
    return gameToPgn({
      moves: running.moves,
      side: running.userColour,
      level: game.level ?? level,
      outcome: running.outcome,
      report: game.report ?? undefined,
      at,
    })
  }

  /** The game as a file (spec 9.1). */
  const save = async () => {
    const at = new Date().toISOString()
    const text = pgnNow(at)
    if (text === null) return
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
          Simply Chess <span className="app-version">v{__APP_VERSION__}</span>
        </h1>
        <nav className="app-nav">
          {/* Each toggle reads the size or the theme it would switch TO, which
              is the trainer's rule for its own. The size one goes first so the
              theme toggle keeps the end of the row it has always had (spec
              18.1, restored by Q27). */}
          <button
            type="button"
            className="nav-link theme-toggle"
            onClick={() => setBoardSize(boardSize === 'small' ? 'large' : 'small')}
            title={switchSize}
            aria-label={switchSize}
          >
            {boardSize === 'small' ? 'Large' : 'Small'}
          </button>
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

      <DifficultyRow level={level} onLevel={chooseLevel} />

      <main>
        <Screen
          settings={{
            level,
            side,
            onSide: setSide,
            boardSize,
          }}
          files={{
            onSave: () => void save(),
            onLoad: () => void load(),
            thinking: game.thinking,
          }}
          notice={notice}
          pgn={pgnNow(new Date().toISOString()) ?? ''}
          onNewGame={newGame}
          onDiscard={discardGame}
          onPlayFrom={playFrom}
        />
      </main>

      {/* Off the desktop only (spec S12). The condition is on the component
          rather than on the hook inside it, for the reason `UpdateWatch`
          gives. */}
      {!isDesktop() && <UpdateWatch />}
    </div>
  )
}
