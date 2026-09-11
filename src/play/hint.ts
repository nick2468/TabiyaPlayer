/**
 * Origin: London src/play/hint.ts, adapted: the Hint shape only, with the engine as its one source; phase 4 adds engineHint.
 * What a hint is: the move the engine suggests, and the sentence said about it
 * under the status line (spec section 8).
 */
export interface Hint {
  san: string
  /** The sentence shown under the status line. */
  text: string
  /** Which kind it is, so the arrow can be drawn in the right colour. */
  source: 'engine'
}
