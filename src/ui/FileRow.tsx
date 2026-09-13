/**
 * Row three under the board: the file (spec S19).
 *
 * A game leaves the app as a PGN file and comes back the same way (spec 9).
 * Both buttons are greyed while the engine thinks: a game written out mid-move
 * would be missing the reply, and a game loaded over one would have the old
 * reply landing on it.
 *
 * It was the `.sidebar-files` row inside the side panel until phase 13, which
 * moved every control under the board and left the panel to the report (spec
 * Q23). The row keeps its own file because a row is one thing and this is the
 * only place either button is written.
 */

/** The two file buttons, and whether the engine is busy (spec 9.3). */
export interface FileProps {
  onSave: () => void
  onLoad: () => void
  /** Both are disabled while the engine thinks. */
  thinking: boolean
}

export function FileRow({ onSave, onLoad, thinking }: FileProps) {
  return (
    <div className="play-controls">
      <button type="button" onClick={onSave} disabled={thinking}>
        Save game
      </button>
      <button type="button" onClick={onLoad} disabled={thinking}>
        Load game
      </button>
    </div>
  )
}
