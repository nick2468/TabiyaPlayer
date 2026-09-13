import { colourName, type Colour } from '../model/types'
import { SIDES, type BoardSizeName } from '../storage/prefs'
import type { Theme } from './theme'

/**
 * Row four under the board: the settings (spec S19).
 *
 * Furthest from the board because it is what you set once and leave, where the
 * three rows above it act on the game in front of you. Play as and its two
 * radios on the left, then the two view toggles at the right-hand end of the
 * row, the way the stepping arrows end row two.
 *
 * The toggles are here rather than in the header from phase 13: Nick ruled that
 * every button and every toggle belongs under the board (spec Q23), which
 * leaves the header the name and the version.
 *
 * This row knows nothing about the running game, and deliberately. `Shell` owns
 * the settings and decides what each one does: the level reaches the engine's
 * next move (spec S6), the side waits for the next new game (spec 5.1), and the
 * board size and the theme are only ever about pixels and colours. A control
 * that reached into the game would be a second place deciding that.
 */

/**
 * The settings the screen is handed, passed together wherever they go.
 *
 * The level is here to be READ: the head row falls back to it for a game that
 * has not said what it is being played at. Changing one is the selector row's
 * job, which `Shell` wires up directly, so no setter for it travels this far.
 */
export interface SettingsProps {
  level: number
  side: Colour
  onSide: (side: Colour) => void
  boardSize: BoardSizeName
  onBoardSize: (size: BoardSizeName) => void
  theme: Theme
  onTheme: () => void
}

export function SettingsRow({
  side,
  onSide,
  boardSize,
  onBoardSize,
  theme,
  onTheme,
}: Omit<SettingsProps, 'level'>) {
  const switchSize =
    boardSize === 'small' ? 'Switch to the large board' : 'Switch to the small board'
  const switchTheme = theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'

  return (
    <div className="play-controls">
      {/* A radiogroup rather than the fieldset it was in the side panel: a
          legend is drawn in its box's top border, so in a row it puts the label
          on a line of its own and makes the row half as tall again as the
          buttons beside it. The role and the label say the same thing to
          anything reading the page aloud (spec 19.1).

          The sentence is the control's title, as the level's two sentences are
          the select's (spec 18.1): a row of buttons has no room for a line of
          explanation under it and the rule is the same one. */}
      <div
        className="play-as"
        role="radiogroup"
        aria-label="Play as"
        title="Applies to the next new game."
      >
        <span className="play-as-label">Play as</span>
        {SIDES.map((each) => (
          <label key={each}>
            <input
              type="radio"
              name="side"
              value={each}
              checked={side === each}
              onChange={() => onSide(each)}
            />
            {colourName(each)}
          </label>
        ))}
      </div>

      {/* Each toggle reads the size or the theme it would switch TO, which is
          the trainer's rule for its own. The size one goes first so the theme
          toggle keeps the end of the row it has always had. `auto` on the group
          is what puts it at the board's right edge, so the row spans the board
          exactly. */}
      <div className="play-views">
        <button
          type="button"
          onClick={() => onBoardSize(boardSize === 'small' ? 'large' : 'small')}
          title={switchSize}
          aria-label={switchSize}
        >
          {boardSize === 'small' ? 'Large' : 'Small'}
        </button>
        <button type="button" onClick={onTheme} title={switchTheme} aria-label={switchTheme}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </div>
  )
}
