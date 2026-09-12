# Chip: phase 8 - the Windows app and the installer

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`. Your
context may have been compacted since phase 7; Nick decides that each time. **Do not
rely on what you remember of phases 0 to 7.** Read fresh, in this order, before
touching a file: `CLAUDE.md`; `docs/simple-chess-spec.md` sections 9.3, 10, 11 (all
of it), 12.3, 13, 15.3 and 17; the plan `docs/simple-chess-build-plan.md` "Rules
for the builder", "Standing discipline", phase 8, and the phase 7 notes with the
gate 7 findings at the end; then `docs/testing.md`; then, in `../London`: everything
under `src-tauri/` (`tauri.conf.json`, `Cargo.toml`, `build.rs`, `installer-hooks.
nsh`, `src/main.rs`, `src/lib.rs`, `capabilities/default.json`, `.gitignore`),
`scripts/check-uninstall-hook.mjs`, `scripts/packaged-eval.mjs` (yours is identical),
`src/version.test.ts`, and `docs/v1-acceptance.md` for the shape of an acceptance
walk. Everything below is compressed from those; where this chip and the spec
disagree, the spec wins and you say so in the phase notes.

**Goal: an installer that installs Simple Chess for the current user, opens the
window, saves and loads a game through real dialogs, and uninstalls cleanly. Version
1.0.0. The acceptance walk over spec 17.** This is the last phase.

## Where things stand

Phases 0 to 7 are committed and passed review (phase 7 is `09e2a05`). The app is
complete in the browser and as a Home Screen app. `scripts/packaged-eval.mjs` and
`scripts/probes/layout.js` are in place. `src/storage/files.ts` has the desktop
halves of Save game and Load game behind `isDesktop()`, never yet run. `src/storage/
paths.ts` has `isDesktop()` only. `src/version.test.ts` has two tests marked
`it.skip` for the Tauri files. `public/icon.svg` is the app icon. `package.json` has
`"tauri": "tauri"` and the three `@tauri-apps` dependencies; `@tauri-apps/cli` is a
dev dependency. 250 tests green. The trainer is `C:\Users\nick2\Code\London`; you read
and copy from it and never change it.

**The Rust toolchain is installed but not on the tool shells' PATH.** `cargo` and
`rustc` live in `%USERPROFILE%\.cargo\bin` (verified 2026-09-12). In Bash: `export
PATH="$HOME/.cargo/bin:$PATH"` at the start of every command that builds; in
PowerShell: `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"`. NSIS is already
fetched by an earlier Tauri build, at `%LOCALAPPDATA%\tauri\NSIS\makensis.exe`.

## Settled decisions you build on

- **Copy the trainer's `src-tauri/` with the names changed, and nothing else changed**
  (spec 11). The approach is the trainer's; the reasons in its comments stand.
- **The window** (spec 11.1): title "Simple Chess", 1280 by 1000, minimum 960 by 720,
  centred, resizable, declared in `tauri.conf.json` with `"create": false` and built
  in `lib.rs` from that declaration so the WebView2 profile lands in
  `%LOCALAPPDATA%\Simple Chess Data\WebView2`. `main.rs` opens no console window.
- **The installer** (spec 11.2): NSIS, `installMode: currentUser`, unsigned (SmartScreen
  warns; accepted). The version is one number in three files, held by
  `version.test.ts`.
- **The uninstaller** (spec 11.3, S10): the trainer's hook with ONE folder,
  `$LOCALAPPDATA\Simple Chess Data`, the guard copied character for character, and
  the check script proving all four cases against scratch folders.
- **Capabilities** (spec 11.4): `core:default`, `dialog:allow-open`, `dialog:allow-save`,
  `fs:allow-read-text-file` and `fs:allow-write-text-file` under `$HOME/**`, and
  nothing else. `fs.requireLiteralLeadingDot: false` in `plugins`.
- **No service worker in the window** (S12): already true, `UpdateWatch` is behind
  `isDesktop()`.
- **The icon** (spec 12.3): `npx tauri icon` from the same `public/icon.svg`, into
  `src-tauri/icons/`.
- **Version 1.0.0 at acceptance** (spec 2): set in this phase.
- **The layout probe** (spec 15.3): read a second way, against the installed window,
  through `packaged-eval.mjs`. That script also takes `--shot file.png`, and it is
  the ONE screenshot file this project makes, because the Tauri window has its own
  profile (CLAUDE.md, standing hazards: never a headless browser).
- **Nick's own files are not yours.** `%APPDATA%` and `%LOCALAPPDATA%` hold his other
  apps' data; the only folder this phase may create, read or remove is `Simple Chess
  Data` and the scratch folders the check script makes under the temp directory.

## The work

### 8.1 The Tauri shell

- [ ] `src-tauri/tauri.conf.json`, from the trainer's: `productName` "Simple Chess",
  `version` "1.0.0", `identifier` `com.nick.simple-chess`, `build` with `devUrl`
  `http://localhost:5185` and the same three commands, the window as above with
  `label` "main", `security.csp` null (the trainer's; its register records why), the
  `plugins.fs` block, `bundle` with `targets: ["nsis"]`, `icon: ["icons/icon.ico"]`,
  `shortDescription` "A simple chess game against Stockfish", `longDescription` one
  sentence more, and `windows.nsis` with `installMode: "currentUser"` and
  `installerHooks: "installer-hooks.nsh"`.
- [ ] `src-tauri/Cargo.toml`: package `simple-chess`, version `1.0.0`, description as
  above, lib name `simple_chess_lib`, the trainer's dependencies and release
  profile unchanged. `build.rs` identical (three lines). `.gitignore` identical
  (`target/`). The repo's root `.gitignore` already ignores `src-tauri/target/` and
  `src-tauri/gen/`.
- [ ] `src-tauri/src/main.rs` identical but for the lib name it calls. `src/lib.rs`
  identical but for `LOCAL_FOLDER = "Simple Chess Data"` and the product name in the
  two `expect` messages; keep its comments, which explain the profile folder, and
  add one line saying the same literal is in `src/storage/paths.ts`.
- [ ] `src/storage/paths.ts`: add `export const LOCAL_FOLDER = 'Simple Chess Data'`
  with the trainer's comment on why it is not the install folder, now that something
  names it (the hook check below reads it, see 8.2). Nothing else in `src/` needs it.
- [ ] `src-tauri/capabilities/default.json`: the trainer's shape with only the grants
  of spec 11.4, and a `description` that says what the window may do in one sentence.
  `$HOME/**` for both text-file grants, as the trainer's.

### 8.2 The uninstaller hook and its proof

- [ ] `src-tauri/installer-hooks.nsh`: the trainer's file with one folder. Keep the
  whole comment (it is the reason the guard exists), change the two things that are
  true here: one `!define APP_LOCAL_FOLDER "$LOCALAPPDATA\Simple Chess Data"` (no
  roaming folder, no `APP_DATA_FOLDER`), and the macro removes that one folder under
  the same guard, `$DeleteAppDataCheckboxState = 1` and `$UpdateMode <> 1`, with
  `SetShellVarContext current`. The literal matches `LOCAL_FOLDER` in `lib.rs` and
  `paths.ts`, and the comment says so.
- [ ] `scripts/check-uninstall-hook.mjs`: the trainer's adapted to one folder: one
  scratch folder, one `!define`, the report writes `local=` only, four cases with
  `want` as the trainer's. Origin line. Run it: `node scripts/check-uninstall-hook.mjs`
  must print four PASS lines and "All four cases behaved." Paste the output into the
  notes. Then put the `$UpdateMode <> 1` half of the guard aside for one run and show
  the second case FAIL, restore it, and run again green: that is the mutation this
  file exists for.
- [ ] A string test, `src/storage/local-folder.test.ts`, that reads
  `src-tauri/installer-hooks.nsh` and `src-tauri/src/lib.rs` and asserts both contain
  `Simple Chess Data` exactly as `LOCAL_FOLDER` says (the trainer holds its version in
  three files the same way; this holds the folder name in three).

### 8.3 Icons and the version

- [ ] `npx tauri icon public/icon.svg` (or `public/icon-512.png` if the SVG is
  refused) writes `src-tauri/icons/`. Commit the set; it is what the trainer commits.
- [ ] `version.test.ts`: remove the two `it.skip`s and their comments. Set `1.0.0` in
  `package.json`, `tauri.conf.json` and `Cargo.toml`. The four version tests pass.

### 8.4 Build and drive the packaged app

- [ ] With `.cargo/bin` on PATH: `npx tauri build`. The first Rust build takes
  minutes; that is normal. Record the installer's path
  (`src-tauri/target/release/bundle/nsis/Simple Chess_1.0.0_x64-setup.exe`) and size,
  and the executable's path (`src-tauri/target/release/simple-chess.exe`).
- [ ] Do NOT run the installer yourself; that is Nick's step (8.6) and it writes to
  his machine. Run the built EXECUTABLE directly, from `src-tauri/target/release/`,
  with the debug port: in Bash, `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"
  ./src-tauri/target/release/simple-chess.exe &`. Then:
  - `node scripts/packaged-eval.mjs "document.querySelector('h1').innerText"` reads
    "Simple Chess v1.0.0".
  - `node scripts/packaged-eval.mjs @scripts/probes/layout.js`: the probe against the
    real window; record it. The window is 1280 by 1000; the display scale is the
    machine's.
  - `node scripts/packaged-eval.mjs --shot scratch/window.png` under the scratchpad
    directory (NOT the repo): look at it and describe it. This is the one screenshot
    file the project makes.
  - The desktop half of phase 5: through `packaged-eval.mjs`, click Save game
    (`document.querySelector('.sidebar-files button').click()`); the real save dialog
    opens ON SCREEN and cannot be driven from the script. **Ask Nick to press Save in
    it** (say so at spawn: this step needs a person at the screen), and read the
    notice afterwards. Then Load game the same way. If Nick is not present, leave
    both as 8.6 items and say so; do not fake the dialogs.
  - Confirm `%LOCALAPPDATA%\Simple Chess Data\WebView2` exists after the run and that
    NO `com.nick.simple-chess` folder was made under `%LOCALAPPDATA%` or `%APPDATA%`
    (the trainer's reason for building the window in `lib.rs`).
  - Close the app. The app must not be left running: two windows cannot share one
    WebView2 profile, and Nick's installer step comes next.

### 8.5 The acceptance walk

- [ ] `docs/acceptance.md`, in the shape of the trainer's `docs/v1-acceptance.md`:
  spec 17's eleven items, each with what was actually done to check it, in this
  phase or a named earlier gate, and where a check could not be made from this
  session (the iPad, the installer) say so and name the person. Items 8 and 9 have
  Nick's halves; leave the dates blank for him.
- [ ] `README.md`: the Windows paragraph replaces "Arrives with phase 8".
  `CLAUDE.md`: current state, and the toolchain line gains the `.cargo/bin` PATH
  note and `npx tauri build`. `docs/testing.md`: one paragraph on `packaged-eval.mjs`
  and the hook check. The spec's 13.2 table rows for `src-tauri/` and `paths.ts`
  updated to what was built.

### 8.6 Close

- [ ] `npx vitest run` both projects green under twenty seconds; counts and time.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean, `npx tauri build` clean.
- [ ] Copies diffed against the trainer's `src-tauri/` files and listed, with the
  changed lines named. No forbidden words in adapted or new files (the Rust comments
  included). No em dashes under `src/` or `src-tauri/`.
- [ ] Reuse and duplication review, then commit. The version bump to 1.0.0 is its own
  commit ("Version 1.0.0"), as the trainer does, so a bisect can tell it apart.
- [ ] Tell Nick, in the report, exactly what 8.6 asks of him: run the installer, open
  the app, play a move, save and load a game, close and reopen to see the game
  remembered, uninstall with the box ticked and check `%LOCALAPPDATA%\Simple Chess
  Data` is gone. And that 7.8 is still his.

## Decision rules

- **`cargo` is not found.** It is in `%USERPROFILE%\.cargo\bin`; put that on PATH for
  the command. If it is not there either, stop and tell Nick: installing a toolchain
  is his step.
- **`npx tauri build` fails in Rust.** Read the first error, not the last. A missing
  Windows SDK or a stale `Cargo.lock` from the trainer are the likely causes; there
  is no `Cargo.lock` to copy, let cargo make one and commit it, as the trainer does.
- **`npx tauri icon` wants a PNG.** Use `public/icon-512.png`; the SVG is the source
  of that PNG, so nothing drifts.
- **The packaged window ignores a synthetic move.** Expected in a production build
  (`trustAllEvents` is off); `packaged-eval.mjs` can click buttons and read
  anything, and a move on the board is a person's step, which 8.6 has.
- **A dialog is on screen and nobody presses it.** Wait, then leave it for 8.6 and
  say so. Never `taskkill` the app with a dialog open without saying what was lost.
- **Something a person would see is not specified** (the installer's text, a window
  title): the spec settles it; anything left, ask Nick. Code shape: decide and say
  why.
- **A contradiction** between chip, plan, spec and copied code: stop that item, write
  it down, continue with the rest.

## Out of scope for this phase

Code signing, auto-update on Windows, anything under `../London` or `../Conquest`,
Nick's installer run (8.6) and Nick's iPad steps (7.8).

## Acceptance

Phase 8 of the plan, boxes 8.1 to 8.5, 8.7 and 8.8 ticked as they land: the shell
files present and diffed against the trainer's; the hook check's four cases printed
and the second case shown red once; the version 1.0.0 in three files with four live
tests; the installer built with its path and size recorded; the probe and the one
screenshot read from the running executable; `docs/acceptance.md` walked item by
item; suite green under twenty seconds; `tsc -b` clean. Box 8.6 stays open for Nick.

## Conventions

- Tick the plan's phase 8 boxes as you go. Append "Phase 8 - builder notes" under the
  plan's "Phase notes" after the gate 7 findings: measured, decided, asked, the reuse
  review's find, left. Update the Progress table row.
- The reuse review's likely finds this phase: the folder name written a fourth time;
  the version written anywhere but the three files; a second probe expression.
- Two commits at least, on `main`: the phase, and "Version 1.0.0". Short imperative
  subjects, bodies that say why. End each message with `Co-Authored-By: Claude Opus 5
  <noreply@anthropic.com>`, naming the model you actually are. Write the message to
  a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours.

## Cleanup

Close the packaged app. Stop any dev server. Report the two commit hashes, the test
counts and time, the installer's path and size, the hook check's output, the probe
from the running window, what the screenshot showed, and the steps that are Nick's.
