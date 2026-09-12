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
 */

/** True when the app is running inside the Tauri window rather than a browser. */
export function isDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * The app's folder under the user's local data folder, on Windows.
 *
 * Nothing in `src/` reads or writes it: the window keeps its browser profile
 * there, and `localStorage` inside that profile is where every setting and the
 * game in progress live (spec section 10). It is declared here because the name
 * is written in three places and they have to agree - here, `LOCAL_FOLDER` in
 * `src-tauri/src/lib.rs`, which points the profile at it, and
 * `APP_LOCAL_FOLDER` in `src-tauri/installer-hooks.nsh`, which is what a ticked
 * uninstall removes. `local-folder.test.ts` reads all three files and holds
 * them together, so a rename that reaches two of them fails the suite.
 *
 * NOT `Simple Chess`, which is the install folder and goes on every uninstall.
 * The trainer's reason (its `paths.ts`) is this one, and it cost it a lost
 * progress file to learn.
 */
export const LOCAL_FOLDER = 'Simple Chess Data'
