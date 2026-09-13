# Simply Chess

A no-frills chess game against Stockfish, on one screen. It runs as an installed
Windows app (Tauri 2 over WebView2, like the Repertoire Trainer in `../London`) and as
an iPad Home Screen app (a PWA on Cloudflare Pages, like Conquest in `../Conquest`),
from one React, TypeScript and Vite code base. The code is copied from those two apps
wherever they already do the job, so that a shared library can follow later.

Current state: version 1.0.0 is built and gated, and version 2 is under way (spec
section 18, which wins over sections 1 to 17). Phase 11 passed gate 11 on 2026-09-13
(commits `2502c88` and the gate's own): **a reviewed game is a viewer** (spec 18.4). Every move in the list is a
button, the one the board is standing on is marked in `--mark`, the left and right
arrow keys step (never with a text field focused), and the list scrolls itself to keep
the mark in view. The bar follows the position being looked at. Standing where a slip
was played from, the move that was played is the highlight and the engine's better move
is a blue arrow, both at once; a slip's sentence in the report is the button that puts
the board there. Row two of the buttons holds **Keep playing** (a game that was stopped,
handed back at its final position), **Play from here** (a new game from the viewed
position, at the same side and level, disabled with the trainer's reasons where the
engine is to move or the game is over) and the two stepping arrows. The board does not
change size when row two appears, because phase 9's chrome already counted it. One
thing is left for phase 12's box 12.1: Play from here is still live at the START of a
game, where spec 18.4 says it is off, because the trainer it was copied from has no
rule for the start.

Phase 10 passed gate 10 on 2026-09-13 (commits `fe794fd` and `445e175`): a game can be
**stopped and reviewed** or **stopped and discarded**. The
review scans the game at the analysis profile, handed everything the bar already
worked out, and the report in the side panel names each slip with its move number, its
tag and the engine's preferred move, gives the final position a verdict in words with
a horizontal bar under it, and says how many hints were used. Copy game and Save game
write the same text, which now carries the report's comments (spec 18.6); a reviewed
file still loads back.

Phase 9 passed gate 9 on 2026-09-13 (commits `5c5dcf4` and `ce31e55`, with an
interim installer at `c9f1dde`): the app is called **Simply Chess** everywhere a person sees it, including the
data folder, the identifier, the package name and the storage keys, and the screen is
the trainer's Play screen - the difficulty in a selector row under the header, the
board size toggle beside Light/Dark, a head row with the opening line and the status,
the move list in its own 167 px column at board height, and a side panel with Play as
and the file buttons. The window opens at 1400 by 980 and the fit rule's chrome
constants were re-measured for it (167 above, 120 below, 607 beside). The version
stays 1.0.0 until phase 12, which bumps it to 1.1.0 and ships section 18.

Phase 8 (the Windows app and the installer) landed 2026-09-12 and passed gate 8:
`src-tauri/` is the trainer's with the names changed, the window keeps its browser
profile in
`%LOCALAPPDATA%\Simply Chess Data`, the NSIS installer installs for the current user,
and the uninstaller removes that one folder only when the box is ticked, proved by
`node scripts/check-uninstall-hook.mjs`. The version is 1.0.0 in three files.
`docs/acceptance.md` walks spec 17 item by item. Two boxes are Nick's and are still
open: 8.6 (run the installer, play a move, save and load, reopen, uninstall) and
7.8 (publish, add to the Home Screen, play a move in aeroplane mode). Both were
written against version 1 and hold; the installer he runs will be phase 12's. Phases
0 to 7 passed their gates. Phase 7 made it a Home Screen app: an icon, a manifest, the engine
in the precache, and a new version offered in a bar that says loading it loses nothing;
`docs/simple-chess-deploy.md` has Nick's steps for it. Phase 6 put every screen of spec 15 on the address bar in a
development build (`?scene=midgame&size=large&theme=light`), kept all of it out of
`npm run build`, and added `scripts/probes/layout.js` and `scripts/packaged-eval.mjs`
for phase 8; its pass found one fault and fixed it, the move list's "keep the newest
move in view" scrolling the whole screen, which cut the top of the board off on a
1180 by 820 window from the moment the app opened. Phases 0 to 5: a game leaves the app as the PGN file of
spec 9.1 and comes back with its moves, side and level; undo and redo fetch the
number for a position they land on when it has none, and go back through a game that
arrived whole; the bar carries the engine's number
and Hint draws and says a move, a pawn on the last rank asks which piece, the
settings and the game in progress are remembered, and the large board is whatever
fits the screen it is on and draws whole squares (Nick ruled on 2026-09-12 that it
need not be literally double, so the fit rule steps down until the squares land on
whole device pixels; spec S2 carries the corrected rule and its numbers per display
scale).

## Documents

- [docs/simple-chess-spec.md](docs/simple-chess-spec.md) - what the app does and how
  it is built. Authoritative. Section 2 records Nick's rulings Q1 to Q14 and section
  18 his Q15 to Q22; **section 18 wins wherever it and sections 1 to 17 differ.**
  Numbered decisions S1 upward carry their reasons.
- [docs/simple-chess-build-plan.md](docs/simple-chess-build-plan.md) - the phases,
  their boxes, and the rules for the builder. Tick a box when the item lands with
  green tests and works on screen.
- [docs/testing.md](docs/testing.md) - the two kinds of test and the rules the suite
  keeps.
- [docs/simple-chess-deploy.md](docs/simple-chess-deploy.md) - Nick's Cloudflare and
  iPad steps.
- [docs/acceptance.md](docs/acceptance.md) - spec 17 walked item by item, with what was
  done to check each one and who did it.
- `SimpleChess-brief.txt` - Nick's brief, kept for history. Build from the spec, not
  from this.

## Who does what

- **The orchestrator** is a session started here that writes the spec, the plan and
  one chip per phase, reviews each phase after it lands, and keeps the docs current.
  It builds nothing substantial itself.
- **The builder** is an Opus session that works one phase from its chip, on `main`,
  in this folder, and never pushes. It asks Nick rather than guessing on anything a
  person would see or feel. The plan's "Rules for the builder" bind.
- **Nick** rules, pushes to GitHub, and does the Cloudflare, DNS, iPad and installer
  steps that need his accounts and his devices.

## Toolchain

- Node 22.12.0 (`.node-version`), npm. The Rust toolchain is installed but **not on a
  tool shell's PATH**: `cargo` and `rustc` are in `%USERPROFILE%\.cargo\bin`, so put it
  on the path for any command that builds the window (`export
  PATH="$HOME/.cargo/bin:$PATH"` in Bash, `$env:Path = "$env:USERPROFILE\.cargo\bin;$env:Path"`
  in PowerShell). NSIS is already fetched, at `%LOCALAPPDATA%\tauri\NSIS`.
- `npm run dev` on port 5185 (`--strictPort`; 5173 is dc.web, 5175 is London, 5180
  and 5181 are Conquest). `npm run preview` on 5186 serves the built files with the
  service worker, which is the only way to test offline.
- `npx vitest run` runs both test projects. `tsc -b` type-checks. `npm run build`
  makes `dist/`. `npx tauri build` makes the window and the installer, into
  `src-tauri/target/release/` and `.../bundle/nsis/`; `npx tauri dev` runs the window
  against the dev server. `node scripts/check-uninstall-hook.mjs` proves the
  uninstaller's four cases without uninstalling anything.
- Stockfish is copied into `public/engine/` by `npm run engine` (gitignored).

## Architecture rules

- `src/engine`, `src/model` and `src/play` import no React and touch no browser
  global except the worker in `stockfish.ts`. `src/storage` is the only place that
  reads or writes storage or files. `src/ui` holds every component. Spec S13.
- Tauri and PWA APIs are imported lazily behind `isDesktop()`. Spec S14.
- One worker for the life of the app. Spec S5.
- Every evaluation and hint uses the analysis profile (level 8, 150 ms) and puts the
  playing profile back in a `finally`. Spec 6.3.
- The screen is built from the provider's state. Nothing on screen is patched by
  hand.

## Code quality (applies from the first line, never as a later pass)

- One implementation per algorithm. The shared homes are the copied ones and must
  stay single: `legalDests` and `sideToMove` (`position.ts`); `squaresForSan`,
  `sanForMove`, `isPromotion` (board moves to chess moves); `Movetext` and `pgnTag`
  (writing PGN); `parsePgn` (reading it); `gameToPgn` (a game as a file) and
  `loadPgn` (a file as a game); `outcomeOf` (every outcome sentence); `evalShare`
  and `evalText` (the bar); `levelName` (naming a level); `levelOrNull` in
  `play/level.ts` (a level arriving from a setting, a record or a file); `asMessage`
  in `ui/message.ts` (something thrown, as a sentence); `Notice` in `ui/Notice.tsx`
  (every message under the board); `openingLine` in `ui/opening-line.ts` (the head
  row's one sentence); `levelTitle` in `ui/DifficultyRow.tsx` (the two sentences
  about a level, which are now a hover and nowhere else); `verdictInWords` and
  `describeSlip` in `play/report.ts` (every verdict and every slip, on screen and in
  the file's comments alike); `stoppedAt` in the same file (where an unfinished game
  got to, said by the report and by the PGN); `scanGame` in `play/scan.ts` (the only
  place a whole game is evaluated); `positionAtPly`, `moveAtPly`, `clampPly`,
  `plyBeforeMove` and `plyAfterMove` in `play/replay.ts` (all the arithmetic of
  walking a finished game; nothing else indexes `moves` by a ply);
  `canPlayFromPly` and `whyNotPlayable` in `ui/play-from-replay.ts` (whether a
  viewed position can be played on from, and the sentence saying why not);
  `keepInView` in `ui/MoveList.tsx` (the only thing that scrolls the list, for
  both the newest row and the marked move); `toClipboard` in `ui/CopyGame.tsx`
  (the only clipboard); `pgnNow` in `Shell` (the running game as text, for Save game and Copy
  game, which must write the same one); the `read`, `write`, `oneOf`, `readOneOf`, `useRemembered` and
  `remember*` helpers in `prefs.ts` (every setting; `oneOf` answers "is this one of
  these words" for storage and for the address bar alike, and each key string stays
  in the module that owns it); `scrollToShow` in `ui/keep-in-view.ts` (the only
  scroll arithmetic); `SCENES` and `sceneFromLocation` in `dev/scenes.ts`;
  `updateNotice` in `ui/updates.ts` (the update bar's words); the four `--pad-*`
  custom properties on `.app` (the page's safe-area padding, which the update bar
  reuses); `LOCAL_FOLDER` in `storage/paths.ts` (the Windows data folder, whose name
  is also in `src-tauri/src/lib.rs` and `installer-hooks.nsh` because neither can
  import it, with `storage/local-folder.test.ts` holding the three together); the
  chrome constants in `ui/board-size.ts` (the only pixel numbers in a `.ts` or
  `.tsx`).
  Never fork a second copy, and give any new repeated snippet a single home the
  moment it appears twice.
- Copied files are byte-identical to their origin plus one `Origin:` line; adapted
  files say what changed in that line. Spec S3.
- `main.tsx` stays free of test-harness code: the dev scenes live in `src/dev/`.
- Close every phase with a short reuse and duplication review of the new code, and
  refactor on the spot before the phase commit.
- Check every change a person can see in the pane inside the same phase, as the
  trainer's phases did, with the scenes and the layout probe of spec section 15:
  `?scene=<fresh|midgame|mate|promotion|hint>` sets the screen up, and
  `eval(await (await fetch('/scripts/probes/layout.js')).text())` measures it. The
  bar, the board box and `cg-board` end on the same pixel, and the page never scrolls
  sideways. jsdom has no layout, so no test can hold either number. `?pretendUpdate`
  shows the update bar without a real update, and offline is proved against
  `npm run preview` on 5186 by stopping the server and playing a move.

## Conventions

- Spec section 3 words, exactly: the user, the engine, level, side, board size, the
  bar, evaluation, the analysis profile, move, game, outcome. One name for one thing.
  Never "trainee".
- No em dashes anywhere under `src/`. Docs use plain hyphens.
- Australian English on screen and in docs.
- `npx vitest run` green and `tsc -b` clean before every commit. No snapshots, no
  fake timers, no worker in the suite. Under twenty seconds.
- Commits: short imperative subject, a body that says why. End the message with
  `Co-Authored-By: <the model you are> <noreply@anthropic.com>`. PowerShell 5.1
  mangles some multi-line messages: write the message to a scratch file and use
  `git commit -F` when in doubt.
- Never change anything under `../London` or `../Conquest`. Read and copy only.
- Never push. Nick pushes.

## Standing hazards

- **The engine file is bigger than Workbox's default precache limit.** Without
  `maximumFileSizeToCacheInBytes` the app opens offline and the engine never answers.
  Spec S11. Shown in phase 7: take the line out and Vite says "engine/
  stockfish-18-lite-single.wasm is 7.3 MB, and won't be precached", which is a
  warning in a build log and a broken app on an iPad.
- **Undo a mutation check with the reverse edit, never `git checkout --`.** A
  phase's new files are untracked, so the checkout fails; its changed files are
  tracked, so the checkout takes the phase's own work with them. Both happened in
  phase 7, to `updates.ts` and to `App.tsx` and `vite.config.ts`.
- **The trainer's port is 5175 and its dev server may be running.** Confirm the
  served page shows this app's version before trusting any live check.
- **The engine can miss its own 20 second start timeout in a hidden pane.** The
  WASM is 7 MB and compiling it in a background worker took 12 to 15 seconds in
  phase 10, so the first load after a server start says "the engine did not answer
  in time" and means nothing is wrong. Reload once; the compiled module is cached
  and the second load answers. Do not shorten or lengthen the timeout because of
  this: it is generous on real hardware.
- **A hidden browser pane throttles React.** A move lands in the session at once and
  the screen catches up a second later. Poll for the DOM to change; do not read once
  and conclude. The trainer met this twice.
- **A hidden pane suspends `requestAnimationFrame`, and chessground redraws behind
  one.** Its `debounceRedraw` queues every redraw on a frame, so the board's drawn
  layers can lag the app's state for as long as the pane stays hidden: in phase 11 the
  blue arrow for a slip's better move was set in `__cg.state.drawable.autoShapes` and
  not in `svg.cg-shapes`, and an arrow the app had already cleared stayed drawn. The
  app was right both times. Read `window.__cg.state` rather than the SVG, or call
  `__cg.redrawAll()`, or take a screenshot, which paints. This reads exactly like a
  broken feature and is not one: do not change `Board.tsx` for it.
- **Chessground needs `ResizeObserver`**, which jsdom lacks. DOM tests mock the board
  with `src/test/board-stub.tsx`; `rig.dom.test.tsx` pins the throw.
- **Headless Edge is not a screenshot tool on this machine.** Started with a fresh
  scratch profile, and again with `--inprivate`, it signed into Nick's Windows account,
  began syncing, and loaded his extensions (phase 0 notes). Screenshots come from the
  pane, and from `packaged-eval.mjs --shot` against the Tauri window, which has its
  own profile.
- **The uninstall hook deletes a folder.** Its guard is copied from Tauri's own block
  and is not optional. `scripts/check-uninstall-hook.mjs` proves all four cases.
