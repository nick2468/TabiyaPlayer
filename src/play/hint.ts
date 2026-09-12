/**
 * Origin: London src/play/hint.ts, adapted: the engine hint only, and its sentence has lost the second half.
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

/**
 * The engine's move, said in one sentence.
 *
 * The trainer's version says a second thing: that its authored lines have run
 * out, and that is why no note came with the move. This app has no authored
 * lines and never had, so there is nothing to explain. The engine's opinion is
 * the only kind of hint there is here.
 */
export function engineHint(san: string): Hint {
  return { san, source: 'engine', text: `The engine suggests ${san}.` }
}
