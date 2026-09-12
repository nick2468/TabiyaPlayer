import { colourName, type Colour } from '../model/types'
import { SIDES, type BoardSizeName } from '../storage/prefs'

/**
 * The side panel beside the board (spec 18.1): the Play as setting and the two
 * file buttons.
 *
 * It knows nothing about the running game, and deliberately. `Shell` owns the
 * settings and decides what each one does: the level reaches the engine's next
 * move (spec S6), the side waits for the next new game (spec 5.1), and the
 * board size is only ever about pixels. A panel that reached into the game
 * would be a second place deciding that. The hint sentence is the game's, so
 * `Screen` puts it in the panel rather than this file holding it.
 *
 * It was the sidebar, with all three settings and the move list in it, until
 * phase 9 gave the difficulty its own row, the board size a toggle in the
 * header and the move list a column of its own.
 */

/** The three settings and their setters, passed together wherever they go. */
export interface SettingsProps {
  level: number
  onLevel: (level: number) => void
  side: Colour
  onSide: (side: Colour) => void
  boardSize: BoardSizeName
  onBoardSize: (size: BoardSizeName) => void
}

/** The two file buttons, and whether the engine is busy (spec 9.3). */
export interface FileProps {
  onSave: () => void
  onLoad: () => void
  /** Both are disabled while the engine thinks. */
  thinking: boolean
}

export function SidePanel({
  side,
  onSide,
  onSave,
  onLoad,
  thinking,
}: Pick<SettingsProps, 'side' | 'onSide'> & FileProps) {
  return (
    <>
      <fieldset>
        <legend>Play as</legend>
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
        <p className="hint">Applies to the next new game.</p>
      </fieldset>

      {/* A game leaves the app as a PGN file and comes back the same way (spec
          9). Both are greyed while the engine thinks: a game written out
          mid-move would be missing the reply, and a game loaded over one would
          have the old reply landing on it. */}
      <div className="sidebar-files">
        <button type="button" onClick={onSave} disabled={thinking}>
          Save game
        </button>
        <button type="button" onClick={onLoad} disabled={thinking}>
          Load game
        </button>
      </div>
    </>
  )
}
