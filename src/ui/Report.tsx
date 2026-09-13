import { describeSlip, type GameReport } from '../play'
import { CopyGame } from './CopyGame'
import { ReportBar } from './EvalBar'

/**
 * Origin: London src/ui/Play.tsx Report, adapted: "The repertoire" is gone, because this app has none, and the slips are not buttons until phase 11.
 * The report, after the game (spec 18.5).
 *
 * Two headings: what the engine thought of the user's moves, and what it makes
 * of the position the game ended in. Everything is in words; the number is the
 * live bar's job (spec S18).
 */
export function Report({
  report,
  pgn,
}: {
  report: GameReport
  /** The whole game as text, for the copy button. */
  pgn: string
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
        /* Plain list items, not the trainer's buttons. The trainer's jump the
           board to the position a slip was played from, and the board that
           would jump is the review viewer, which is phase 11. A control that
           does nothing is worse than no control, so until then these are what
           they look like: sentences. */
        <ul className="slips">
          {report.slips.map((slip) => (
            <li key={slip.ply} className={slip.tag}>
              {describeSlip(slip)}
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
