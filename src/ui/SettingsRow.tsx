import { colourName, type Colour } from '../model/types'
import { SIDES, type BoardSizeName } from '../storage/prefs'

/**
 * Row four under the board: the next game (spec S19).
 *
 * Furthest from the board because it is the one row that is not about the game
 * in front of you. New game at the left edge, then Play as and its two radios,
 * and they are one pairing rather than two things that happen to share a row:
 * the side chosen is the side the next new game is played at, so the button and
 * the choice it reads belong together (spec Q27).
 *
 * The name stays `SettingsRow` because that is still what it is: the row that
 * says what the NEXT game will be. It carried the two view toggles for version
 * 1.2.0 and they went back to the header in 1.2.1, where Nick liked them (Q27):
 * they change how the page is drawn and nothing about a game.
 *
 * This row knows nothing about the running game beyond whether the engine is
 * busy, and deliberately. `Shell` owns the settings and decides what each one
 * does: the side waits for the next new game (spec 5.1) and the level reaches
 * the engine's next move (spec S6). A control that reached into the game would
 * be a second place deciding that.
 */

/**
 * The settings the screen is handed, passed together wherever they go.
 *
 * The level and the board size are here to be READ: the head row falls back to
 * the level for a game that has not said what it is being played at, and the
 * board's pixels are worked out from the size. Changing either is somebody
 * else's job, the selector row's and the header's, and `Shell` wires both up
 * directly, so no setter for them travels this far.
 */
export interface SettingsProps {
  level: number
  side: Colour
  onSide: (side: Colour) => void
  boardSize: BoardSizeName
}

export function SettingsRow({
  side,
  onSide,
  thinking,
  onNew,
}: Pick<SettingsProps, 'side' | 'onSide'> & {
  /** New game is disabled while the engine thinks, as it always was. */
  thinking: boolean
  onNew: () => void
}) {
  return (
    <div className="play-controls">
      {/* Disabled while the engine thinks. A New game started mid-search let
          the old game's reply land on a session that had already been thrown
          away, and a row where a button greys and its neighbours do not is the
          odder screen anyway (ruled at gate 2). */}
      <button type="button" onClick={onNew} disabled={thinking}>
        New game
      </button>

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
    </div>
  )
}
