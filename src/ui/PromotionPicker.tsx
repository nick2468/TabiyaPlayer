import { useEffect, useRef } from 'react'
import type { Colour } from '../model/types'

/**
 * The four pieces a pawn on the last rank can become (spec 5.3).
 *
 * A picker rather than an automatic queen, because a game player sometimes
 * wants a knight and always wants to be asked (Nick's Q10). Nothing is played
 * and the engine is not asked until one of these is pressed: the move is held
 * by the screen until then.
 *
 * The pieces are the board's own, drawn by chessground's cburnett stylesheet,
 * which reaches them through `.cg-wrap piece.queen.white`. So the picker's own
 * box carries `cg-wrap`, and `play.css` puts the geometry back: that stylesheet
 * also makes every piece absolute at an eighth of its board, which is right on
 * a board and wrong inside a button.
 */

/** The letters chess.js and UCI both use, in the order the picker shows them. */
const CHOICES = [
  { piece: 'q', role: 'queen', name: 'Queen' },
  { piece: 'r', role: 'rook', name: 'Rook' },
  { piece: 'b', role: 'bishop', name: 'Bishop' },
  { piece: 'n', role: 'knight', name: 'Knight' },
] as const

export type PromotionPiece = (typeof CHOICES)[number]['piece']

export function PromotionPicker({
  colour,
  squareSize,
  onChoose,
  onCancel,
}: {
  /** The colour of the pawn being promoted. */
  colour: Colour
  /** One board square, so the four read as squares rather than as buttons. */
  squareSize: number
  onChoose: (piece: PromotionPiece) => void
  onCancel: () => void
}) {
  const box = useRef<HTMLDivElement>(null)

  // Escape, and a press anywhere but on the four. Spec 5.3 says clicking
  // anywhere else cancels, and anywhere else means the page rather than the
  // board: a user who has changed their mind reaches for the nearest empty
  // space, not for a particular one. On `pointerdown` rather than `click`, so
  // the press that dismisses the picker does not also press what is under it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) onCancel()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [onCancel])

  return (
    <div className="promotion cg-wrap" ref={box} role="group" aria-label="Promote the pawn to">
      {CHOICES.map((choice) => (
        <button
          key={choice.piece}
          type="button"
          aria-label={choice.name}
          style={{ width: squareSize, height: squareSize }}
          onClick={() => onChoose(choice.piece)}
        >
          <piece className={`${colour} ${choice.role}`} />
        </button>
      ))}
    </div>
  )
}
