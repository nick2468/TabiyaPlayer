/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * One folder name, in three files.
 *
 * The window's browser profile holds every setting and the game in progress
 * (spec section 10), and a ticked uninstall removes the folder it sits in (spec
 * 11.3). Three files name that folder: this module, which declares it;
 * `src-tauri/src/lib.rs`, which points the profile at it; and
 * `src-tauri/installer-hooks.nsh`, which deletes it. Nothing makes them agree
 * at build time - the Rust side cannot read a TypeScript constant and the NSIS
 * side cannot read either - so a rename that reaches two of them would leave an
 * uninstaller deleting a folder that is not there, and the real one behind.
 *
 * The trainer holds its version number in three files the same way, for the
 * same reason: a literal repeated across languages needs a test or it drifts.
 */
import { LOCAL_FOLDER } from './paths'

const repo = new URL('../../', import.meta.url)

function read(name: string): string {
  return readFileSync(new URL(name, repo), 'utf8')
}

describe('the local data folder', () => {
  it('is what lib.rs points the window profile at', () => {
    const found = read('src-tauri/src/lib.rs').match(/^const LOCAL_FOLDER: &str = "(.+)";$/m)
    expect(found?.[1]).toBe(LOCAL_FOLDER)
  })

  it('is what a ticked uninstall removes', () => {
    const found = read('src-tauri/installer-hooks.nsh').match(
      /^ {2}!define APP_LOCAL_FOLDER "\$LOCALAPPDATA\\(.+)"$/m,
    )
    expect(found?.[1]).toBe(LOCAL_FOLDER)
  })

  it('is not the install folder, which every uninstall removes', () => {
    // A current-user NSIS install puts the program in %LOCALAPPDATA%\<product
    // name>. The profile must sit beside it, not inside it.
    const product = (JSON.parse(read('src-tauri/tauri.conf.json')) as { productName: string })
      .productName
    expect(LOCAL_FOLDER).not.toBe(product)
    expect(LOCAL_FOLDER.startsWith(product)).toBe(true)
  })
})
