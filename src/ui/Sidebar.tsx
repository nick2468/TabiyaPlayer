import { allProfiles, levelName, strengthProfile } from '../engine'
import { colourName, type Colour } from '../model/types'
import type { PlayedMove } from '../play'
import { BOARD_SIZES, SIDES, type BoardSizeName } from '../storage/prefs'
import { MoveList } from './MoveList'

/**
 * The sidebar: the three settings, the two file buttons, and the move list
 * under them (spec 4.1).
 *
 * It knows nothing about the running game, and deliberately. `Shell` owns the
 * settings and decides what each one does: the level reaches the engine's next
 * move (spec S6), the side waits for the next new game (spec 5.1), and the
 * board size is only ever about pixels. A sidebar that reached into the game
 * would be a second place deciding that.
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

/** The two board sizes, said the way they are said on screen. */
const SIZE_NAMES: Record<BoardSizeName, string> = { small: 'Small', large: 'Large' }

/** The two file buttons, and whether the engine is busy (spec 9.3). */
export interface FileProps {
  onSave: () => void
  onLoad: () => void
  /** Both are disabled while the engine thinks. */
  thinking: boolean
}

export function Sidebar({
  level,
  onLevel,
  side,
  onSide,
  boardSize,
  onBoardSize,
  onSave,
  onLoad,
  thinking,
  moves,
}: SettingsProps & FileProps & { moves: PlayedMove[] }) {
  return (
    <>
      <fieldset>
        <legend>Difficulty</legend>
        <select
          aria-label="Difficulty"
          value={level}
          onChange={(event) => onLevel(Number(event.target.value))}
        >
          {allProfiles().map((profile) => (
            <option key={profile.level} value={profile.level}>
              {levelName(profile.level)}
            </option>
          ))}
        </select>
        <p className="hint">{strengthProfile(level).detail}</p>
        <p className="hint">
          The numbers on levels 4 and up are the engine&apos;s own scale, not an online rating.
        </p>
      </fieldset>

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

      <fieldset>
        <legend>Board</legend>
        {BOARD_SIZES.map((each) => (
          <label key={each}>
            <input
              type="radio"
              name="board-size"
              value={each}
              checked={boardSize === each}
              onChange={() => onBoardSize(each)}
            />
            {SIZE_NAMES[each]}
          </label>
        ))}
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

      <MoveList moves={moves} />
    </>
  )
}
