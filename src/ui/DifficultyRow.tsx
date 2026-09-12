import { allProfiles, levelName, strengthProfile } from '../engine'

/**
 * Origin: London src/ui/App.tsx, the course switch row, adapted: it chooses the difficulty, because this app has no courses, and it has no idle state.
 * The selector row under the header (spec 18.1).
 *
 * The trainer puts the one thing a person changes between games in its own row
 * under the header, and this app's one thing is the difficulty (Nick's Q16), so
 * it goes in the same row with the same class name. The class stays
 * `course-switch` on purpose: the two screens are siblings and may share a
 * stylesheet later, and a second name for the same row is how that stops being
 * possible.
 *
 * There is no idle state here. The trainer greys the row on the one screen
 * where a course means nothing; every screen of this app is the game.
 */
export function DifficultyRow({
  level,
  onLevel,
}: {
  level: number
  onLevel: (level: number) => void
}) {
  return (
    <div className="course-switch">
      <label htmlFor="difficulty">Difficulty</label>
      <select
        id="difficulty"
        value={level}
        title={levelTitle(level)}
        onChange={(event) => onLevel(Number(event.target.value))}
      >
        {allProfiles().map((profile) => (
          <option key={profile.level} value={profile.level}>
            {levelName(profile.level)}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * What the chosen level means, for a hover rather than for the screen.
 *
 * Both sentences were under the select in the sidebar until phase 9. The row is
 * the trainer's shape, which is one line, so they moved into the title where
 * they are still there for whoever wants them (spec 18.1). This is the one
 * place either sentence is written.
 */
function levelTitle(level: number): string {
  return [
    strengthProfile(level).detail,
    "The numbers on levels 4 and up are the engine's own scale, not an online rating.",
  ].join('\n\n')
}
