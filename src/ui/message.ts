/**
 * Something that was thrown, as a sentence for the screen.
 *
 * Two places catch and show: the provider, for an engine that would not start
 * or answer, and the shell, for a file that would not be written or read. Both
 * get whatever the platform threw, which may not be an `Error` at all, and
 * both have to end up with a string a person can read.
 */
export function asMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
