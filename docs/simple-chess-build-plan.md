# Simple Chess - build plan

Version 1. Written 2026-09-11. Status: **Active**. Phases 0 and 1 passed review
2026-09-11; phase 2 is next.

Read [the specification](simple-chess-spec.md) first. It says what the app does. This
document says what gets built, in what order, and how we know each part is finished.
Where the two disagree, the specification wins.

## How to use this document

Tick a box in the same sitting the item lands with green tests. A box is not ticked
because the code exists. It is ticked because the tests are green and the thing works
on screen. Review corrects any tick that does not survive scrutiny.

Each phase ends with something you can look at. No phase ends with "the groundwork is
laid". Each phase ends with one commit at least, on `main`.

## Rules for the builder

You are an Opus session in `C:\Users\nick2\Code\SimpleChess`. These rules bind for
every phase.

1. **Work on `main`, in this folder, and never push.** There is no worktree. Nick
   pushes when he wants the iPad to update.
2. **Never change anything under `../London` or `../Conquest`.** You read them and
   copy from them. If a copied file has a fault, fix the copy and record the fault in
   the phase notes so the orchestrator can carry it back.
3. **Ask Nick rather than guess.** When the specification and this plan do not say
   what to do, and the choice would change what a person sees or how the app
   behaves, stop and ask. Record the question and the answer in the phase notes.
   Small matters of code shape you decide yourself; say what you decided and why.
4. **Stop on a contradiction.** If the specification, this plan and the copied code
   cannot all be right, stop that item, write down the contradiction under the
   phase's notes, and carry on with the items that do not depend on it.
5. **Copy per S3.** A file this app does not change is byte-identical to the
   trainer's, plus one `Origin:` line at the top of its header comment. An adapted
   file says `Origin: ... adapted: <what changed>`. Comments in adapted files
   describe this app, not the trainer's phases or courses.
6. **Code quality from the first line** (spec 13.3). One home for every repeated
   snippet the moment it appears twice. `main.tsx` stays free of harness code. Close
   every phase with a reuse and duplication review of the new code and refactor on
   the spot, before the phase commit. Say in the phase notes what the review found,
   even when it found nothing.
7. **Look at what a person can see** (spec 15), as the trainer's phases did. Every
   UI-affecting phase drives the app in the pane, screenshots the scenes, and records
   the layout probe's output in its notes. Watch `scrollWidth` against `innerWidth`:
   a page that scrolls sideways is a regression, whatever else went right.
   **No screenshot files are required** (ruled at gate 0). The pane's screenshot is
   looked at by the session and writes no file; the phase notes say what was seen
   and give the measured numbers, which is what the trainer's notes did. Never start
   a headless browser on this machine to make one (see CLAUDE.md, standing hazards).
   The only screenshot file in this project is `packaged-eval.mjs --shot` against the
   Tauri window in phase 8.
8. **Tests with the code.** `npx vitest run` green and `tsc -b` clean before every
   commit. A regression test is shown red before its fix. No snapshots, no fake
   timers, no worker (docs/testing.md).
9. **Words** (spec 3). One name for one thing. "The user", never "trainee". No em
   dashes under `src/`. Australian English.
10. **Commits.** Short imperative subject line, a body that says why. End every
    message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` (name the
    model you actually are). PowerShell 5.1 mangles some multi-line messages: write
    the message to a scratch file and use `git commit -F` when in doubt.
11. **The dev server.** `npm run dev` serves on 5185 with `--strictPort`, so a clash
    fails loudly. Before any live check, confirm the served page is this folder's
    code: the version in the header is the one in `package.json`.
12. **Nick's own files are not yours.** Do not list, read or report anything under
    his user profile except what a step names. Clear the pane's storage after a
    drive that wrote to it.

## Standing discipline, every phase

1. Write the phase's tests with the code.
2. Close with the reuse and duplication review, refactor, then commit.
3. Screenshot every UI-affecting change in the same phase, record the probe.
4. Tick boxes as items land. Write the phase notes: what was measured, what was
   decided, what was asked, what is left.

---

## Phase 0 - the scaffold

**Goal: `npm run dev` opens a page titled Simple Chess with the version and the theme
toggle, `npx vitest run` is green, `npm run build` produces `dist/`.**

Read first: `../London/package.json`, `vite.config.ts`, the three `tsconfig*.json`,
`.oxlintrc.json`, `.gitignore`, `index.html`, `src/main.tsx`, `src/index.css`,
`src/globals.d.ts`, `src/version.test.ts`, `src/ui/theme.ts`, `src/ui/app.css`,
`docs/testing.md`; `../Conquest/vite.config.ts`, `index.html`, `.node-version`,
`.vscode/`.

- [x] 0.1 `package.json`: name `simple-chess`, version `0.1.0`, `"type": "module"`,
      description "A simple chess game against Stockfish". Scripts exactly:
      `dev` = `npm run engine && vite --port 5185 --strictPort`,
      `build` = `npm run engine && tsc -b && vite build`,
      `preview` = `vite preview --port 5186 --strictPort`,
      `engine` = `node scripts/copy-engine.mjs`, `test` = `vitest run`,
      `test:watch` = `vitest`, `lint` = `oxlint`, `icons` = `node tools/make-icons.mjs`,
      `tauri` = `tauri`. Dependencies: the trainer's list without `ts-fsrs` and
      `react-markdown`. Dev dependencies: the trainer's list plus `vite-plugin-pwa`
      and `sharp` at Conquest's versions. Pin the four testing-library and jsdom
      versions exactly, as the trainer does.
- [x] 0.2 `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: the trainer's,
      identical. `.oxlintrc.json` identical. `.node-version` = `22.12.0`.
- [x] 0.3 `vite.config.ts`: the trainer's `define` for `__APP_VERSION__`, the server
      port from `PORT` or 5185, the two vitest projects (`string` in node for
      `src/**/*.test.ts`, `dom` in jsdom for `src/**/*.dom.test.tsx` with
      `src/test/dom-setup.ts`). Leave the PWA plugin out until phase 7, so that no
      service worker exists while the screen is being built.
- [x] 0.4 `.gitignore`: the trainer's (`node_modules/`, `dist/`, `public/engine/`,
      `src-tauri/target/`, `src-tauri/gen/`, caches, editor files, logs) plus
      Conquest's `dev-dist/`. `.vscode/extensions.json` and `settings.json` from
      Conquest, committed.
- [x] 0.5 `.claude/launch.json` with `simple-chess-dev` (`npm run dev`, port 5185)
      and `simple-chess-preview` (`npm run preview`, port 5186), in Conquest's shape
      with the `--prefix` flag pointing at this folder.
- [x] 0.6 `scripts/copy-engine.mjs` identical. `public/engine/` fills on
      `npm run engine` and stays gitignored.
- [x] 0.7 `index.html`: Conquest's head (lang `en-AU`, viewport with
      `viewport-fit=cover`, theme-color `#16181c`, the two `mobile-web-app-capable`
      metas, the apple-touch-icon and favicon links) with the title Simple Chess.
      The icon files arrive in phase 7; the links may point at files not there yet.
- [x] 0.8 `src/main.tsx` (the trainer's, with `./index.css`), `src/index.css`
      identical, `src/globals.d.ts` identical, `src/ui/theme.ts` identical but for
      the key `simple-chess.theme`, `src/ui/app.css` cut to `.app`, `.app-header`,
      `.app-version`, `.nav-link`, `.theme-toggle`, `button`, `button:disabled` and
      the `@media (min-width: 900px) and (min-height: 700px)` block.
- [x] 0.9 `src/ui/App.tsx`: the header (name, version, theme toggle) and an empty
      `<main>`. No providers yet.
- [x] 0.10 `src/version.test.ts`: the trainer's. The two Tauri files do not exist
      until phase 8, so the two tests that read them are written now and marked
      `it.skip` with a comment naming phase 8, which unskips them.
- [x] 0.11 `src/test/dom-setup.ts` identical. `src/test/dom.tsx` with `renderApp`
      only, adapted to this app's providers as they arrive. (The plan first said
      `goTo` too; that opens a screen from a nav, and this app has one screen.
      Corrected at gate 0.)
- [x] 0.12 `docs/testing.md`: the trainer's, adapted. Drop the content checkers
      section. Keep the two kinds, what is faked and why, and the rules.
- [x] 0.13 One DOM test: the header shows "Simple Chess" and the version, and the
      theme toggle flips `data-theme` on the root and writes `simple-chess.theme`.
- [x] 0.14 `npm run dev`, `npx vitest run`, `tsc -b`, `npm run build` all work.

**Done when:** the dev page shows the header in both themes, the suite is green, and
`dist/` exists. Screenshot the header in both themes at 1280 by 1000.

---

## Phase 1 - the engine and the model, copied

**Goal: every pure module the app needs is in place, tested, with no screen yet.**

Read first: `../London/src/engine/*`, `src/model/position.ts`, `src/model/pgn.ts`,
`src/model/types.ts`, `src/model/grade.ts`, `src/play/outcome.ts`,
`src/play/evalbar.ts`, `src/test/fake-engine.ts`, and the tests beside each.

- [x] 1.1 `src/engine/`: `stockfish.ts`, `uci.ts`, `strength.ts`, `index.ts` and
      `engine.test.ts`, identical, each with its `Origin:` line.
- [x] 1.2 `src/model/position.ts` identical with its test. `src/model/pgn.ts`
      identical with `pgn.test.ts` (the parser and the writer are both needed).
- [x] 1.3 `src/model/types.ts`: only `Colour`, `Brush`, `Shape` and `colourName`
      from the trainer's file. `src/model/moves.ts`: `squaresForSan`, `sanForMove`
      from the trainer's `grade.ts`, identical text, with a test. (`grade.ts` is a
      drill file; these two functions are the only part this app uses, and the
      origin line says which file they came from.)
- [x] 1.4 `src/play/outcome.ts` identical, all three functions kept (the chip ruled
      that an identical copy beats a trimmed one; the plan first said drop the
      unused third), with a test.
- [x] 1.5 `src/play/evalbar.ts` adapted per spec 7 as corrected at gate 0: the
      evaluation map's value is `{ pawns: number; text: string }`, built once by
      `evaluationOf(score, sideToMove)`; `evalShare`, `evalBarLayout` unchanged;
      `shownEvaluation` returns the entry rather than the number.
      `evalText(score, sideToMove)` gives `+0.4`, `-1.2`, `0.0`, `M5`, `-M5`, with
      the test from spec S15 item 4. (The plan first said `{ pawns, score }`.)
- [x] 1.6 `src/test/fake-engine.ts` identical.
- [x] 1.7 `src/play/index.ts` exporting what exists so far.
- [x] 1.8 Reuse review: nothing in `src/engine`, `src/model` or `src/play` imports
      React or touches `window` or `document` (the worker in `stockfish.ts` is the one
      exception). Say so in the notes.

**Done when:** the suite is green with the copied tests present. No screenshot: nothing
changed on screen.

---

## Phase 2 - the board, the session and a playable game

**Goal: a game against the engine can be played on screen with the four buttons, the
status line and the move list. No sidebar yet: level 4, White, small board.**

Read first: `../London/src/ui/Board.tsx`, `board.css`, `board-size.ts`,
`src/play/session.ts`, `src/ui/play-context.tsx`, `src/ui/Play.tsx` (`PlayControls`,
`MoveList`, `PlayHead`, `squaresOf`), `src/ui/play.css`, `src/test/board-stub.tsx`,
`src/test/dom.tsx`, `src/ui/play-game.dom.test.tsx`, `src/ui/rig.dom.test.tsx`.

- [x] 2.1 `src/ui/Board.tsx` and `board.css` identical. `src/ui/board-size.ts`:
      `BOARD_SIZE = 416` with the trainer's comment, plus `BOARD_SIZE_LARGE = 832`.
      The fit rule is phase 3.
- [x] 2.2 `src/play/session.ts` adapted: no book, no `side`/`courseMoves`, no
      `bookReplies`, no `hints`, no `fromBook`. Keep `moves`, `floor`, undo in pairs,
      redo, `noteOutcome`, `playStudent`, `playOpponent` (engine only), `engineMove`
      with `chooseCandidate`. Add `setProfile(profile)` which the next `engineMove`
      reads (spec S6). Remove the length cap (`GameLength`, `lengthCap`, `extend`,
      `finishedByCap`): `status` is `finished` on `outcome` or `isGameOver()` and
      `playing` otherwise. The user's colour is a constructor option `side`,
      defaulting to white; `studentColour` may keep its name (spec 3). Tests copied
      from `play.test.ts` for undo, redo and outcome, plus spec S15 items 1 and 3.
- [x] 2.3 `src/play/report.ts` is NOT copied. `PlayedMove` moves to
      `src/play/session.ts` (ply, san, colour, fen, after) with an origin line. Add
      `fullMove(ply)` from `report.ts` beside it, with its test.
- [x] 2.4 `src/ui/play-context.tsx` adapted: `StartOptions` is `{ level, side,
      startMoves? }`; keep `session`, `thinking`, `engineError`, `evaluations`,
      `hint`, `start`, `play`, `undo`, `redo`, `askHint` (phase 4), `reset`,
      `canHint`; drop the report, the scan, the record, the replay ply, `extend`,
      `finish`, `resume`, `discard`. Keep the trainer's comment on why the value is
      not memoised, and keep `createEngine` injected. The worker is stopped only when
      the provider unmounts (spec S5): `reset` calls `newGame()` on the running
      engine and does not stop it. Add `setLevel(level)` which stores the level and
      calls the session's `setProfile`.
- [x] 2.5 `src/ui/PlayControls.tsx`: the trainer's row one (New game, Undo, Redo,
      Hint), same disabled rules; Hint disabled until phase 4 wires it.
      `src/ui/MoveList.tsx`: the trainer's `MoveList` with `activePly` and the
      buttons removed (spec 5.7), scrolled to keep the last row in view with
      `scrollIntoView({ block: 'nearest' })` on the last cell. `src/ui/StatusLine.tsx`
      with the trainer's `PlayHead` wording (spec 5.6).
- [x] 2.6 `src/ui/Screen.tsx`: `.play-body` holding `.play-column` (a placeholder
      `.live-eval` box, the `Board`, `PlayControls`, `StatusLine`) and `.sidebar`
      (the `MoveList` only, this phase). `play.css` cut to `.play-body`,
      `.play-column`, `.play-board`, `.play-controls`, `.play-status`, `.live-eval`,
      `.live-eval-white`, `.move-list` and its rows, `.move-number`, with the bar at
      24 px and the gap at 20 px per spec 4.2, and a new `.sidebar` block: 280 px
      wide, flex column, `align-self: stretch`. The move list fills the sidebar's
      remaining height (`flex: 1; min-height: 0`).
- [x] 2.7 `App.tsx` wraps `<Screen />` in `PlayProvider` and starts a fresh game on
      mount (level 4, white, until phase 3 reads the settings).
- [x] 2.8 `src/test/board-stub.tsx` identical. `src/test/dom.tsx` grows `board()`
      and `movesOnScreen()` from the trainer. `rig.dom.test.tsx` copied: it pins the
      chessground throw that makes the stub necessary.
- [x] 2.9 DOM tests, board mocked, fake engine: play `d4`, the engine replies, the
      list shows both, Undo empties it, Redo puts both back; the worker guard from
      `play-game.dom.test.tsx` (a throwing `Worker` is never constructed); New game
      clears the list and the redo stack (spec S15 item 10, without the hint yet).
- [x] 2.10 Drive it in the pane against the real engine: a game to checkmate at
      level 4 as White. Confirm the outcome sentence and the locked board. Screenshot
      at 1280 by 1000 in both themes. Record the probe (the placeholder bar, `.board`
      and `cg-board` all 416 and ending on the same pixel).
- [x] 2.11 Reuse review and commit.

**Done when:** a full game plays in the pane and in the DOM test.

---

## Phase 3 - the sidebar and what is remembered

**Goal: difficulty, Play as and board size on the sidebar, all remembered, the game
remembered, and the large board fitting the screen.**

Read first: `../London/src/ui/prefs.ts`, `remembered-settings.dom.test.tsx`,
`Play.tsx` (the "How strong" fieldset), `../Conquest/src/ui/remembered-setup.ts` and
its test, `../Conquest/src/ui/styles.css` (the safe-area padding and the 900 px
breakpoint).

- [ ] 3.1 `src/storage/prefs.ts`: the trainer's `read`, `write`, `readOneOf`,
      `useRemembered` (identical text, origin line), and three hooks: `useLevel`
      (1 to 8, default 4), `useSide` (`white`/`black`), `useBoardSize`
      (`small`/`large`), with the keys of spec 10. Called once, in `App`, and handed
      down, for the reason the trainer gives on `useDrillScope`.
- [ ] 3.2 `src/storage/current-game.ts`: `rememberGame({ sans, side, level })`,
      `recallGame()` returning the record or null, `forgetGame()`. Every field is
      checked on the way back, as Conquest's `recallSetup` checks its record: a
      version other than 1, a non-array, a side or level out of range, all give null.
      String tests, including a scrambled record.
- [ ] 3.3 The provider writes the game after every move, undo, redo and start; a
      fresh game with no moves removes the record. On mount `App` recalls the game:
      if it replays legally (`canReplayMoves`, copied from the trainer's
      `play-on.ts` as one function in `src/play/replay.ts` with an origin line), the
      game starts from it with its side and level and those become the settings;
      otherwise a fresh game.
- [ ] 3.4 `src/ui/Sidebar.tsx`: three fieldsets in the trainer's `.play fieldset`
      style. "Difficulty": the select from the trainer's "How strong" with
      `levelName`, the level's `detail` under it and the engine-scale sentence.
      "Play as": two radios, White and Black, with one hint line: "Applies to the
      next new game." "Board": two radios, Small and Large. Under them the Save game
      and Load game buttons side by side (wired in phase 5, disabled until then).
      Then the move list.
- [ ] 3.5 Level changes call the provider's `setLevel` (spec S6). Side changes are
      read by the next New game. Board size changes re-render at once.
- [ ] 3.6 Play as Black: New game starts the engine first (`!studentToMove` in the
      trainer's `start`), the board is oriented black. DOM test per spec S15 item 9.
- [ ] 3.7 The fit rule (spec S2) in `board-size.ts`: `fitBoardSize(wanted,
      viewportWidth, viewportHeight)` returning the largest multiple of 8 not above
      `wanted` that fits the width less padding, bar and gap, and the height less
      header, padding, buttons and status. The numbers it subtracts are named
      constants beside the layout numbers they come from. String test per spec S15
      item 11. A hook `useBoardPixels(size)` reads the viewport, re-measures on
      resize and orientation change, and returns the pixels; the small size is
      always 416.
- [ ] 3.8 The narrow layout (spec 4.3): below 900 px the sidebar goes under the
      board column at full width and the move list shows ten rows. Safe-area padding
      on `.app` as Conquest's `.board-page`. Buttons at least 36 px tall.
- [ ] 3.9 DOM tests: every setting remembered across a remount (spec S15 item 8);
      the game reopens after a remount and a scrambled stored game is discarded
      (item 7).
- [ ] 3.10 Drive in the pane: change level mid-game and confirm through
      `window.__game` (the trainer's dev handle, kept) that the session's profile
      changed before the engine's next move. Screenshots at the three viewports of
      spec 15.2, both sizes, both themes. Record the probe at each: no sideways
      scroll; on 1180 by 820 the large board is a multiple of 8 below 832.
- [ ] 3.11 Reuse review and commit.

**Done when:** every setting survives a reload, the game survives a reload, and the
large board fits every viewport with no sideways scroll.

---

## Phase 4 - the bar, the hint and the promotion picker

**Goal: the evaluator shows the number, Hint works, and a pawn on the last rank asks
which piece.**

Read first: `../London/src/ui/Play.tsx` (`LiveEvalBar`, `hintShapes`),
`src/play/hint.ts`, `src/ui/play-context.tsx` (`evaluate`, `askHint`,
`analysisProfile`), `src/play/evalbar.test.ts`, `src/model/position.ts`
(`isPromotion`), chessground's `movable.events.after` and `set({ fen })`.

- [ ] 4.1 The provider's `evaluate`, copied: analysis profile, 150 ms, restore in
      `finally`, the map keyed by `positionKey`, a known position not searched
      again. The map value is `{ pawns, score }` (phase 1.5). `play` calls it before
      and after the engine's reply, as the trainer does.
- [ ] 4.2 `src/ui/EvalBar.tsx`: the trainer's `LiveEvalBar` with the number (spec
      S7). The number is a `<span class="live-eval-number">` placed at the outer end
      of the larger share: `top: 2px` when the larger share is at the top, else
      `bottom: 2px`; colour the other piece colour; 10 px bold, tabular figures. The
      accessible name is "Evaluation: +0.4", or "Evaluation: the engine has not
      looked yet" before the first value. CSS in `play.css`.
- [ ] 4.3 `src/play/hint.ts`: `engineHint(san)` returning `{ san, text: "The engine
      suggests Nf3.", source: 'engine' }`. The provider's `askHint`: the trainer's
      engine half only (500 ms at the analysis profile, restore in `finally`), clears
      on the next move, undo, redo, New game and Load game. The arrow is the
      trainer's `hintShapes` in blue. The sentence renders under the status line in
      the trainer's `.hint-said.engine` style.
- [ ] 4.4 `src/ui/PromotionPicker.tsx` (spec 5.3). The board's `onMove` checks
      `isPromotion`; when true it does NOT play, it stores the pending move and shows
      the picker over the board: four buttons, each a `piece` element of the
      chessground piece set (`cburnett`) in the promoting colour, laid over the
      destination file. Choosing calls `play(from, to, piece)`. Clicking outside, or
      Escape, cancels: the board is re-set to the session's `fen` so the pawn goes
      back. `sanForMove` already takes the promotion letter.
- [ ] 4.5 DOM tests: the promotion is not played until chosen and cancel puts the
      pawn back (spec S15 item 2; the stub gets one button per legal move including
      promotions, so the test clicks `move e8=Q`-style buttons through the same
      `onMove` seam with the promotion letter passed); Hint draws `bluee2e4`-style
      shapes and says the sentence, is disabled while thinking and when the game is
      over; New game clears the hint (item 10, complete).
- [ ] 4.6 Drive in the pane: a game where the bar visibly moves, one hint, one
      promotion each way (chosen and cancelled), and a mate in the bar's number
      (`M1` or similar). Screenshots of the bar at both sizes and both themes, and
      the picker open. Record the probe: bar, board and `cg-board` heights equal.
- [ ] 4.7 Reuse review and commit.

**Done when:** the bar reads right after every move and the picker works both ways.

---

## Phase 5 - save game and load game

**Goal: a game leaves the app as a PGN file and comes back the same, on both
platforms.**

Read first: `../London/src/play/game-pgn.ts` and its test, `src/model/pgn.ts`
(`parsePgn`, `Movetext`, `pgnTag`), `src/ui/backup.ts`, `src/ui/bundles.ts`,
`src/storage/paths.ts` (`isDesktop`), `src/play/session.ts` (the constructor's
`startMoves` replay).

- [ ] 5.1 `src/play/game-pgn.ts` adapted per spec 9.1: `gameToPgn({ moves, side,
      level, outcome, at })`; the seven tags; one closing comment; the result token.
      `pgnDate` and `pgnResult` identical. `saveFileName(at)` giving
      `simple-chess-YYYY-MM-DD-HHMM.pgn`. String tests on the exact text.
- [ ] 5.2 `src/play/load-pgn.ts`: `loadPgn(text)` returning `{ sans, side, level? }`
      or `{ error }`. Uses `parsePgn`, takes `games[0].moves` main line SANs, replays
      them with chess.js, reads `White`/`Black` for "You" and "Stockfish level N".
      Tests: the round trip (spec S15 item 5); a foreign PGN with variations and
      comments loads its main line as White (item 6); an illegal file gives an
      error; a file with no games gives an error.
- [ ] 5.3 `src/storage/paths.ts`: `isDesktop` and `LOCAL_FOLDER = 'Simple Chess
      Data'` only, with the trainer's comment on why the folder is not the install
      folder. `src/storage/files.ts`: `savePgn(text, name)` and `openPgn()` in the
      trainer's `backup.ts` shape: Tauri dialogs and fs on the desktop, a blob
      download and a hidden file input in the browser. `openPgn` in the browser
      resolves when the input changes; cancel resolves null.
- [ ] 5.4 The provider's `load(sans, side, level)`: starts a game from the moves,
      applies the side and level to the settings, evaluates every position with the
      trainer's `scanGame` (copied into `session.ts` or `src/play/scan.ts`, identical
      text) so the bar can follow undo, and lets the engine move if it is to move.
      Errors go to the status line and leave the current game alone.
- [ ] 5.5 Wire the two buttons: disabled while thinking; Save says nothing on
      success on the desktop beyond the dialog closing, and "Saved to your downloads
      folder" in the status line in the browser, for three seconds, the trainer's
      `CopyGame` timing.
- [ ] 5.6 DOM tests: Save produces the spec 9.1 text for a played game (intercept
      the blob path through an injected `savePgn`); Load through an injected
      `openPgn` restores moves, side and level; a bad file leaves the game untouched
      and says why.
- [ ] 5.7 Drive in the pane: save a game (the browser path), open the file in an
      editor and check the text against spec 9.1, load it back. The desktop path is
      driven in phase 8.
- [ ] 5.8 Reuse review and commit.

**Done when:** save, load and the foreign-file case all pass and the file reads as the
spec shows.

---

## Phase 6 - scenes, the probe and the layout pass

**Goal: every screenshot of spec 15 can be set up from the address bar, the probe
exists, and the layout holds at all three viewports.**

Read first: spec 15, `../London/src/ui/Diagnostics.tsx` (dev-only pattern),
`../Conquest/src/ui/useUpdate.ts` (`pretendUpdate` query pattern),
`../London/scripts/packaged-eval.mjs`.

- [ ] 6.1 `src/dev/scenes.ts`: the five scenes of spec 15.1 as data (fixed SAN
      lists; `midgame` twenty moves, `mate` a scholar's-mate-length game or similar,
      `promotion` a position two moves from a promotion reached by a SAN list). A
      function `sceneFromLocation(search)` returning `{ scene, size, theme, side }`
      or null, tested as a string test.
- [ ] 6.2 `useDevScene()` in `src/dev/use-dev-scene.ts`: returns null unless
      `import.meta.env.DEV` and a scene is present; otherwise applies the settings
      and starts the game from the scene's moves, once. `App` calls it once. Confirm
      by reading the built bundle that no scene text survives `npm run build`.
- [ ] 6.3 `scripts/probes/layout.js`: the expression of spec 15.3. `scripts/
      packaged-eval.mjs` identical (used in phase 8).
- [ ] 6.4 The layout pass: every scene at the three viewports, both sizes, both
      themes. Fix what is wrong. Record the probe for each viewport and size in the
      notes. The two numbers of S16 hold everywhere.
- [ ] 6.5 Reuse review and commit.

**Done when:** the notes carry a screenshot list and the probe output for every
viewport and size, with no sideways scroll anywhere.

---

## Phase 7 - the iPad Home Screen app

**Goal: the built app installs to an iPad Home Screen and plays a move against the
engine with no internet.**

Read first: `../Conquest/vite.config.ts`, `src/ui/useUpdate.ts`, `UpdateBanner.tsx`,
`updates.ts` and `updates.test.ts`, `tools/make-icons.mjs`, `docs/conquest-deploy.md`,
spec 12.

- [ ] 7.1 `public/icon.svg`: a single knight (the cburnett knight outline is GPL
      and is fine here; or draw a plain one) in `#ece9e2` on `#16181c`, square.
      `tools/make-icons.mjs` adapted from Conquest's: reads the SVG, writes
      `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180), `favicon-32.png`.
      Run it and commit the output.
- [ ] 7.2 `vite.config.ts`: `VitePWA` with Conquest's settings and this app's
      manifest (spec 12.1), `globPatterns` including `wasm`,
      `maximumFileSizeToCacheInBytes: 12 * 1024 * 1024` (spec S11), `devOptions`
      off.
- [ ] 7.3 `src/ui/useUpdate.ts` and `UpdateBanner.tsx` from Conquest, `updates.ts`
      reduced to one notice: heading "A new version is ready", detail "Your game and
      settings are remembered, so loading it loses nothing.", button "Load it", plus
      "Not now". Test copied and reduced. `useUpdate` is called only when
      `!isDesktop()` (spec S12): wrap the banner in a component rendered only off
      the desktop, so the hook's rule of hooks is not broken.
- [ ] 7.4 Offline proof: `npm run build`, `npm run preview` on 5186, open it in the
      pane, then stop the server and reload. The page opens, a move is played and
      the engine replies. Record it. If the engine does not reply, S11 is the first
      thing to check.
- [ ] 7.5 `docs/simple-chess-deploy.md`: Conquest's deploy document adapted for
      project `simplechess`, repository `nick2468/SimpleChess`, domain
      `simplechess.datacrafter.net`, with the Home Screen and aeroplane-mode steps.
      These are Nick's steps; the document says so.
- [ ] 7.6 `README.md` updated with the two ways to run it.
- [ ] 7.7 Reuse review and commit. Tell Nick the site is ready to publish and which
      steps in the deploy document are his.
- [ ] 7.8 Nick: publish, add to the Home Screen, play a move in aeroplane mode.
      Record the date here.

**Done when:** 7.4 is proven here and 7.8 is proven by Nick.

---

## Phase 8 - the Windows app and the installer

**Goal: an installer that installs Simple Chess for the current user, opens the
window, and uninstalls cleanly. Version 1.0.0.**

Read first: `../London/src-tauri/` in full, `scripts/check-uninstall-hook.mjs`,
`scripts/packaged-eval.mjs`, `src/version.test.ts`, spec 11.

- [ ] 8.1 `src-tauri/`: `tauri.conf.json` (productName "Simple Chess", identifier
      `com.nick.simple-chess`, devUrl 5185, the window per spec 11.1 with
      `"create": false`, nsis `currentUser` with `installerHooks`, `csp: null` as the
      trainer), `Cargo.toml` (package `simple-chess`, lib `simple_chess_lib`),
      `build.rs`, `src/main.rs`, `src/lib.rs` identical but for `LOCAL_FOLDER`,
      `capabilities/default.json` per spec 11.4, `.gitignore`.
- [ ] 8.2 `installer-hooks.nsh` with one folder, and `scripts/check-uninstall-hook.
      mjs` adapted to one folder. Run the check: four cases, only the ticked
      non-upgrade case removes the scratch folder. Record the output.
- [ ] 8.3 Icons: `npx tauri icon public/icon.svg` (or the 512 PNG) into
      `src-tauri/icons/`.
- [ ] 8.4 `version.test.ts`: unskip the two Tauri tests. Set 1.0.0 in all three
      files.
- [ ] 8.5 `npx tauri build`. Record the installer's path and size. Start the built
      executable with the debug port and run the probe through `packaged-eval.mjs`;
      `--shot` the window. Save a game through the real dialog and load it back: the
      desktop half of phase 5.7.
- [ ] 8.6 Nick: run the installer, open the app, play a move, save and load a game,
      close and reopen to see the game remembered. Uninstall with the box ticked and
      confirm `%LOCALAPPDATA%\Simple Chess Data` is gone. Record the date here.
- [ ] 8.7 Acceptance walk: spec 17, item by item, each with what was done to check
      it, in `docs/acceptance.md`.
- [ ] 8.8 Reuse review, docs sweep (spec, plan, testing, deploy, README, CLAUDE.md
      current), commit.

**Done when:** spec 17 is green in `docs/acceptance.md`, with 7.8 and 8.6 dated by
Nick.

---

## The order, and why

Phases 1 and 2 put a playable game on screen as early as possible, because the
copied engine and session are the part most likely to hide a copy mistake, and a
game played in the pane finds it in minutes. The sidebar follows once there is a game
for its settings to act on. The bar, the hint and the picker are grouped because all
three touch the same provider and the same board. Files come next because they need
the finished game shape. Scenes and the probe are built after the screen is complete
so that they capture the real thing, and the two platform wrappers come last because
they touch only storage and build config (spec S13), which is the reason the trainer
did it that way too.

## Progress

| Phase | State |
|---|---|
| 0 - the scaffold | **Complete** 2026-09-11, gate passed the same day. 4 tests green, build clean. |
| 1 - the engine and the model | **Complete** 2026-09-11, gate passed the same day. 90 tests green in 1.8 s. |
| 2 - the board, the session and a playable game | Done 2026-09-12, awaiting review. 111 tests green, 2 skipped; a game plays in the pane. |
| 3 - the sidebar and what is remembered | Not started |
| 4 - the bar, the hint and the promotion picker | Not started |
| 5 - save game and load game | Not started |
| 6 - scenes, the probe and the layout pass | Not started |
| 7 - the iPad Home Screen app | Not started |
| 8 - the Windows app and the installer | Not started |

## Phase notes

Each phase appends its notes here as it closes: what was measured, what was decided
and why, what was asked of Nick and what he said, what the reuse review found, and
what is left. The orchestrator's review adds its gate findings under them.

### Phase 0 - builder notes (2026-09-11)

**Measured.**

- `npx vitest run`: 2 files, 4 tests passed and 2 skipped (the two Tauri version tests),
  1.6 seconds warm. The very first run after `npm install` took 25.4 seconds, 19.5 of
  them jsdom's environment start-up on a cold disk cache. Every run after it was under
  2 seconds. Worth knowing before reading a first-run time as a breach of the twenty
  second rule.
- `tsc -b` clean. `npx oxlint` reports nothing. `npm run build`: 18 modules,
  `dist/index.html` 1.26 kB, JavaScript 220.5 kB (68.9 kB gzipped), CSS 2.65 kB.
- `npm install`: 459 packages, 0 vulnerabilities. Vite resolved to 8.3.0 and vitest to
  4.1.11. npm warns that chessground 9.2.1 is deprecated ("no longer supported") and
  that glob 11.1.0 (transitive) is old. The trainer carries the same two warnings.
- `npm run engine` put `stockfish-18-lite-single.js` (21,429 bytes) and `.wasm`
  (7,295,411 bytes) in `public/engine/`. `git status` shows nothing under `public/`.
- The pane at 1280 by 1000. The served page read "Simple Chess v0.1.0", so it was this
  folder's code. Dark: `data-theme` dark, `simple-chess.theme` = dark, ground
  rgb(22, 24, 28), the version in rgb(122, 128, 138), which is `--text-faint`.
  After the toggle: `data-theme` light, `simple-chess.theme` = light, ground
  rgb(244, 242, 238), and the button reads "Dark" with the name "Switch to the dark
  theme". Pressed again, it goes back. `scrollWidth` 1280 against `innerWidth` 1280 in
  both themes. The pane's `localStorage` was cleared afterwards.
- Red first: `shell.dom.test.tsx` asserted `london-trainer.theme` first and failed with
  "expected null to be 'light'". Then it was fixed to `simple-chess.theme` and passed.
- Every copy diffed against its origin with the `Origin:` line removed. Identical:
  `scripts/copy-engine.mjs`, `src/index.css`, `src/globals.d.ts`,
  `src/test/dom-setup.ts`, `src/main.tsx`. Byte-identical, with no origin line because
  JSON has no header comment: the three `tsconfig*.json` and `.oxlintrc.json` (London),
  and `.vscode/extensions.json` and `settings.json` (Conquest). Adapted, each saying
  what changed: `vite.config.ts`, `src/ui/theme.ts`, `src/ui/app.css`,
  `src/ui/App.tsx`, `src/test/dom.tsx`, `src/version.test.ts`, `index.html` (an HTML
  comment), `docs/testing.md` (an origin paragraph).
- `git -C ../London status` and `git -C ../Conquest status` show only what was there
  before this phase began (`grep.exe.stackdump` in London, `tsconfig.tsbuildinfo` in
  Conquest). Nothing from this phase.

**Screenshots.** Both themes were screenshotted in the pane at 1280 by 1000 and looked
at: the name, the faint version beside it, and the toggle at the right behind the
trainer's rule. **There are no screenshot files.** The pane's screenshot tool hands the
image to the session and writes no file, so the chip's "two file names" cannot be met
from the pane. I tried headless Edge instead, driven over its DevTools port with the
trainer's `packaged-eval.mjs --shot` (run from `../London`, not changed). **Do not do
this on this machine.** Even with a fresh scratch profile, and again with
`--inprivate`, Edge signed the profile into Nick's Windows account, started syncing
("We are now syncing your browsing data across all your devices"), and loaded his
extensions, one of which opened a claude.ai sign-in page. Both instances were stopped
at once, both scratch profiles deleted, and the port confirmed closed. No screenshot
was kept from either. The orchestrator should rule how a phase leaves screenshot files,
if it must. `packaged-eval.mjs --shot` against the Tauri window in phase 8 is safe,
because that window has its own WebView2 profile.

**The icon links** in `index.html` point at files phase 7 makes. In development Vite
answers a missing file with `index.html` (`/favicon-32.png` came back as `text/html`),
so the pane console shows no 404 at all. The built site will 404 on them until phase 7.

**Decided (code shape).**

- The `Origin:` line is the first line inside the header comment. `main.tsx` has no
  header comment, so it gets `// Origin: ...` and a blank line, which is my reading of
  the chip's "two-line comment".
- `shell.dom.test.tsx` checks the version against `__APP_VERSION__`, not a fresh read of
  `package.json`. This departs from the chip (0.13) on purpose, and it is the reuse
  review's find. `version.test.ts` already holds `__APP_VERSION__` to `package.json`,
  so the two tests together prove the header shows the declared number. A third read of
  `package.json` would be a second copy of `version.test.ts`'s `read`, and that copy
  cannot be shared without breaking the identical-copy rule.
- `src/test/dom.tsx` has `renderApp` only, as the chip says. The plan's 0.11 also names
  `goTo`, but `goTo` opens a screen from a nav, and this app has one screen (S1). The
  plan's mention looks stale.
- `App.tsx`: the `nav` carries no `aria-label`. The trainer's says "Modes", which would
  be untrue here.

**Faults and contradictions, for the orchestrator.**

1. **A fault in the trainer, carried back:** `London/src/version.test.ts` imports
   `node:fs`, but `tsconfig.app.json` loads only `vite/client` types. It compiles in the
   trainer only because `src/storage/blank-start-real.test.ts` carries
   `/// <reference types="node" />`, which pulls node types into the whole program.
   Copied alone, `tsc -b` fails with TS2591. The fix here is the same triple-slash line
   at the top of `version.test.ts`. The trainer's `installer-hook.test.ts` has the same
   hidden dependency.
2. **`theme.ts` comment.** The chip says identical but for the key. Spec S3 and plan rule
   5 say an adapted file's comments describe this app, and the trainer's comment named
   its progress file and "the trainee" (spec 3 forbids the word). The spec wins: the
   comment was rewritten, and the origin line says so.
3. **`vite.config.ts` comments.** Besides the port comment, the projects comment drops
   "Nothing about them is migrating." and says "the trainer's `play-context.tsx`", per
   plan rule 5. The two projects themselves are exactly as written.
4. **Identical copies whose comments describe the trainer.** `version.test.ts` speaks of
   the trainer's phase 17 and "four places". `dom-setup.ts` speaks of "identity tests"
   and a "replayed move". Both were kept word for word, because the chip and S3 say
   identical. The orchestrator may prefer them adapted.
5. **A small tidy in `App.tsx`.** The trainer's toggle repeats one ternary for `title`
   and `aria-label`. Here it is one `switchTo` constant, and the wording is unchanged.

**Asked of Nick.** Nothing.

**Reuse review.** The version is read from `package.json` in `vite.config.ts` (the
define) and in `version.test.ts`, both trainer copies. The new test uses the constant
instead (above). No colour is written outside `index.css`: a search of `src/` for hex
and `rgb(` finds only that file. The toggle label's repeated ternary now has one home.
Nothing else.

**Left.** Nothing in phase 0. Open for the orchestrator: how screenshot files are made
(see above), and the stale `goTo` in 0.11.

### Gate 0 findings (orchestrator, 2026-09-11)

- **Verified from the repo, not from the notes.** `npx vitest run`: 4 passed, 2 skipped,
  1.5 seconds. `tsc -b` clean, `npx oxlint` silent, `npm run build` 18 modules with
  `dist/index.html`. Every file the notes call identical diffs clean against its origin
  with the `Origin:` line removed (`main.tsx` differs by the blank line after its
  comment, which is the two-line form the chip asked for). No em dashes under `src/`.
  `../London` and `../Conquest` carry nothing from this phase.
- **Mutation-checked.** Changing the storage key in `theme.ts` to `simple-chess.colour`
  turns "switches the theme, remembers it, and switches back" red with "expected null to
  be 'light'". Restored from git.
- **Driven in the pane at 1280 by 1000** against the dev server on 5185 serving v0.1.0:
  dark ground rgb(22, 24, 28), version at 12.8 px in `--text-faint`; after the toggle,
  light ground rgb(244, 242, 238), the button reading "Dark" named "Switch to the dark
  theme", `simple-chess.theme` = light; back again to dark. `scrollWidth` 1280 against
  `innerWidth` 1280 in both. Storage cleared afterwards.
- **The builder's two departures from the chip are right.** The shell test reading
  `__APP_VERSION__` rather than `package.json` is the reuse rule applied correctly:
  `version.test.ts` already holds that constant to the file. `theme.ts` with its comment
  rewritten is what S3 says an adapted file does; the chip's "identical but for the key"
  was the looser wording and the spec wins.
- **Two rulings on what the builder left open.** No screenshot files are required; rule 7
  above now says so. `goTo` was stale in 0.11 and is corrected.
- **One process finding, and it is the chip's fault, not the builder's.** The chip asked
  for "two file names" of screenshots, which the pane cannot produce, and the builder
  reached for headless Edge to satisfy it. Edge signed a scratch profile into Nick's
  Windows account and loaded his extensions before it was stopped. The builder stopped
  it, deleted both profiles, and recorded it under CLAUDE.md's standing hazards and in
  memory. Nothing was kept and nothing in the repo came from it. Nick should know that
  a sync was briefly started from a profile that no longer exists, in case his Microsoft
  account lists a device it should not. The rule from here: a chip never asks for a
  file the pane cannot write, and no session starts a headless browser on this machine.
- **Accepted as is.** `version.test.ts` keeps the trainer's comment about its phase 17
  although its origin line says adapted; `dom-setup.ts` keeps the trainer's comment
  because it is identical. Both are cosmetic and a later adaptation of either file
  takes its comment with it.
- **Carried back to the trainer (for Nick, not for this repo):** `London/src/version.test.ts`
  and `installer-hook.test.ts` compile only because `blank-start-real.test.ts` carries
  `/// <reference types="node" />`. Copied alone, `tsc -b` fails with TS2591. The fix is
  the same triple-slash line at the top of each.

- [x] **Review gate 0 passed** (2026-09-11)

### Phase 1 - builder notes (2026-09-11)

The chip said the session had been compacted. Nick said afterwards that it had not, so
phase 0 was still in context. The docs were re-read fresh anyway, as the chip asked.

**Measured.**

- `npx vitest run`: 9 files, 90 tests passed and 2 skipped, 1.7 seconds. By project:
  `string` 8 files, 88 passed, 2 skipped (the two Tauri version tests); `dom` 1 file,
  2 passed. `engine.test.ts` runs in `string`, and nothing in it starts a worker.
- `tsc -b` clean, `npx oxlint` silent, `npm run build` unchanged in shape (JavaScript
  220.5 kB, 68.9 kB gzipped). Nothing in `src/ui` imports the new modules yet, so the
  bundle does not carry them.
- **Mutation-checked `evalText`.** Dropping the side from the mate sign turns three
  tests red (M5 and -M5 with Black to move, and M0). Letting "-0.0" through turns four
  red. Both mutations were restored and the suite re-run green.
- `git -C ../London status` and `git -C ../Conquest status` show only the two files that
  were there before phase 0. Nothing from this phase.

**Copies, diffed against their origins with the `Origin:` line removed.**

- **Identical** (one origin line added): `src/engine/stockfish.ts`, `uci.ts`,
  `strength.ts`, `index.ts`, `engine.test.ts`; `src/model/position.ts`,
  `position.test.ts`, `chessjs.test.ts`, `pgn.ts`, `pgn.test.ts`;
  `src/play/outcome.ts`; `src/test/fake-engine.ts`. `index.ts`, `engine.test.ts` and
  `position.test.ts` have no header comment, so each gets `// Origin: ...` and a blank
  line. None needed the node types line: nothing copied this phase imports `node:fs`.
- **Adapted:** `src/model/types.ts` (cut to `Colour`, `Brush`, `Shape`, `colourName`;
  "authored" dropped from the `Shape` comment); `src/play/evalbar.ts` and
  `evalbar.test.ts`; `src/play/index.ts`.
- **New, from part of a trainer file:** `src/model/moves.ts` (`squaresForSan` and
  `sanForMove` from `grade.ts`, code identical) and `moves.test.ts` (the two describes
  from `grade.test.ts`, with the drill card's `fen` written out as a constant and the
  one test renamed as the chip says). `src/play/outcome.test.ts` is new.
- **The trainer's words in identical copies**, allowed by the chip and listed as asked:
  `uci.ts` ("trainee"), `outcome.ts` ("trainee", "course"), `pgn.ts` and `pgn.test.ts`
  ("repertoire", "course"). No adapted or new file says any of the three words.
- No React import and no `window`, `document` or `localStorage` in `src/engine`,
  `src/model` or `src/play`. The one browser global is `Worker` in `stockfish.ts`. No em
  dashes under `src/`.

**Decided (code shape).**

- `sanForMove`'s code is identical, but its comment is not. The trainer's says
  promotions become a queen "which is all this repertoire ever needs". `moves.ts` is an
  adapted file, so the comment now says the picker passes its letter. The origin line
  says so.
- `evalText` builds the cp text from `whitePovPawns`, so pawns are worked out in one
  place. It prints `Math.abs(pawns).toFixed(1)` with the sign added, so "-0.0" cannot
  appear.
- `shownEvaluation` takes `moves: { fen: string }[]`. Its comment says the session's
  played moves can be passed as they are, without naming `PlayedMove` before it exists.
- `outcome.test.ts` also tests `isCheckmateOutcome`, because the file keeps it.

**Faults and contradictions, for the orchestrator.**

1. **The plan's 1.4 and 1.5 box text is stale**, and the boxes were ticked against the
   chip and the spec. 1.4 says drop `isCheckmateOutcome` if unused, but the chip says
   keep it, and it is kept. 1.5 says the map value is `{ pawns, score }`, but spec 7 as
   corrected at gate 0 says `{ pawns, text }`, and that is what was built.
2. **Mate 0: the share and the text disagree, in theory.** `whitePovPawns` (trainer,
   identical) counts `mate 0` as a win for the side to move (`moves >= 0`). But mate 0
   means the side to move is already mated. `evalText` follows the chip and prints the
   other side's mate, so an `evaluationOf(mate 0)` would draw the bar one way and print
   the other. **It cannot happen in play.** Stockfish sends `mate 0` only for a
   finished position, with no `pv`, and `StockfishEngine.search` keeps only lines with a
   `pv`, so no candidate ever carries it. If the orchestrator wants the two to agree
   anyway, the fix belongs in the trainer's `whitePovPawns` (`moves > 0`). That would be
   carried back, not forked here.

**Asked of Nick.** Nothing.

**Reuse review.** `fen.split(' ')[1]` appears only in `sideToMove` (`position.ts`).
Pawns from a score are worked out only in `whitePovPawns` (`uci.ts`), and `evalText`
and `evaluationOf` both call it. `sanForMove` and `squaresForSan` exist once, in
`moves.ts`. Nothing to refactor.

**Dropped under the decision rules.** Nothing. The grade tests left behind (`judge`,
`ratingFor`, `countsAsCorrect`, the verdict wording) test drill grading, which was
never copied.

**Left.** Nothing in phase 1.

### Gate 1 findings (orchestrator, 2026-09-11)

- **Verified from the repo.** `npx vitest run`: 9 files, 90 passed, 2 skipped, 1.8
  seconds. `tsc -b` clean, `npx oxlint` silent, `npm run build` clean. All twelve
  files the notes call identical diff clean against their origins with the origin line
  removed; `engine/index.ts`, `engine.test.ts` and `position.test.ts` differ only by the
  blank line after their `//` origin comment, which is the two-line form. No React
  import and no `window`, `document` or `localStorage` under the three pure folders;
  `new Worker` in `stockfish.ts` is the one browser global. No em dashes. `../London`
  and `../Conquest` untouched.
- **Mutation-checked.** `toFixed(1)` to `toFixed(2)` in `evalText` turns eight of the
  number tests red. Restored from git. The builder's own two mutations (the mate sign
  and `-0.0`) are taken on its account, which names the failing tests.
- **The adapted files read as this app's.** `evalbar.ts` explains why the text is made
  where the side is known; `moves.ts` says the picker passes its letter; `types.ts` is
  the four things and nothing else. The new `outcome.test.ts` covers every sentence of
  spec 5.5 from a named position, including the fifty-move clock and the repetition.
- **Two stale plan boxes corrected** (1.4 and 1.5 above): the chip and the spec were
  right and the plan text lagged. The builder ticked them against the chip, which was
  the right call.
- **Mate 0 is accepted as the builder left it.** `whitePovPawns` (identical copy) reads
  `mate 0` as a win for the side to move; `evalText` reads it as the other side's mate.
  The builder showed it cannot reach the bar: the adapter keeps only candidates with a
  `pv`, and `mate 0` arrives without one. The right fix is `moves > 0` in the trainer's
  `whitePovPawns`, carried back rather than forked here, so the copy stays identical.
- **Carried back to the trainer (for Nick):** `London/src/engine/uci.ts`
  `whitePovPawns` treats `mate 0` as a win for the side to move; `moves > 0` is the
  correct test. Harmless there for the same reason.
- **The chip said the session was compacted and it had not been.** Nick told the
  builder so. No harm: re-reading the docs cost minutes and the notes say it was done.
  Later chips keep the instruction, because the compaction is Nick's call each time.

- [x] **Review gate 1 passed** (2026-09-11)

### Phase 2 - builder notes (2026-09-12)

The session was not compacted between phases 1 and 2. The docs named in the chip were
re-read fresh anyway.

**Measured.**

- `npx vitest run`: 12 files, 111 tests passed and 2 skipped, 3.7 seconds warm. By
  project: `string` 9 files, 99 passed, 2 skipped; `dom` 3 files, 12 passed. The first
  run after the new files took 27.7 seconds, nearly all jsdom's start-up on a cold cache,
  as in phase 0. Every run after it was under 4 seconds. `tsc -b` clean, `npx oxlint`
  silent, `npm run build` clean (JavaScript 298.7 kB, 95.1 kB gzipped; CSS 21.3 kB, now
  carrying chessground's three stylesheets).
- **The pane, 1280 by 1000, against the real engine** (the dev server on 5185, the header
  reading v0.1.0). The board opens with White at the bottom, the coordinates in their
  corners, "Your move" under the buttons, and no engine error. 1.d4 went in by two clicks
  (the pawn, then its square). The engine answered Nf6 in about 300 ms. Then 2.c4 Nc6
  3.Nf3 d5 4.e3 dxc4, every reply legal. A 10 ms recorder of the status line and of
  `window.__cg.state.movable.color` showed "Black is thinking..." with movable
  `undefined` during each of the four searches, and "Your move" with movable `white`
  after each reply. `window.__game.moves.length` was 2, 4, 6 and 8. Undo took off
  4.e3 dxc4 and enabled Redo. Redo put both back and disabled it again. New game emptied
  the list and disabled Undo and Redo. Hint stayed disabled throughout.
- **The layout, dark and light alike.** `.live-eval` is 24 wide at x 24. `.board` and
  `cg-board` start at x 68 (24 padding + 24 bar + 20 gap). All three run from top 80.67
  to bottom 496.67, height 416. `.play-controls` and `.play-status` start at x 68, the
  board's left edge. `.sidebar` is 280 wide at x 508 (484 + the 24 gap), and as tall as
  `.play-column` (501.33). `scrollWidth` 1280 against `innerWidth` 1280.
- **Seen in the screenshots.** Dark: the dark ground, the empty bar as a dark box the
  board's height, the brown board, and the move list in the sidebar with faint numbers.
  Light: the pale ground, the bar still in `--piece-black`, the board unchanged, and the
  buttons as white controls. The last move is highlighted in both.
- **Checkmate in the pane: not reached.** The real engine at level 4 defended scholar's
  mate (1.e4 Nf6 2.Qh5 Nxh5 3.Bc4 Nf6, taking the queen). The mate path, with the
  outcome sentence and the locked board, is proven by the DOM test with a scripted
  engine. The chip's pane drive asks for d4 and three more moves, which was done. Plan
  box 2.10's "a game to checkmate" is looser than the chip, like 1.4 and 1.5 were.
- `git -C ../London status` and `git -C ../Conquest status` show only the two files that
  were there before phase 0.

**Two faults the pane found, both fixed.**

1. **StrictMode killed the engine under the first game.** In development StrictMode
   runs every effect's cleanup once between two mounts. The game now starts in
   `Shell`'s mount effect, and the provider's unmount cleanup stopped the engine and
   nulled `engineRef` while `start` was still awaiting it. The first game failed with
   "Cannot read properties of null (reading 'newGame')", so the dev page would never have
   shown a board. The trainer never met this, because its games start from a button.
   The new DOM test "keeps its engine through StrictMode's second mount" was run red
   against the chip's cleanup, with exactly that message. The fix: the cleanup waits a
   tick and stops the worker only if nothing mounted again. "stops the engine when the
   app goes away" proves the real unmount still stops it. Spec S5 stands.
2. **A long move list stretched the sidebar instead of scrolling.** With 40 rows added
   to the list in the pane, the sidebar grew to 928 px beside a 501 px board column. A
   flex column's content still sizes it through `flex: 1; min-height: 0`. The fix is
   `contain: size` on `.move-list`. Re-measured: the sidebar stays 501.33, and the list
   scrolls (501 visible of 928) with `scrollIntoView` reaching the last row. The added
   rows were removed afterwards.

**Also changed from the chip, on purpose.**

- **The status line is indented to the buttons.** Spec 4.1's diagram puts "Your move"
  under the buttons, and the trainer's `.play-status` had no margin because its status
  sat in a header. The 44 now has one home, `--board-inset` on `.play-column`, used by
  the buttons, the status line and an engine error.
- **New game calls `start`, not `reset`.** Spec 5.1 says New game starts a fresh game
  from the current settings. `Shell` passes a `newGame` callback (level from the game,
  side `FIRST_SIDE`), so the settings stay in one place for phase 3 to replace. `reset`
  exists as the chip asks and nothing calls it yet.
- **Session test 5 plays fool's mate** with the scripted engine rather than replaying it
  through `startMoves`. Replayed moves are the floor, so undo could not take them off,
  and the chip's recipe contradicts its own test 6. The behaviour tested is the one the
  chip names.
- **`src/play/hint.ts` holds the `Hint` type only**, source `'engine'`, because the
  provider's `hint` field needs a type now. Phase 4 adds `engineHint` there.
- **An engine that fails before the first game** shows its message on its own, because
  with no session there is no status line to carry it (`EngineError`, shared with
  `StatusLine`).
- **`usePlay` carries the lint disable comment the trainer puts on `PlayContext`.**
  `oxlint`'s `only-export-components` warned on the hook export.
- **A promoting pawn move auto-queens this phase**, through `sanForMove`'s default. Phase
  4 brings the picker.

**Copies, diffed against their origins with the `Origin:` line removed.**

- **Identical:** `src/ui/Board.tsx`, `src/ui/board.css` (its origin line is a comment of
  its own above the first, because that comment starts with text on line 1),
  `src/test/board-stub.tsx`, `src/ui/rig.dom.test.tsx`, and `squaresOf` inside
  `Screen.tsx`.
- **Adapted:** `board-size.ts`, `session.ts` (with `PlayedMove` and `fullMove` from
  `report.ts`), `play-context.tsx`, `play.css`, `App.tsx`, `src/test/dom.tsx`,
  `play-game.dom.test.tsx`, `hint.ts`, `src/play/index.ts`; and from `Play.tsx`:
  `PlayControls.tsx`, `MoveList.tsx`, `StatusLine.tsx`.
- **New:** `Screen.tsx`, `session.test.ts`, `src/test/scripted-engine.ts`.
  `shell.dom.test.tsx` gained the board mock, because `Shell` now mounts a board.
- The trainer's words appear only in identical copies: `board.css` ("a Black course"),
  plus phase 1's `uci.ts`, `outcome.ts`, `pgn.ts` and `pgn.test.ts`. No adapted or new
  file says "trainee", "student", "repertoire", "course" or "book".

**Asked of Nick.** Nothing.

**Reuse review.** One `squaresOf` (`Screen.tsx`) over the one `squaresForSan`. The
side-from-FEN split exists only in `sideToMove`. No pixel number or colour is written in
a `.ts` or `.tsx` file. The 44 px inset was about to be written three times and got one
home instead. The engine error's markup is one component, used by the screen and the
status line. The provider's "may the user move" guard is the session's own
(`playUser` checks the turn; the provider checks `thinking` and `isFinished`), and
`Screen`'s board lock reads the same two, as the trainer's does. Nothing else.

**Left.** Nothing in phase 2. For the orchestrator: New game is always enabled, as the
chip says. If it is pressed while the engine thinks, the running `play` can still land
its reply on the discarded session and clear `thinking` while the new `start` is
running. Nothing shows it at level 4's 200 ms. If it matters, the fix is a disabled New
game while thinking, which is a ruling for Nick because a person would see it.
