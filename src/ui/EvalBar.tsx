import type { Colour } from '../model/types'
import {
  evalBarLayout,
  evalShare,
  numberPlacement,
  verdictInWords,
  type Evaluation,
} from '../play'

/**
 * Origin: London src/ui/Play.tsx LiveEvalBar, adapted: it carries the number (spec S7) and the words are this app's.
 * The bar beside the board (spec section 7).
 *
 * Vertical and board height, so it reads as the board's own margin rather than
 * as a widget. It follows the board's orientation: the user's colour is at the
 * bottom of it whichever colour they are playing, so a bar growing towards them
 * always means the same thing.
 *
 * The number is what this app adds, and it is the whole of Nick's ruling: a
 * number and no words. Where it goes is `numberPlacement`'s answer, and the two
 * classes below are all that reaches the stylesheet, because a colour belongs
 * in CSS and a piece colour doubly so.
 */
export function EvalBar({
  evaluation,
  userColour,
}: {
  /** Undefined until the engine has looked at something. */
  evaluation: Evaluation | undefined
  userColour: Colour
}) {
  const layout = evalBarLayout(evaluation?.pawns ?? 0, userColour)
  const placement = numberPlacement(layout)
  return (
    <div
      className="live-eval"
      role="img"
      aria-label={
        evaluation === undefined
          ? 'Evaluation: the engine has not looked yet'
          : `Evaluation: ${evaluation.text}`
      }
    >
      <div
        className="live-eval-white"
        style={{
          height: `${layout.whiteShare}%`,
          top: layout.whiteAtBottom ? 'auto' : 0,
          bottom: layout.whiteAtBottom ? 0 : 'auto',
        }}
      />
      {evaluation !== undefined && (
        <span
          className={`live-eval-number at-${placement.edge} ${placement.onWhite ? 'on-white' : 'on-black'}`}
        >
          {evaluation.text}
        </span>
      )}
    </div>
  )
}

/**
 * Origin: London src/ui/Play.tsx EvalBar, identical.
 * The report's own bar: the final position, horizontal, under the verdict
 * (spec 18.5).
 *
 * Its accessible name is the verdict in WORDS rather than the number the live
 * bar carries. The two are read differently: the live bar is watched out of the
 * corner of an eye during a game, where a number is quicker, and this one is
 * read with the report, where the words are what the reader can act on (spec
 * S18). `evalShare` is the same arithmetic behind both.
 */
export function ReportBar({ pawns }: { pawns: number }) {
  return (
    <div
      className="eval-bar"
      role="img"
      aria-label={`Evaluation: ${verdictInWords(pawns).toLowerCase()}`}
    >
      <div className="eval-white" style={{ width: `${evalShare(pawns)}%` }} />
    </div>
  )
}
