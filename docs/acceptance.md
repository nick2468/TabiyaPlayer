# Acceptance, checked

Spec section 17, item by item, with what was actually done to check each one and when.
Written 2026-09-12 in phase 8.

Where something was checked by driving the app, it was driven: the development build in
the browser pane, the production bundle from `npm run preview`, and the packaged window
over the WebView2 debugging port. Where a check cannot be made from a build session at
all, it says so and names the person who makes it. Two things are of that kind, and both
are Nick's: the iPad, because this machine is not one, and the first run of the installer,
because it writes to his machine.

Every claim below is recorded in more detail in the plan's phase notes and gate findings.

## 1. The screen

**Green.** One screen with the header, the bar, the board, the four buttons, the status
line, the sidebar's three settings and two file buttons, and the move list.

The layout probe (`scripts/probes/layout.js`, spec 15.3) was run at every viewport of
spec 15.2, at both board sizes and both themes, in phase 6, and S16's two numbers held in
all twelve rows: the bar, `.board` and `cg-board` end on the same pixel, and
`scrollWidth` never exceeds `innerWidth`. Phase 7 re-ran it with the update bar on screen
at 1280 by 1000 and 820 by 1180 and the numbers did not move. Phase 8 ran the same file a
second way, against the packaged window, and it agrees: see item 8.

Phase 6 is also where this item earned its instrument. The move list's "keep the newest
move in view" called `scrollIntoView`, which scrolls every scrollable ancestor, so at
1180 by 820 the board's top rank was off the screen from the moment the app opened. Five
phases of green tests never saw it, because jsdom has no layout. The scroll arithmetic is
now one pure function with its own test, and the probe is how the rest is watched.

## 2. A game

**Green.** Checkmate was reached in the pane with the scripted engine and in the suite;
against the real engine at level 4 a scholar's mate is defended, which is the engine
working. Phase 2 played a real game in the pane against the real Stockfish; the outcome
sentences are `outcomeOf`'s, with a string test per ending.

Playing Black: New game hands the engine the first move, the board is flipped and the
bar's White share is at the top (DOM test, phase 3). Undo and redo behave as spec 5.4,
including out of checkmate, which clears the outcome (string test on the session, phase
2). A promotion offers the picker, locks the board while it is open, plays the chosen
piece, and puts the pawn back on Escape: driven in the pane in phase 4 from a seeded
position (`axb8=R`, answered by `Rxa1`, the bar moving +4.9 to +3.8) and held by a DOM
test.

## 3. Levels

**Green.** All eight are in the select, Club (level 4) is the default on a fresh install,
and a change mid-game is heard by the engine's next search: phase 3 chose level 6 in the
pane mid-game and the session's profile became level 6, 300 ms, Elo 1750, with the
setting and the remembered game both written as 6. A string test with a recording fake
engine pins the order: the level reaches the engine before the next search.

## 4. The bar

**Green.** The bar follows every move, holds its value while the engine thinks, and
carries the number with the right sign and orientation. Driven in the pane in phase 4:
the start position read "Evaluation: +0.5" with White's share 58.09 percent drawn from
the bottom. `evalShare` and `evalText` have string tests for `+0.4`, `-1.2`, `0.0`, `M5`
and `-M5` and the share of each. Undo's missing number is fetched for the position it
lands on, at the analysis profile, with nothing greyed (phase 5).

## 5. Hint

**Green.** Phase 4 asked for a hint in the pane: "The engine suggests e4." with one
auto-shape `bluee2e4` on the board, the button greyed while the engine thought. Phase 6
re-checked it from the `hint` scene at 1180 by 820. It is disabled when the game is over
and while the engine is thinking, which DOM tests hold.

## 6. Save and load

**Green in the browser and on the iPad's side; the packaged window's dialogs are item 8.**
A saved file is the PGN of spec 9.1: seven tags, the movetext, and one closing comment,
with a string test on the writer and the reader together that round-trips the moves, the
side and the level. A foreign PGN with variations loads its main line with the user as
White, and an illegal file is refused with the current game untouched (string tests,
phase 5).

Driven in the pane in phase 5: Save game made one blob of 225 bytes typed
`application/x-chess-pgn` and said "Saved to your downloads folder"; Load game put a
hidden `.pgn` input in the page, took a Black game at level 6 through it, and the board
came back the other way up with the select on 6, the Black radio ticked and White's reply
already played.

## 7. Remembered

**Green.** Every setting and the game in progress survive closing and reopening: DOM
tests across a remount for the settings, and a stored game that replays on start with its
own side and level. A scrambled stored game is discarded silently and a fresh game
starts. Driven in the pane in phase 3 (a reload brought back the game, the level 6
select, Large ticked) and again in phase 7 offline, where the page reloaded with the
server stopped and opened on the game it was closed on.

On Windows the same storage is the WebView2 profile's, in `%LOCALAPPDATA%\Simple Chess
Data`, which is the folder the window is pointed at in `src-tauri/src/lib.rs`. That it
survives closing the window is Nick's step in item 8.

## 8. Windows

**Green as far as a session can take it. The installer run is Nick's.**

Built in phase 8 with `npx tauri build`:

- The installer is `src-tauri/target/release/bundle/nsis/Simple Chess_1.0.0_x64-setup.exe`,
  6,894,680 bytes (6.6 MB). `installMode: currentUser`, so it asks for no administrator
  rights and installs into `%LOCALAPPDATA%\Simple Chess`. It is unsigned, so SmartScreen
  warns once (spec 11.2, accepted).
- The executable is `src-tauri/target/release/simple-chess.exe`, 9,147,392 bytes (8.7 MB).
- The window was started with WebView2's debugging port on and read through
  `scripts/packaged-eval.mjs`. Its title is "Simple Chess" and its inner size is 1280 by
  1000, which is spec 11.1. The header says "Simple Chess v1.0.0", the version in
  `package.json`, `tauri.conf.json` and `Cargo.toml` (four tests hold them together).
- The layout probe, run against that real window: `.board` and `cg-board` both 416 square
  at x 68, the bar 24 wide at x 24, and all three ending on 496.67 together; the sidebar
  280 wide at x 508; `scrollWidth` 1280 against `innerWidth` 1280. S16's two numbers hold
  in the shipped window, at the machine's display scale of 1.5.
- **The engine runs in it.** The bar read "+0.4" on the start position, and Hint, pressed
  through the debugging port, drew a blue arrow from e2 to e3 and said "The engine
  suggests e3." That is Stockfish's WASM loading and searching inside the window with no
  server anywhere. A screenshot of both states was taken and is described in the phase
  notes.
- **No service worker inside the window** (spec S12), read live rather than asserted:
  `navigator.serviceWorker.getRegistrations()` is empty and there is no update bar.
- `%LOCALAPPDATA%\Simple Chess Data\WebView2` was created by that run, and no
  `com.nick.simple-chess` folder appeared under `%LOCALAPPDATA%` or `%APPDATA%`, which is
  what building the window in `lib.rs` is for.
- The uninstaller's four cases were proved by `node scripts/check-uninstall-hook.mjs`
  against a scratch folder: only a ticked, non-upgrade uninstall removes it. Taking the
  `$UpdateMode <> 1` half of the guard out turns the second case red, which is a version
  bump deleting the user's game; it was put back and the four cases re-run.

**Nick's, once:** run the installer, open the app, play a move on the board (the shipped
build ignores synthetic events, which is what makes it safe, so this needs a person),
save a game and load it back through the real dialogs, close and reopen to see the game
remembered, then uninstall with the box ticked and check `%LOCALAPPDATA%\Simple Chess
Data` is gone. Plan box 8.6. Date: ______

The two dialogs are his because nothing else can do them: a save dialog is a window on
the screen that only a person can answer, and a session that opened one would have to
leave it there. What could be checked from here was: both buttons are on screen and
live, and the window takes the desktop path (`__TAURI_INTERNALS__` is present, which is
what `isDesktop()` reads), so the halves behind those buttons are the Tauri ones rather
than the browser's download and file input. The capability file grants exactly the five
permissions spec 11.4 lists.

## 9. iPad

**Green as far as a session can take it. The publishing and the aeroplane-mode game are
Nick's.**

Phase 7 built the manifest, the icons and the service worker and proved the offline case
against the production bundle on this machine: `npm run preview` on 5186, one move played
on the real board, the server stopped, the page reloaded on the remembered game, and a
second move answered by the engine from the precached WASM (delivered from
`cache-storage`, transfer size 0) while a fetch of an unstored path was refused. The
precache names both engine files; without `maximumFileSizeToCacheInBytes` Vite drops the
7.3 MB WASM with one line in the log and the app opens offline and hangs, which was shown
and put back (spec S11).

The update banner was driven at `?pretendUpdate` in both themes at two viewports: it
offers the new version, says the game is remembered so loading it loses nothing, and
"Load it" calls the worker's `updateServiceWorker(true)` (DOM test). It is not registered
at all inside the Tauri window (spec S12, DOM test).

**Nick's, once:** push to GitHub, make the Cloudflare Pages project with its
`NODE_VERSION`, add the DNS record, add the app to the Home Screen from Safari, and play a
move in aeroplane mode after one online visit. Every step is in
[simple-chess-deploy.md](simple-chess-deploy.md). Plan box 7.8. Date: ______

## 10. Tests

**Green.** 257 tests in 31 files, both projects, in 8.1 seconds warm on this machine,
which is inside the twenty-second rule. By project: 202 string tests in 21 files, 55 DOM
tests in 10. Nothing is skipped. `tsc -b` clean, `npx oxlint` silent. No em dashes under
`src/` or `src-tauri/`. The version is held in three files by four tests, and the Windows
data folder's name is held in three files by three more.

All eleven tests of spec S15 are present:

| S15 | Where |
|---|---|
| 1. Undo in pairs, redo, and an undo out of checkmate | `play/session.test.ts` |
| 2. A promotion is not played until a piece is chosen | `ui/promotion.dom.test.tsx` |
| 3. A level change reaches the engine before its next search | `ui/remembered.dom.test.tsx`, "tells the engine a new level before its next move" |
| 4. The bar's numbers and shares | `play/evalbar.test.ts` |
| 5. A saved game round-trips | `play/game-pgn.test.ts` and `play/load-pgn.test.ts` |
| 6. A foreign PGN loads its main line; a bad file is refused | `play/load-pgn.test.ts` |
| 7. The remembered game reopens; a scrambled one is discarded | `ui/remembered.dom.test.tsx` |
| 8. Every setting survives a restart | `ui/remembered.dom.test.tsx` |
| 9. Play as Black: the engine opens, the board is flipped, White's share is at the top | `ui/remembered.dom.test.tsx` and `ui/bar-and-hint.dom.test.tsx` |
| 10. New game clears the hint, the outcome and the redo stack | `ui/bar-and-hint.dom.test.tsx` and `ui/play-game.dom.test.tsx` |
| 11. The large board fits and divides by 8 | `ui/board-size.test.ts` |

Item 10 is the one this walk found a hole in. The redo stack was held; the hint and the
outcome were not, and S15 names all three. Two DOM tests were added in phase 8 and both
were shown red first, against a `start` that keeps the old hint and a New game that
carries the old moves into the fresh session.

## 11. Docs

**Green.** The specification, the plan with every box ticked or its gap recorded, this
document, `testing.md`, `simple-chess-deploy.md` for the iPad, the README for both
platforms, and `CLAUDE.md` for the next session. Every copied file carries its `Origin:`
line and adapted ones say what changed (spec S3). The only boxes still open are the two
that need Nick's machine and accounts, 7.8 and 8.6, and both are named above.
