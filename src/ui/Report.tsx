import { describeSlip, type GameReport } from '../play'
import { CopyGame } from './CopyGame'
import { ReportBar } from './EvalBar'

/**
 * Origin: London src/ui/Play.tsx Report, adapted: "The repertoire" is gone, because this app has none.
 * The report, after the game (spec 18.5).
 *
 * Two headings: what the engine thought of the user's moves, and what it makes
 * of the position the game ended in. Everything is in words; the number is the
 * live bar's job (spec S18).
 */
export function Report({
  report,
  pgn,
  onJump,
}: {
  report: GameReport
  /** The whole game as text, for the copy button. */
  pgn: string
  /** Puts the board on the position a slip was played from (spec 18.4). */
  onJump: (movePly: number) => void
}) {
  return (
    <div className="report">
      <h3>The report</h3>

      <h4>Your moves</h4>
      {report.hints ? (
        <p className="hint-count">
          You used {report.hints} {report.hints === 1 ? 'hint' : 'hints'}.
        </p>
      ) : null}
      {report.slips.length === 0 ? (
        <p>Nothing the engine calls an inaccuracy or worse. Well played.</p>
      ) : (
        /* Each sentence is a button that puts the board on the position the
           move was played from, which is the only place the alternative it
           names can be seen. */
        <ul className="slips">
          {report.slips.map((slip) => (
            <li key={slip.ply} className={slip.tag}>
              <button type="button" className="jump" onClick={() => onJump(slip.ply)}>
                {describeSlip(slip)}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h4>The final position</h4>
      <p>{report.verdict}</p>
      {report.finalEval !== undefined ? <ReportBar pawns={report.finalEval} /> : null}
      {report.outcome ? <p className="hint">{report.outcome}</p> : null}

      <CopyGame text={pgn} />
    </div>
  )
}
