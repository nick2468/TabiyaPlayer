/**
 * Origin: London src/storage/paths.ts, adapted: cut to isDesktop, which is all this app needs until it has a window.
 * Where the app is running.
 *
 * One question, asked in one place, because the answer decides which half of
 * every file operation runs (spec 9.3): the wrapped window has real dialogs
 * and a filesystem, and a browser has a download and a file input.
 *
 * Tauri is imported lazily wherever it is needed (spec S14), so this module can
 * be pulled into a browser build without dragging in an API that is not there.
 * That is why the check is a property on `window` rather than an import: asking
 * the question must not itself load anything.
 *
 * The trainer's `LOCAL_FOLDER`, the folder the window keeps its browser profile
 * in, arrives with the window in phase 8. Nothing uses it before then.
 */

/** True when the app is running inside the Tauri window rather than a browser. */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}
