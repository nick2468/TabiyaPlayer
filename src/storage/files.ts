import { isDesktop } from './paths'

/**
 * Origin: London src/ui/backup.ts, adapted: one PGN rather than a progress file, and the browser can open one too (its file input is London src/ui/bundles.ts pickBundle turned round).
 * Getting a game out of the app as a file, and back in (spec 9.3).
 *
 * The two places this app runs need different machinery for the same job. A
 * browser can only offer a download and a file input. The wrapped window has
 * real save and open dialogs, and a blob download inside a WebView is not
 * something to rely on, so the desktop path writes the file itself.
 *
 * Both are behind one pair of functions, so the screen does not care which it
 * is running in. This is also the only module that touches files at all (spec
 * S13), and every Tauri import is behind `isDesktop()` and awaited, so the
 * browser bundle never pulls in a plugin that is not there (spec S14).
 */

/** What a PGN file is called in a dialog, and what the filter offers. */
const FILTER = { name: 'Chess game', extensions: ['pgn'] }

export interface SaveResult {
  /** Something to show the user. Null when they cancelled the dialog. */
  message: string | null
}

/** A file the user chose, read. */
export interface OpenedPgn {
  name: string
  text: string
}

/** Writes the game out under the name offered. Returns what to say about it. */
export async function savePgn(text: string, name: string): Promise<SaveResult> {
  if (isDesktop()) {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const path = await save({ defaultPath: name, filters: [FILTER] })
    if (!path) return { message: null }
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')
    await writeTextFile(path, text)
    return { message: `Saved to ${path}` }
  }

  const url = URL.createObjectURL(new Blob([text], { type: 'application/x-chess-pgn' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
  return { message: 'Saved to your downloads folder' }
}

/** Reads a game file back. Null when the user cancelled. */
export async function openPgn(): Promise<OpenedPgn | null> {
  if (isDesktop()) {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const path = await open({ multiple: false, directory: false, filters: [FILTER] })
    if (typeof path !== 'string') return null
    const { readTextFile } = await import('@tauri-apps/plugin-fs')
    return { name: fileName(path), text: await readTextFile(path) }
  }
  return pickFile()
}

/**
 * The browser's open dialog, which is a file input nobody sees.
 *
 * A browser will not open a file chooser on its own, so the input is made,
 * clicked and taken away again. It has to be in the document for the click to
 * count in every browser, which is why it is added and removed rather than
 * left floating.
 *
 * A browser that does not fire `cancel` leaves this promise unresolved, which
 * older ones do not. Nothing hangs on it but a closure: the button is live
 * again the moment the chooser closes, because nothing about the screen waits
 * for this to settle. A timeout would be a made-up answer to a question nobody
 * asked.
 */
function pickFile(): Promise<OpenedPgn | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pgn'
    input.hidden = true
    document.body.append(input)

    const finish = (picked: OpenedPgn | null) => {
      input.remove()
      resolve(picked)
    }
    input.addEventListener('cancel', () => finish(null))
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (!file) {
        finish(null)
        return
      }
      void file.text().then((text) => finish({ name: file.name, text }))
    })
    input.click()
  })
}

/**
 * Origin: London src/ui/bundles.ts fileName, identical.
 * The last part of a path, whichever slash the platform uses.
 */
function fileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}
