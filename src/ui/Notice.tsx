/**
 * One short message under the board, in the trainer's notice style.
 *
 * Every message that belongs there goes through this: an engine that would not
 * start or answer, a file that was saved, a file that could not be read.
 * Renamed from `EngineError` in phase 5, when the second kind arrived, because
 * two components drawing the same box in two colours is how they drift apart.
 *
 * It had the status line for company until phase 9, which moved the status up
 * into the head row (spec 18.1). A file with one component in it is named after
 * that component, so `StatusLine.tsx` went and this took its place.
 *
 * `bad` is the warning colour. A message that says something went wrong looks
 * different from one that says something worked, and which of the two it is
 * belongs to whoever wrote the sentence.
 */
export function Notice({ message, bad = false }: { message: string; bad?: boolean }) {
  return <p className={bad ? 'notice bad' : 'notice'}>{message}</p>
}
