# Simple Chess - build plan

Version 1. Written 2026-09-11. Status: **Active**. Phases 0 and 1 passed review
2026-09-11, phases 2 to 7 on 2026-09-12, with box 7.8 left for Nick; phase 8 is
next and last.

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
- [x] 2.10 Drive it in the pane against the real engine: several moves at level 4 as
      White, Undo, Redo, New game. The outcome sentence and the locked board are
      proved by the DOM test with the scripted engine, because a level 4 engine does
      not allow itself to be mated on demand (corrected at gate 2; the box first said
      "a game to checkmate"). Screenshot at 1280 by 1000 in both themes. Record the
      probe (the placeholder bar, `.board` and `cg-board` all 416 and ending on the
      same pixel).
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

- [x] 3.1 `src/storage/prefs.ts`: the trainer's `read`, `write`, `readOneOf`,
      `useRemembered` (identical text, origin line), and three hooks: `useLevel`
      (1 to 8, default 4), `useSide` (`white`/`black`), `useBoardSize`
      (`small`/`large`), with the keys of spec 10. Called once, in `App`, and handed
      down, for the reason the trainer gives on `useDrillScope`.
- [x] 3.2 `src/storage/current-game.ts`: `rememberGame({ sans, side, level })`,
      `recallGame()` returning the record or null, `forgetGame()`. Every field is
      checked on the way back, as Conquest's `recallSetup` checks its record: a
      version other than 1, a non-array, a side or level out of range, all give null.
      String tests, including a scrambled record.
- [x] 3.3 The provider writes the game after every move, undo, redo and start; a
      fresh game with no moves removes the record. On mount `App` recalls the game:
      if it replays legally (`canReplayMoves`, copied from the trainer's
      `play-on.ts` as one function in `src/play/replay.ts` with an origin line), the
      game starts from it with its side and level and those become the settings;
      otherwise a fresh game.
- [x] 3.4 `src/ui/Sidebar.tsx`: three fieldsets in the trainer's `.play fieldset`
      style. "Difficulty": the select from the trainer's "How strong" with
      `levelName`, the level's `detail` under it and the engine-scale sentence.
      "Play as": two radios, White and Black, with one hint line: "Applies to the
      next new game." "Board": two radios, Small and Large. Under them the Save game
      and Load game buttons side by side (wired in phase 5, disabled until then).
      Then the move list.
- [x] 3.5 Level changes call the provider's `setLevel` (spec S6). Side changes are
      read by the next New game. Board size changes re-render at once.
- [x] 3.6 Play as Black: New game starts the engine first (`!studentToMove` in the
      trainer's `start`), the board is oriented black. DOM test per spec S15 item 9.
- [x] 3.7 The fit rule (spec S2) in `board-size.ts`: `fitBoardSize(wanted,
      viewportWidth, viewportHeight)` returning the largest multiple of 8 not above
      `wanted` that fits the width less padding, bar and gap, and the height less
      header, padding, buttons and status. The numbers it subtracts are named
      constants beside the layout numbers they come from. String test per spec S15
      item 11. A hook `useBoardPixels(size)` reads the viewport, re-measures on
      resize and orientation change, and returns the pixels; the small size is
      always 416.
- [x] 3.8 The narrow layout (spec 4.3): below 900 px the sidebar goes under the
      board column at full width and the move list shows ten rows. Safe-area padding
      on `.app` as Conquest's `.board-page`. Buttons at least 36 px tall.
- [x] 3.9 DOM tests: every setting remembered across a remount (spec S15 item 8);
      the game reopens after a remount and a scrambled stored game is discarded
      (item 7).
- [x] 3.10 Drive in the pane: change level mid-game and confirm through
      `window.__game` (the trainer's dev handle, kept) that the session's profile
      changed before the engine's next move. Screenshots at the three viewports of
      spec 15.2, both sizes, both themes. Record the probe at each: no sideways
      scroll; on 1180 by 820 the large board is a multiple of 8 below 832.
- [x] 3.11 Reuse review and commit.

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

- [x] 4.1 The provider's `evaluate`, copied: analysis profile, 150 ms, restore in
      `finally`, the map keyed by `positionKey`, a known position not searched
      again. The map value is `{ pawns, score }` (phase 1.5). `play` calls it before
      and after the engine's reply, as the trainer does.
- [x] 4.2 `src/ui/EvalBar.tsx`: the trainer's `LiveEvalBar` with the number (spec
      S7). The number is a `<span class="live-eval-number">` placed at the outer end
      of the larger share: `top: 2px` when the larger share is at the top, else
      `bottom: 2px`; colour the other piece colour; 10 px bold, tabular figures. The
      accessible name is "Evaluation: +0.4", or "Evaluation: the engine has not
      looked yet" before the first value. CSS in `play.css`.
- [x] 4.3 `src/play/hint.ts`: `engineHint(san)` returning `{ san, text: "The engine
      suggests Nf3.", source: 'engine' }`. The provider's `askHint`: the trainer's
      engine half only (500 ms at the analysis profile, restore in `finally`), clears
      on the next move, undo, redo, New game and Load game. The arrow is the
      trainer's `hintShapes` in blue. The sentence renders under the status line in
      the trainer's `.hint-said.engine` style.
- [x] 4.4 `src/ui/PromotionPicker.tsx` (spec 5.3). The board's `onMove` checks
      `isPromotion`; when true it does NOT play, it stores the pending move and shows
      the picker over the board: four buttons, each a `piece` element of the
      chessground piece set (`cburnett`) in the promoting colour, laid over the
      destination file. Choosing calls `play(from, to, piece)`. Clicking outside, or
      Escape, cancels: the board is re-set to the session's `fen` so the pawn goes
      back. `sanForMove` already takes the promotion letter.
- [x] 4.5 DOM tests: the promotion is not played until chosen and cancel puts the
      pawn back (spec S15 item 2; the stub gets one button per legal move including
      promotions, so the test clicks `move e8=Q`-style buttons through the same
      `onMove` seam with the promotion letter passed); Hint draws `bluee2e4`-style
      shapes and says the sentence, is disabled while thinking and when the game is
      over; New game clears the hint (item 10, complete).
- [x] 4.6 Drive in the pane: a game where the bar visibly moves, one hint, one
      promotion each way (chosen and cancelled), and a mate in the bar's number
      (`M1` or similar). Screenshots of the bar at both sizes and both themes, and
      the picker open. Record the probe: bar, board and `cg-board` heights equal.
- [x] 4.7 Reuse review and commit.

**Done when:** the bar reads right after every move and the picker works both ways.

---

## Phase 5 - save game and load game

**Goal: a game leaves the app as a PGN file and comes back the same, on both
platforms.**

Read first: `../London/src/play/game-pgn.ts` and its test, `src/model/pgn.ts`
(`parsePgn`, `Movetext`, `pgnTag`), `src/ui/backup.ts`, `src/ui/bundles.ts`,
`src/storage/paths.ts` (`isDesktop`), `src/play/session.ts` (the constructor's
`startMoves` replay).

- [x] 5.1 `src/play/game-pgn.ts` adapted per spec 9.1: `gameToPgn({ moves, side,
      level, outcome, at })`; the seven tags; one closing comment; the result token.
      `pgnDate` and `pgnResult` identical. `saveFileName(at)` giving
      `simple-chess-YYYY-MM-DD-HHMM.pgn`. String tests on the exact text.
- [x] 5.2 `src/play/load-pgn.ts`: `loadPgn(text)` returning `{ sans, side, level? }`
      or `{ error }`. Uses `parsePgn`, takes `games[0].moves` main line SANs, replays
      them with chess.js, reads `White`/`Black` for "You" and "Stockfish level N".
      Tests: the round trip (spec S15 item 5); a foreign PGN with variations and
      comments loads its main line as White (item 6); an illegal file gives an
      error; a file with no games gives an error.
- [x] 5.3 `src/storage/paths.ts`: `isDesktop` only. (`LOCAL_FOLDER` waits for
      phase 8, which is the first thing that needs it; the phase 5 chip ruled it
      out of this phase and gate 2 ruled that unused code goes.)
      `src/storage/files.ts`: `savePgn(text, name)` and `openPgn()` in the
      trainer's `backup.ts` shape: Tauri dialogs and fs on the desktop, a blob
      download and a hidden file input in the browser. `openPgn` in the browser
      resolves when the input changes; cancel resolves null.
- [x] 5.4 Loading goes through `start` with `startMoves`, the same path the
      remembered game uses, so the side and level become the settings and the engine
      moves if it is to move. No `scanGame` (ruled at gate 4): undo and redo evaluate
      the position they land on when it has no number yet, at 150 ms each, which
      covers loaded and reopened games alike without holding the engine's queue.
      Errors go to a notice under the status line and leave the current game alone.
      (The box first asked for the trainer's full scan; spec 9.2 is amended.)
- [x] 5.5 Wire the two buttons: disabled while thinking; Save says nothing on
      success on the desktop beyond the dialog closing, and "Saved to your downloads
      folder" in the status line in the browser, for three seconds, the trainer's
      `CopyGame` timing.
- [x] 5.6 DOM tests: Save produces the spec 9.1 text for a played game (intercept
      the blob path through an injected `savePgn`); Load through an injected
      `openPgn` restores moves, side and level; a bad file leaves the game untouched
      and says why.
- [x] 5.7 Drive in the pane: save a game (the browser path), open the file in an
      editor and check the text against spec 9.1, load it back. The desktop path is
      driven in phase 8.
- [x] 5.8 Reuse review and commit.

**Done when:** save, load and the foreign-file case all pass and the file reads as the
spec shows.

---

## Phase 6 - scenes, the probe and the layout pass

**Goal: every screenshot of spec 15 can be set up from the address bar, the probe
exists, and the layout holds at all three viewports.**

Read first: spec 15, `../London/src/ui/Diagnostics.tsx` (dev-only pattern),
`../Conquest/src/ui/useUpdate.ts` (`pretendUpdate` query pattern),
`../London/scripts/packaged-eval.mjs`.

- [x] 6.1 `src/dev/scenes.ts`: the five scenes of spec 15.1 as data (fixed SAN
      lists; `midgame` twenty moves, `mate` a scholar's-mate-length game or similar,
      `promotion` a position two moves from a promotion reached by a SAN list). A
      function `sceneFromLocation(search)` returning `{ scene, size, theme, side }`
      or null, tested as a string test.
- [x] 6.2 `useDevScene()` in `src/dev/use-dev-scene.ts`: returns null unless
      `import.meta.env.DEV` and a scene is present; otherwise applies the settings
      and starts the game from the scene's moves, once. `App` calls it once. Confirm
      by reading the built bundle that no scene text survives `npm run build`.
      (It is `Shell` that calls it, not `App`, and it returns the scene's hint flag
      rather than the whole request; both reasons are in the notes. The scene does
      not start the game: it writes storage and the ordinary start path finds it.)
- [x] 6.3 `scripts/probes/layout.js`: the expression of spec 15.3. `scripts/
      packaged-eval.mjs` identical (used in phase 8).
- [x] 6.4 The layout pass: every scene at the three viewports, both sizes, both
      themes. Fix what is wrong. Record the probe for each viewport and size in the
      notes. The two numbers of S16 hold everywhere. (One fault found and fixed: the
      move list scrolled the whole screen, not itself.)
- [x] 6.5 Reuse review and commit.

**Done when:** the notes carry a screenshot list and the probe output for every
viewport and size, with no sideways scroll anywhere.

---

## Phase 7 - the iPad Home Screen app

**Goal: the built app installs to an iPad Home Screen and plays a move against the
engine with no internet.**

Read first: `../Conquest/vite.config.ts`, `src/ui/useUpdate.ts`, `UpdateBanner.tsx`,
`updates.ts` and `updates.test.ts`, `tools/make-icons.mjs`, `docs/conquest-deploy.md`,
spec 12.

- [x] 7.1 `public/icon.svg`: a single knight (the cburnett knight outline is GPL
      and is fine here; or draw a plain one) in `#ece9e2` on `#16181c`, square.
      `tools/make-icons.mjs` adapted from Conquest's: reads the SVG, writes
      `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180), `favicon-32.png`.
      Run it and commit the output. (The cburnett knight's two body paths, filled
      and stroked in one colour. The rounded version is a clip over the committed
      square drawing rather than a second drawing of it.)
- [x] 7.2 `vite.config.ts`: `VitePWA` with Conquest's settings and this app's
      manifest (spec 12.1), `globPatterns` including `wasm`,
      `maximumFileSizeToCacheInBytes: 12 * 1024 * 1024` (spec S11), `devOptions`
      off.
- [x] 7.3 `src/ui/useUpdate.ts` and `UpdateBanner.tsx` from Conquest, `updates.ts`
      reduced to one notice: heading "A new version is ready", detail "Your game and
      settings are remembered, so loading it loses nothing.", button "Load it", plus
      "Not now". Test copied and reduced. `useUpdate` is called only when
      `!isDesktop()` (spec S12): wrap the banner in a component rendered only off
      the desktop, so the hook's rule of hooks is not broken. (`UpdateWatch.tsx` is
      that component.)
- [x] 7.4 Offline proof: `npm run build`, `npm run preview` on 5186, open it in the
      pane, then stop the server and reload. The page opens, a move is played and
      the engine replies. Record it. If the engine does not reply, S11 is the first
      thing to check. (Proved: 2. d4 e5 played with the server stopped, and a fetch
      of anything unstored refused.)
- [x] 7.5 `docs/simple-chess-deploy.md`: Conquest's deploy document adapted for
      project `simplechess`, repository `nick2468/SimpleChess`, domain
      `simplechess.datacrafter.net`, with the Home Screen and aeroplane-mode steps.
      These are Nick's steps; the document says so.
- [x] 7.6 `README.md` updated with the two ways to run it.
- [x] 7.7 Reuse review and commit. Tell Nick the site is ready to publish and which
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
| 2 - the board, the session and a playable game | **Complete** 2026-09-12, gate passed the same day. 111 tests green; a game plays in the pane. |
| 3 - the sidebar and what is remembered | **Complete** 2026-09-12, gate passed the same day. 162 tests green; the settings and the game survive a reload; the large board is whatever fits and draws whole squares (808, 624 and 728 at scale 1; 800, 624 and 720 at 1.5). |
| 4 - the bar, the hint and the promotion picker | **Complete** 2026-09-12, gate passed the same day. 183 tests green; the bar carries the engine's number, Hint draws and says a move, a pawn on the last rank asks which piece. |
| 5 - save game and load game | **Complete** 2026-09-12, gate passed the same day. 222 tests green. A game saves as the PGN of spec 9.1 and loads back with its moves, side and level; undo goes back through a game that arrived whole and fetches the numbers as it goes. |
| 6 - scenes, the probe and the layout pass | **Complete** 2026-09-12, gate passed the same day. 243 tests green. The five scenes open from the address bar and none survives the build; the probe holds S16's two numbers in all twelve rows; the move list no longer scrolls the board off the screen. |
| 7 - the iPad Home Screen app | **Complete** 2026-09-12, gate passed the same day; box 7.8 is Nick's. 250 tests green. The built app has an icon and a manifest, opens with the server stopped and answers a move, and offers a new version in a bar that says it costs nothing. |
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

### Gate 2 findings (orchestrator, 2026-09-12)

- **Verified from the repo.** `npx vitest run`: 12 files, 111 passed, 2 skipped, 12.4
  seconds on a cold cache (the builder's 3.7 warm), under the twenty-second rule.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean at 298.7 kB. `Board.tsx`,
  `board.css`, `board-stub.tsx` and `rig.dom.test.tsx` diff clean against the trainer.
  No forbidden words outside identical copies; no browser global in the pure folders;
  no pixel number or colour in any `.ts` or `.tsx`. `../London` and `../Conquest`
  untouched.
- **Mutation-checked.** Pointing `undoTarget` at the engine's colour instead of the
  user's turns three session tests red (the pair, the redo, the undo out of mate).
  Restored from git.
- **Driven in the pane at 1280 by 1000 against the real engine**, header v0.1.0. The
  probe read the builder's numbers to the decimal: bar 24 wide at x 24; `.board` and
  `cg-board` at x 68, all three from 80.67 to 496.67, height 416; controls and status at
  x 68; sidebar 280 wide at x 508, 501.33 tall like the column; `scrollWidth` 1280
  against `innerWidth` 1280. 1.e4 by two clicks, the engine answered d5, the list read
  "1. e4 d5", Undo emptied it and enabled Redo, Redo put both back, New game emptied it
  and disabled both. No console errors at any point. Storage cleared afterwards.
- **The two faults the pane found were real and the fixes are sound.** The StrictMode
  cleanup now waits a tick and a test holds both halves (the engine survives the second
  mount; a real unmount still stops it). `contain: size` is the right tool for a flex
  child that must scroll rather than grow, and the comment says what was measured.
  Both are the kind of finding the pane drive exists for.
- **The builder's departures are accepted.** New game calling `start` rather than
  `reset` is what spec 5.1 says; the 44 px inset with one home is the reuse rule
  applied; fool's mate through the scripted engine is the test the chip meant.
- **Two rulings, taken into phase 3.** (1) **New game is disabled while the engine
  thinks**, like Undo, Redo and Hint. The builder's "left" item is a real race, and a
  row where three buttons grey during a think and one does not is the odder screen.
  A person notices a 600 ms grey at level 8 less than a move that vanishes. (2)
  **`reset` goes if phase 3 does not use it.** Nothing calls it; a function kept for a
  caller that may never come is the dead code the brief forbids.
- **Plan box 2.10 asked for a checkmate in the pane**, which a level 4 engine will not
  allow. The DOM test with the scripted engine proves the mate path; the pane proves
  the live engine and the layout. The box text is corrected below.
- **For phase 4, noted now:** `scriptedEngine` answers every search from its queue, so
  the bar's evaluation searches in phase 4 would eat the script. The phase 4 chip has
  to make the script answer only the engine's own moves (by side to move) or key
  the fake by profile. Not a phase 2 fault.

- [x] **Review gate 2 passed** (2026-09-12)

### Phase 3 - builder notes (2026-09-12)

The session was compacted between phases 2 and 3. Every document the chip named was
read fresh before anything was touched.

**Measured.**

- `npx vitest run`: 17 files, 155 tests passed and 2 skipped, 4.2 seconds warm. By
  project: `string` 13 files, 133 passed, 2 skipped (the two Tauri version tests);
  `dom` 4 files, 22 passed. `tsc -b` clean, `npx oxlint` silent, `npm run build`
  clean (JavaScript 302.55 kB, 96.33 kB gzipped; CSS 22.24 kB, 6.31 kB gzipped).
- **Red first.** The New game guard was shown red before it landed: with
  `disabled={thinking}` taken off the button, "says who is thinking and then Your
  move" fails with "expected false to be true". Restored, and green.
- **1280 by 1000, small board, dark.** `.live-eval` 24 wide at x 24. `.board` and
  `cg-board` at x 68. All three run 80.67 to 496.67, height 416. `.play-controls`
  and `.play-status` at x 68. `.sidebar` 280 wide at x 508. The move list is 232,
  which is its ten-row floor. `scrollWidth` 1280 against `innerWidth` 1280.
- **1280 by 1000, large board.** Bar, `.board` and `cg-board` all 808, running 81 to
  889, the bar at x 24 and the board at x 68. The board box ends on the same pixel as
  `cg-board` and as the bar (both differences 0). Controls 38 tall and the status 24,
  both x 68 and 808 wide. `.sidebar` 280 at x 900, 894 tall, the same as
  `.play-column`. The move list is 405. `scrollWidth` 1280 against 1280.
- **1180 by 820, large board: 624**, which is the height running out first (820 less
  191 of chrome leaves 629). Bar 624, both differences 0. The column is 668 wide at
  x 24 and the sidebar 280 at x 716. `scrollWidth` 1180 against 1180.
- **820 by 1180, upright, large board: 728**, which is the width running out first.
  Bar, board and `cg-board` all 728, running 81 to 809, both differences 0. The
  sidebar is UNDER the column, at x 24, 757 wide, which is the full width less the
  48 of padding and the scrollbar. The move list is exactly 232, its ten rows.
  `scrollWidth` 805 against `innerWidth` 820, so no sideways scroll; the page scrolls
  down, which spec 4.3 allows.
- **Both themes.** Dark ground rgb(22, 24, 28), light rgb(244, 242, 238), and the
  toggle writes `simple-chess.theme`. The layout numbers are the same in both.
- **A level changed in the middle of a game reaches the engine.** With two moves
  played, choosing "6. Strong club" put the session on level 6, 300 ms, Elo 1750
  BEFORE the next move was asked for, wrote `simple-chess.level` as 6, and rewrote
  the remembered game at level 6. The engine's next reply was played at it.
- **New game greys while the engine thinks** (gate 2's first ruling), seen live: a
  10 ms recorder caught "Black is thinking... | New game disabled=true | movable=
  undefined" and then "Your move | New game disabled=false | movable=white".
- **Play as Black.** Choosing Black changed nothing about the game already on the
  board: still White at the bottom, still four moves, and `simple-chess.side` written
  as black. New game then had the engine open with g3, the board oriented black, the
  user movable as black, and the record stored with side black.
- **Everything survives a reload.** After one, the game came back as g3 with the user
  on Black, the select reading 6, the board large and the position as it was left.
- `git -C ../London status` and `git -C ../Conquest status` show only the two files
  that were there before phase 0.

**Three faults the pane found. Two fixed, one for Nick.**

1. **The move list was ZERO pixels tall, so the moves vanished when the sidebar
   arrived.** The three fieldsets and the two file buttons come to 507px beside a
   501px board column, so `flex: 1` had nothing left to hand the list. The list now
   has a floor of ten rows, which is the same ten the narrow layout shows, held in one
   custom property so the two cannot drift. Worth recording HOW this was nearly
   missed: the floor was written once and had no effect, because the rule then carried
   `min-height` twice and phase 2's `min-height: 0` won by being later. That zero was
   the ordinary guard for a flex item, and `contain: size` had already made it
   pointless. A stylesheet sweep for repeated declarations in one rule now finds
   nothing in either file.
2. **Chessground never re-measured when the board grew.** Switching to Large gave an
   808 box with a 416 board still drawn inside it and the bar running 392px past the
   last square. `Board.tsx` observes its host with a `ResizeObserver`, and that did not
   fire for a size the app set itself. The size now gets its own effect, because React
   has written the new inline style by the time an effect runs. Verified on the case
   that failed: 416 on load, then 808 live with no reload, both ending on the same
   pixel as the bar. The trainer cannot meet this at all, because all three of its
   boards are a constant size, which is why the copied file had no answer to it.
   `Board.tsx` is therefore ADAPTED now and no longer identical.
3. **At a display scale of 1.5 the large board cannot obey spec S2 and spec S16 at
   once. This one is Nick's.** 808 divides by 8 in CSS pixels, which is what S2 asks.
   It does not divide by 8 in DEVICE pixels: 808 times 1.5 is 1212, and 1212 over 8 is
   151.5, so chessground floors each square to 151 device pixels and draws a board of
   805.33. The bar is stretched to the 808 box, so it ends 2.67px below the board, and
   S16 says the two must end on the same pixel. Seen twice, at `devicePixelRatio` 1.5;
   at 1 the same 808 is exact. The small board is exact at every scale this app is
   used at, which is why nothing showed before now: 416 times 1.25, 1.5 and 2.0 over 8
   gives 65, 78 and 104, all whole. The fix would be to round the fit rule down to a
   size whose squares are whole device pixels, which means passing
   `devicePixelRatio` in. It would change numbers Nick has already been given: at a
   scale of 1.5 the large board becomes 800 rather than 808 at 1280 by 1000, and 720
   rather than 728 upright. That is a person-visible change to a decision recorded at
   gate 2, so it is recorded here rather than taken.

**What the pane could not do, for whoever drives it next.**

- **Synthetic input does not reach chessground.** Neither the pane's own clicks nor
  PointerEvents dispatched in the page moved a piece: `selected` stayed unset while
  `movableColor` was white and `d2` had its two destinations. The moves in this drive
  were played through the board's own move seam, the `movable.events.after` that
  `Board.tsx` hands chessground, which is the same seam the DOM tests drive and the
  same one a real click ends at. Everything above that seam is the code that ships.
  Phase 2's notes say a move went in "by two clicks"; that did not reproduce here.
- **Resizing the pane fires no `resize` event in the page.** `innerWidth` and
  `innerHeight` change, but nothing tells the app, so the board kept its old size
  until an event was dispatched by hand, and then it was right at once.
  `useBoardPixels` is correct; a real window and a real iPad rotation both fire it.
- **A hidden pane clamps `setTimeout` to about a second and never runs
  `requestAnimationFrame`.** Two scripts were killed at the 45 second limit because of
  it. A killed script has still RUN: one of them left an inline style behind from a
  size sweep, and the next measurement read it as if it were the app's own. Keep pane
  scripts short, and re-read from a fresh load after one dies.

**Decided (code shape).**

- `useRemembered` returns two things, not the trainer's three. The third, `show`,
  displays a resumed game's strength without remembering it. This app has no such
  case: the remembered game and phase 5's loaded file both BECOME the settings (plan
  3.3, spec 9.2). Kept, it would be exactly the dead code gate 2 ruled against.
- `Sidebar` takes no `thinking` prop, though the chip lists one. Nothing in the
  sidebar uses it this phase: the file buttons are disabled outright until phase 5,
  and spec S6 wants the level select live while the engine thinks. Phase 5 adds the
  prop with the buttons it belongs to.
- The six settings fields travel as one `SettingsProps` object, declared once, so
  `Shell`, `Screen` and `Sidebar` cannot drift about what a setting is.
- `fitBoardSize` takes a fourth argument, `narrow`, which plan box 3.7 does not name.
  It has to: the sidebar is beside the board or under it, and the width left differs
  by 304px, so the rule cannot answer without knowing which layout it is in.
- The fieldsets carry no bottom margin. The sidebar is a flex column with a 12px gap,
  and the trainer's 16px on top of that read as the settings drifting apart.
- `reset` is gone (gate 2's second ruling). Nothing called it, and this phase found no
  use for it: New game starts a fresh game rather than putting one away.

**Copies.**

- **Adapted from identical this phase:** `src/ui/Board.tsx` (the size effect) and
  `src/test/board-stub.tsx` (`data-orientation`). Both origin lines say so. Spec
  13.2's table still calls `Board.tsx` "London, identical", which is now stale, for
  the orchestrator to correct.
- **New, from the trainer:** `src/storage/prefs.ts` (`read`, `write`, `readOneOf` and
  `useRemembered`, their text unchanged) and `src/play/replay.ts` (`canReplayMoves`,
  its comment reworded to a stored game and the moves readonly).
- **New, from Conquest:** `src/storage/current-game.ts`, which is `recallSetup`'s rule
  applied to a game: every field checked, anything else discarded in silence.
- No new or adapted file says "trainee", "student", "repertoire", "course" or "book".
  No em dashes under `src/`.

**Asked of Nick.** One question, fault 3 above: at a display scale of 1.5 the large
board can divide by 8 or it can end where the bar ends, and not both. The small board
is unaffected at every scale. Nothing else needed a ruling.

**Reuse review.** `localStorage` is touched only in `src/storage` and `theme.ts`. The
level check has one home, `levelOrNull`, keyed off the engine's own `STRENGTH_LEVELS`
rather than a written-out 1 to 8, so the setting and the remembered game cannot
disagree about what a level is; this is the find the chip predicted. The two sides are
written out once, as `SIDES`, and both the setting and the game record read it.
`JSON.parse` and `JSON.stringify` appear only in `current-game.ts`. The 900 has one
code home, `NARROW_BELOW`, with the CSS 899 commented against it at both ends. No
pixel number is written in a `.ts` or `.tsx` outside `board-size.ts`; one appears in a
`Board.tsx` comment, describing the fault it fixes. `app.css` keeps its own 900 for
the tall-window block, which is a different question and was left alone.

**Left.** `Board.tsx` now has both a `ResizeObserver` and a size effect; the observer
covers a host resized by CSS rather than by the prop, so it was kept, but the
orchestrator may want to decide whether it still earns its place.

**Nick's ruling on fault 3 (2026-09-12), and what it changed.** Asked about the 808
against 805.33 conflict, Nick said: "The double size doesn't need to be taken
literally, you can make the fix." So the fit rule now steps down in eights until the
squares come out whole in DEVICE pixels as well as CSS pixels, and `useBoardPixels`
passes `devicePixelRatio` in and re-measures when it changes, which it does when a
window is dragged between two monitors at different scales.

The large board is therefore scale-dependent, and one rule still covers every case:
808, 624 and 728 at the three viewports at 100% and 200%; 800, 624 and 720 at 150%;
800, 608 and 704 at 125%. The small board is 416 at every scale, because 416 is a
multiple of 32. Spec S2 and the 4.2 table were updated to say so, and S2 records that
this supersedes Q3's "832 px on Windows"; 832 is now the ceiling rather than a
promise. `fitBoardSize` takes `devicePixelRatio` as a fifth argument with a default of
1, so it stays pure and the tests name the scale they are about.

### Gate 3 findings (orchestrator, 2026-09-12)

- **Verified from the repo.** `npx vitest run`: 17 files, 162 passed, 2 skipped, 4.8
  seconds. `tsc -b` clean, `npx oxlint` silent, `npm run build` clean at 302.8 kB.
  `Board.tsx` differs from the trainer by the size effect only and `board-stub.tsx` by
  the orientation attribute only, both as their origin lines say. No forbidden words
  outside identical copies, no browser global in the pure folders, no pixel number in
  code outside `board-size.ts`. `localStorage` is touched in `src/storage` and in
  `theme.ts` (see below). `../London` and `../Conquest` untouched.
- **Mutation-checked.** Disabling the stored game's version check turns "gives null on
  another version" red. Restored from git. The builder's own two (the New game guard
  and the device-pixel condition) are taken on its account.
- **Driven in the pane, whose display scale is 1.5.** At 1280 by 1000 the small board
  measured exactly as at gate 2. Choosing Large gave 800 (not 808: the scale is 1.5),
  bar, `.board` and `cg-board` all 800 and ending on 880.67 together; the sidebar 280
  wide at x 892; `scrollWidth` 1280. Choosing level 6 mid-game put the session's
  profile at level 6, 300 ms, Elo 1750 and wrote both the setting and the remembered
  game as 6. A reload brought back the game, the level 6 select, Large ticked and the
  board at 808 (the pane reports scale 1 after a navigation, and 808 is right for 1).
  At 820 by 1180, after a dispatched `resize`, the board was 728, the sidebar under
  the column at 757 wide, the list 232 tall, `scrollWidth` 805 against 820. Storage
  cleared afterwards.
- **The pane held a 22-move game from the builder's drive when I opened it.** The
  chip's last item was to clear the pane's storage, and the notes do not say it was
  done. No harm and nothing in the repo; noted so the next drive starts clean.
- **Nick's ruling on the device-pixel fit is recorded in the spec by the builder**,
  which was the right thing to do with a ruling taken mid-phase, and the wording is
  faithful. The Q3 row now says it is superseded and points at S2.
- **Two spec table rows the builder flagged as stale are corrected** (13.2: `Board.tsx`
  adapted, `board-stub.tsx` adapted, and the two new files named).
- **`Board.tsx` keeps both the observer and the size effect.** The observer covers a
  host resized by CSS, which the narrow layout and a future change could do; the
  effect covers the prop. Two lines and a comment each; not worth a third finding.
- **One small reuse item, taken into phase 4:** `theme.ts` has its own try-catch
  around `localStorage` from phase 0, and `prefs.ts` now owns that pattern (`read`
  and `write`). `theme.ts` is already adapted, so it should call them. Spec S13 says
  `src/storage` is the only place that reads or writes storage.
- **For the phase 4 chip, confirmed:** `scriptedEngine` must not answer the bar's or
  the hint's searches from its script, and the way to tell them apart is the profile
  the provider sets before each: the analysis profile is level 8 at 150 ms, which no
  playing level uses (level 3 is 150 ms but is not level 8).

- [x] **Review gate 3 passed** (2026-09-12)

### Phase 4 - builder notes (2026-09-12)

The session was compacted before this phase. Every document the chip named was read
fresh before anything was touched.

**Measured.**

- `npx vitest run`: 20 files, 183 tests passed and 2 skipped, 4.1 seconds warm. By
  project: `string` 14 files, 148 passed, 2 skipped (the two Tauri version tests);
  `dom` 6 files, 33 passed. `tsc -b` clean, `npx oxlint` silent, `npm run build`
  clean (JavaScript 306.38 kB, 97.66 kB gzipped; CSS 23.13 kB, 6.50 kB gzipped).
- **Red first, five times.** Each new rule was shown failing before it was trusted.
  Taking the `isPromotion` check out of the board's `onMove` turns all three
  promotion tests red ("expected [] to deeply equal [ 'Queen', 'Rook', 'Bishop',
  'Knight' ]"). Fixing `numberPlacement`'s larger share to White turns two placement
  tests red. Loosening `canHint` to "there is a session" turns the two disabled
  cases red. Evaluating from White's side rather than the side to move turns the
  bar's sign test red ("expected 'Evaluation: +0.4' to be 'Evaluation: -0.4'").
  Taking the profile split out of the fake engine turns SIX tests red across three
  files, the checkmate test among them, which is gate 3's finding 2 proved rather
  than assumed. Replacing `atAnalysisProfile`'s `finally` with a plain call turns
  the restore test red.
- **The bar, live, with the real engine.** The opening position reads +0.5 and the
  white share is 57.9324%, which is `evalShare` of exactly 0.48 pawns: the share and
  the number are the same evaluation, not two roundings of it. After 1.e4 e6 it is
  +0.4 at 56.7911%. After 3.Qxf7+ Kxf7 it is -5.8 at 2.03656%, which inverts to
  -5.839 pawns, and the number has moved to the TOP of the bar and to the class
  `on-black`. So the sign, the end and the colour all follow the position.
- **A mate reads as a mate.** Seeded at 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6, the bar says
  "Evaluation: M1", prints `M1`, and draws White's share at 100%.
- **The bar holds its value while the engine thinks**, caught as a sequence rather
  than a claim. A `MutationObserver` on the board column recorded, in order:
  "Your move | -6.3 | hint=false"; "Black is thinking... | -6.3 | hint=true";
  "Black is thinking... | -7.8"; "Black is thinking... | -7.5"; "Your move | -7.5 |
  hint=false". That is the whole of spec 5.2's order in one trace: the bar keeps the
  old number while the engine starts, is brought up to date for the move just played
  BEFORE the reply lands, and updates again after it.
- **Hint.** Pressed on the user's move it answered "The engine suggests exd5." with
  one auto-shape, `bluee4d5`. The sentence sits at x 68, the same left edge as the
  status line and the board. Playing a move took both away: no sentence, no shapes.
- **The picker.** Four buttons named Queen, Rook, Bishop and Knight, holding
  `white queen`, `white rook`, `white bishop` and `white knight`. The box is 210 by
  54 over a 416 board, which is four 52px squares and the border. Cancelled with
  Escape the game still had its 8 moves and the board was unlocked again; opened a
  second time and answered with Rook it played `axb8=R`, and the engine replied
  `Rxb8`.
- **1280 by 1000, all four combinations**, bar, `.board` and `cg-board` ending on the
  same pixel every time, both differences 0, `scrollWidth` 1280 against 1280:
  small dark 416, small light 416, large dark 808, large light 808 (the pane reports
  a display scale of 1 after a navigation, and 808 is right for 1). Earlier in the
  same drive, before a reload, the scale was 1.5 and Large gave 800 with squares of
  exactly 150 device pixels, which is gate 3's number. The number's colour is
  rgb(236, 233, 226) on the black share and rgb(42, 44, 48) on the white one, the
  two piece colours, and it is the same in both themes, which is what spec 4.5 asks.
- **820 by 1180 upright**, after a dispatched `resize`: board 728, both differences
  0, the sidebar under the column at x 24, and the hint sentence 464 wide running 68
  to 532. `scrollWidth` 805 against `innerWidth` 820, so no sideways scroll. The
  sentence does not lengthen the page at the large board either: `scrollHeight` was
  1000 against a 1000px viewport before the hint and 1000 after it.
- `git -C ../London status` and `git -C ../Conquest status` show the same two
  untracked files gate 3 saw, both dated before today.
- **The pane's storage was cleared, the viewport reset and the dev server stopped.**

**Two faults the pane found, both fixed.**

1. **The picker was 22px left of the board's middle.** It is positioned inside
   `.play-board`, and that box is the bar, the gap and the board, so its centre is
   half the 44px inset to the left of the board's. Measured at [-22, 0] from the
   board's centre. It now offsets by `calc(50% + var(--board-inset) / 2)`, which
   measured [0, 0]. The inset already had one home and this is a second reader of it
   rather than a second number.
2. **The four pieces did not draw at all: the picker was an empty box.** The
   background images were loaded and the `cg-wrap` ancestor was right; the elements
   were 0 by 0. `piece` is not an HTML element, so it is `display: inline` until told
   otherwise, and width and height do nothing to an inline box. Chessground never
   meets this because on a board every piece is absolutely positioned, which makes a
   box of it. One `display: block` in the override.

**A finding that changed the chip's design, with the measurement.**

The chip asks for a `revision` prop on the board, bumped on cancel, because
chessground has already drawn the pawn on the last rank by the time it reports the
move and the fen prop has not changed. That is all true, and the prop still does
nothing, because the pawn is already back before the user has chosen.

Driven in the pane with `__cg.move` followed by the move seam, which is exactly what
a real drag does: chessground held `a7: null, b8: white pawn`; by the time the picker
was on screen it held `a7: white pawn, b8: black knight` again. Opening the picker
locks the board, `movableColor` and `dests` both change, and chessground's `set`
re-applies the fen whenever it runs. The lock is required by spec 5.2 and 5.3 and
happens on every promotion, so the redraw is entailed rather than lucky.

So `revision` is gone, and the comment that replaces it is the real fix: the board's
`set` effect and the screen's `canMove` both now say that locking is what puts the
pawn back, which was the subtle thing worth writing down. Kept, it would have been
exactly the dead code gate 2 ruled against, and a prop that can never fire is a prop
no test can hold: a mutation removing it from the board's dependency list changed
nothing.

**A consequence a person can see, for the orchestrator.** Because of the above, the
pawn returns to its own square while the picker is open, rather than sitting on the
last rank as it does on lichess. Spec 5.3 does not say which, and it follows from the
lock the spec does require, so it was not treated as a choice. If Nick wants the pawn
to stay, the picker would have to stop locking the board and something else would
have to put the pawn back, which is when `revision` comes back.

**Decided (code shape).**

- **`sanForMove` names the hint's move, not a second `Chess`.** The chip writes
  `new Chess(fen).move(splitMove(best)).san`, which would be a second place turning a
  UCI move into SAN and a chess.js import in `src/ui`. `splitMove` and `sanForMove`
  are both already the single home for their half (CLAUDE.md), so the hint uses them.
- **`atAnalysisProfile` in `analysis.ts`.** The reuse review found the shape the chip
  predicted: "set the analysis profile, search, restore in a `finally`" in both
  `evaluate` and `askHint`. It is four lines, and the failure it guards is silent
  (an opponent left at level 8 for the rest of the game), so it has one home with a
  test that throws inside it and checks the level came back.
- **`engineByProfile` in `src/test/`.** Gate 3's finding 2 needed the scripted engine
  to ignore the bar's searches. Two more fakes wanted the same split: a held engine,
  so a test can read the screen mid-move without holding the evaluation that move
  waits on, and a suggesting engine, so a hint can be pinned to a move that would be
  illegal for the side replying. Three copies of one idea, so it has one home, and
  the home is the seam the shipped code uses: `isAnalysisProfile`.
- **`heldEngine` replaced the inline held promise** in the status test, which now had
  to let evaluations through.
- **The picker's own box carries `cg-wrap`** (rather than a wrapper around it), and
  `play.css` puts the geometry back with `.promotion.cg-wrap piece`, both classes so
  it outranks the rule it corrects whatever order the stylesheets land in.
- **Cancel listens on the document, for `pointerdown` and Escape.** Spec 5.3 says
  clicking anywhere else cancels, and anywhere else means the page rather than the
  board: a user changing their mind reaches for the nearest empty space.
  `pointerdown` rather than `click`, so the press that dismisses the picker does not
  also press whatever is under it.
- **`chessground-piece.d.ts`** declares the `<piece>` element for TypeScript.
  Chessground makes these itself and ships no JSX type for them.
- **`seedGame` writes through `rememberGame`**, so a test cannot seed a record shape
  the app would not have written.

**Copies.**

- **New, from the trainer:** `src/play/analysis.ts` (`SCAN_MOVETIME` as
  `ANALYSIS_MOVETIME`, `HINT_MOVETIME` and `analysisProfile`, their text kept),
  `src/ui/EvalBar.tsx` (`LiveEvalBar` with the number added), and `hintShapes` and
  `engineHint`, both cut to the engine case.
- **`Board.tsx` is unchanged from phase 3** and still differs from the trainer's by
  the size effect and its comments only.
- **`board-stub.tsx` is unchanged from phase 3**, the orientation attribute only.
- No new or adapted file says "trainee", "student", "repertoire", "course" or
  "book". Two comments explaining what the trainer's hint says were reworded to
  "authored lines" for that reason. No em dashes under `src/`.

**Asked of Nick.** Nothing. Everything a person can see this phase is either in the
spec or follows from it; the one consequence that is neither is written up above for
the orchestrator rather than guessed at.

**Reuse review.** `analysisProfile()` is now set in exactly one place,
`atAnalysisProfile`, so no caller can set it and forget to put the level back.
`sideToMove` is still the only thing that reads a side out of a FEN: the only
`fen.split` in the app is in `position.ts`. `localStorage` is touched only in
`src/storage` and in tests, `theme.ts` having moved to the helpers this phase. No
pixel number is written in a `.ts` or `.tsx` outside `board-size.ts`; one appears in
a `Board.tsx` comment describing the fault it fixes. No colour is written anywhere
but `index.css`: the bar's number reaches its two piece colours through classes. A
stylesheet sweep for a declaration repeated in one rule finds nothing.

**Left.**

- Save game and Load game stay disabled, and the hint has nothing to clear on Load
  yet. Spec section 8 says the hint goes on Load game; phase 5 adds the call beside
  the load it belongs to.
- A reopened game is evaluated at its final position only, as the chip says. The
  positions behind it have no number, so undoing into them shows the last number
  known rather than their own, which is `shownEvaluation` working as written. Phase 5
  brings the full scan for loaded files and could cover this too if it is worth it.

### Gate 4 findings (orchestrator, 2026-09-12)

- **Verified from the repo.** `npx vitest run`: 20 files, 183 passed, 2 skipped, 4.8
  seconds. `tsc -b` clean, `npx oxlint` silent, `npm run build` clean at 306.4 kB.
  `Board.tsx` still differs from the trainer by the size effect and its comments
  only. No forbidden words outside identical copies; no browser global in the pure
  folders; `localStorage` now touched only in `src/storage` (the `theme.ts` mentions
  are its comment); no pixel number or colour in code outside `board-size.ts`; no
  chess.js import under `src/ui`. `../London` and `../Conquest` untouched.
- **Mutation-checked.** Turning the hint arrow green turns "draws the move on the
  board and says it" red. Restored from git. The builder's five are taken on its
  account, each naming its failing test.
- **Driven in the pane at 1280 by 1000.** The start position: bar label "Evaluation:
  +0.5", White's share 58.09 percent drawn from the bottom in the piece white, the
  number "+0.5" at the bottom in the piece black. Hint answered "The engine suggests
  e4." with one auto-shape `bluee2e4` and the button greyed while it thought. A
  seeded promotion position (`a4 b5 axb5 a6 bxa6 Nc6 a7 Nb8`) through the board's
  move seam: the picker showed Queen, Rook, Bishop and Knight as 52 by 52 pieces,
  the pawn was already back on a7 with the board locked, Escape closed it with the
  game unchanged and the board unlocked, and Rook played `axb8=R`, answered by
  `Rxa1`, the bar moving from +4.9 to +3.8. Storage cleared afterwards.
- **The builder's departures are right.** `atAnalysisProfile` with its `finally` is
  the reuse rule applied to a silent failure; `engineByProfile` is one seam for three
  fakes and it is the shipped code's own seam; `sanForMove` for the hint keeps
  chess.js out of `src/ui`; dropping the `revision` prop was measured, not
  assumed, and a prop no test can hold is the dead code gate 2 ruled against.
- **One consequence the builder flagged, ruled:** the pawn goes back to its own
  square while the picker is open, rather than sitting on the last rank as lichess
  draws it. It follows from the lock spec 5.2 requires, the four pieces say what is
  being asked, and nothing else about the screen is uncertain. Accepted as built;
  Nick can ask for the other look.
- **One ruling for phase 5:** no full scan on load. Undo and redo evaluate the
  position they land on when it has no number, which covers loaded games and reopened
  ones alike at 150 ms each, never blocks the engine's reply behind a twelve-second
  scan, and needs no progress line. Spec 9.2 is amended and says why.
- **Open, from Nick, after this phase landed:** "the bar is always solid black".
  Not reproduced in the pane in either theme, at either size, at scale 1.5 or 1. A
  solid black box with no number is exactly the phase 2 and 3 placeholder, and my
  dev server started on 5185 during this gate, which `--strictPort` would have
  refused if Nick's own had been running there. So a page served from before commit
  `6762176` is the first suspect. **Closed the same sitting:** Nick looked again
  and reported it fine. A stale page, as suspected. Nothing to carry forward.

- [x] **Review gate 4 passed** (2026-09-12)

### Phase 5 - builder notes (2026-09-12)

The session was compacted before this phase. Every document the chip named was read
fresh before anything was touched.

**Measured.**

- `npx vitest run`: 25 files, 222 tests passed and 2 skipped, 7.6 seconds warm. By
  project: `string` 17 files, 178 passed, 2 skipped (the two Tauri version tests);
  `dom` 8 files, 44 passed. `tsc -b` clean, `npx oxlint` silent, `npm run build`
  clean.
- **The browser bundle carries no Tauri plugin.** The main chunk is 316.83 kB
  (101.57 kB gzipped) and the only Tauri text in it is the single
  `__TAURI_INTERNALS__` check in `isDesktop`. The dialog and fs plugins are three
  separate chunks of 90, 285 and 1354 bytes, which a browser never asks for because
  nothing imports them until `isDesktop()` is true. That is spec S14 working, and it
  is visible in the build rather than argued for.
- **Red first, seven times.** Dropping the set-position refusal turns "refuses a game
  that starts from a set position" red. Fixing the loaded side to White turns two
  tests red. Removing the empty-game sentence turns "says so when the game has not
  started" red. Taking `await quietRef.current` out of `play` turns "holds a move
  played on top of it" red. Removing `evaluateLanded` from undo turns all three undo
  tests red. Ungreying the two file buttons turns "offers neither button" red.
  Ignoring the file's level turns "replaces the game with the file's moves, side and
  level" red. Putting the session's floor back turns TEN tests red across four files.
  Each was restored and the suite re-run green.
- **The file, written live in the pane.** After 1.d4 e6 2.c4 Be7 at level 4, Save
  game produced exactly the text spec 9.1 shows, tag for tag:
  `[Event "Simple Chess"] [Site "-"] [Date "2026.09.12"] [Round "-"] [White "You"]
  [Black "Stockfish level 4"] [Result "*"]`, then
  `1. d4 e6 2. c4 Be7 {Stopped after move 2. White was played by you at level 4.} *`.
  The blob's type is `application/x-chess-pgn` and the link's name was
  `simple-chess-2026-09-12-1246.pgn`.
- **The round trip, live, through the real file input.** The level was moved to 7 and
  the game saved; New game threw it away (0 rows, and the file still said level 7);
  the saved text was handed to the hidden input, and back came all four moves, the
  select reading 7, the board White, and `simple-chess.game` holding
  `{"version":1,"sans":["e4","e5","Nf3","Nc6","Bb5","a6","Ba4","Nf6"],"side":"white","level":7}`.
  No file input was left in the page afterwards.
- **A bad file, live.** A `.pgn` holding "just some writing about chess" gave the
  parser's own sentence in the `notice bad` style, background rgb(46, 31, 31) and
  text rgb(224, 180, 174), and the move list still had its four rows.
- **The notice comes and goes by itself.** A `MutationObserver` on the board column
  recorded "Saved to your downloads folder" at 16 ms and gone at 3506 ms. The code
  says 3000; a hidden pane clamps timers, which is a standing hazard in CLAUDE.md,
  so the drift is the pane's rather than the app's.
- **Undo into a position with no number, live**, on a ten-ply game reopened from
  storage, caught as a sequence rather than claimed. The observer recorded: at 17 ms
  "4 rows | (none) | Your move | undo on | hint on"; at 182 ms "4 rows | +0.3 | Your
  move | undo on | hint on". So the game moves at once, nothing says the engine is
  thinking, no button greys, and the number for the position landed on arrives about
  150 ms later. That is gate 4's ruling exactly.
- **1280 by 1000, all four combinations.** Bar, `.board` and `cg-board` end on the
  same pixel every time: small dark 497, small light 497, large dark 913, large light
  913, all three boxes agreeing to the pixel. `scrollWidth` 1280 against `innerWidth`
  1280. The large board is the full 832 here because the pane reports a display scale
  of 1 after a navigation. The two file buttons are 103 and 105 px wide and 38 px
  tall, the same height as New game, with the same background, text and border colour
  as it in both themes: rgb(42, 46, 53) on rgb(58, 63, 71) dark, white on
  rgb(189, 184, 174) light.
- **820 by 1180 upright.** Small: board 416, bar and both boards ending at 497, the
  sidebar under the column at x 24 and 757 wide, the notice at x 68 and 416 wide,
  level with the board's left edge. `scrollWidth` 805 against `innerWidth` 820, so no
  sideways scroll. Large: board 720, all three boxes ending at 801, `scrollWidth`
  805. 720 rather than phase 4's 728 because the display scale was 1.5 in this drive
  and 728 would want squares of 136.5 device pixels; that is S2's second condition
  doing its job, not a regression.
- `git -C ../London status` and `git -C ../Conquest status` show the same two
  untracked files gate 3 and gate 4 saw, both dated 2026-09-11.
- **The pane's storage was cleared, the viewport reset and the dev server stopped.**

**A contradiction, stopped and recorded, then resolved by the spec.**

**A game that arrived whole could not be undone at all.** `PlaySession` copies the
trainer's floor: the moves given to the constructor are replayed and undo may not go
below them. In the trainer those moves are an authored line an exercise is set up on,
and unplaying them would leave a different exercise. In this app they are the game -
the one from storage (spec 10) or from a PGN file (spec 9.2) - so the floor meant
Undo did nothing whatever on any reopened game, and phase 5's own acceptance ("undo
into an unevaluated position gets a number") was unreachable. Spec 5.4 describes no
floor, and spec 9.2 as amended at gate 4 says in as many words that undo goes along a
loaded game. The spec wins over copied code by its own preamble, so the floor is
gone: `undoTarget` walks to the first move. Phase 3's test that pinned the floor is
replaced by one that pins the opposite, plus a new one for the case the floor used to
cover by accident (a user playing Black who has not moved yet has nothing of their
own to take back). Found by the first undo test going red for a reason that was not
the reason it was written for. Spec 5.4 said "Neither asks the engine anything: every
position they land on has already been evaluated" and described no floor; both halves
had stopped being true at gate 4, so 5.4 now carries the floor correction and the
amended 9.2's behaviour, with the reason in brackets.

**Decided (code shape).**

- **`quietRef`: anything that asks the engine to MOVE waits for the undo's number.**
  The evaluation undo and redo fetch is the one thing in this app nobody is waiting
  for, so it deliberately does not set `thinking` (gate 4's ruling), and the user can
  play a move while it is still out. `atAnalysisProfile` sets the analysis profile,
  searches and puts the playing level back, and each of those is its own turn on the
  engine's queue: a search enqueued in the middle of that sequence lands between the
  two `setStrength` calls. A move would be played at level 8 with one candidate, or a
  hint answered at the game's own level. Both are silent, which is the same class of
  failure `atAnalysisProfile` itself exists to prevent, so `play` and `askHint` both
  await the outstanding background work first. It costs nothing in the ordinary case
  because there usually is none. The test drives it: with the undo's evaluation held,
  the user's move appears on the board and the engine is asked nothing until it is
  released.
- **`levelOrNull` moved from `storage/prefs.ts` to `play/level.ts`.** A PGN file names
  a level, so `load-pgn.ts` needs the check; `prefs.ts` imports React, and `src/play`
  imports no React (spec S13). Rather than write the check twice, the pure half came
  out of the module full of hooks. Its three callers are now the setting, the
  remembered game and the file. Its tests moved with it.
- **`asMessage` moved to `ui/message.ts`.** The provider had it and the shell now
  needs it for a file that would not be written or read. Two copies of "turn an
  unknown thrown thing into a sentence" is exactly the snippet the reuse rule says to
  house the moment it appears twice.
- **`playedMoves` in `src/test/`.** Three test files want a game to write out. The
  trainer's own copy lived in its `game-pgn.test.ts`; here it would have been three.
- **`pad` at module scope in `game-pgn.ts`.** `pgnDate` and `saveFileName` both pad to
  two digits, which is the second date formatter the chip predicted. One helper, and
  `pgnDate` is otherwise the trainer's text unchanged.
- **`EngineError` is now `Notice` with a `bad` prop**, and it is the only thing that
  draws a message under the board. `.notice` and `.notice.bad` were both already in
  `play.css` from phase 2. Its two uses in `Screen.tsx` and `StatusLine.tsx` were
  updated; nothing else referred to it.
- **`startFrom(sans, side, level)` in `Shell`.** The remembered game and a loaded file
  are the same act, and the chip named the risk: two paths that set the level, the
  side and the session would drift. The mount effect and Load game both go through
  it.
- **`saveFileName` loses its stamp rather than printing nonsense** when handed a
  timestamp that will not parse: `simple-chess.pgn`. `pgnDate` has the standard's
  `????.??.??` for that case and a file name has no such convention. Nothing reads
  the name back, so the fallback costs nothing.
- **`pgnResult`'s parameter is `side` rather than `studentColour`.** The file is
  adapted rather than identical, so spec 3's allowance for keeping the trainer's
  identifier does not apply; the body is otherwise the trainer's text.
- **The level and the side written into a file come from the RUNNING game**, not from
  the sidebar beside it. They are the same until a game is loaded or the level is
  changed mid-game, and it is the game that is being written down.

**Departures from the chip, both deliberate.**

- **`paths.ts` has `isDesktop` only.** The chip says `LOCAL_FOLDER` waits for phase 8;
  plan box 5.3 and the spec's 13.2 folder table both say it belongs in this file.
  Gate 2 ruled that unused code goes, and nothing until the Tauri window needs the
  folder name, so it waits. The box records it and 13.2's row now says so.
- **The three-second notice is not the trainer's `CopyGame` timing.** The chip and
  plan box 5.5 both attribute three seconds to `CopyGame`; `CopyGame` actually uses
  2500 ms. The number in the chip is stated twice and is what was built; only the
  attribution is wrong.

**Asked of Nick.** Nothing. The one thing a person can see that the chip did not
settle - what happens to Undo on a game that arrived whole - is settled by spec 5.4
and spec 9.2, and is written up above rather than guessed at.

**Reuse review.** `gameToPgn` is the only thing that writes PGN and it goes through
`Movetext` and `pgnTag`; `parsePgn` is the only thing that reads one. `levelOrNull`,
`asMessage`, `playedMoves` and `pad` each have one home, three of them created by
this phase's second caller appearing. `canReplayMoves` is still the only legality
check on a move list, and `load-pgn.ts` uses it rather than replaying the moves
itself. `isDesktop` is asked in one place and only `storage/files.ts` acts on it.
`localStorage` is touched only in `src/storage` and in tests (`theme.ts`'s two
mentions are its comment). No pixel number or colour appears in a `.ts` or `.tsx`.
No React under `src/play`, `src/model` or `src/engine`. The only chess.js under
`src/ui` is a comment in `PromotionPicker.tsx` and the test that builds a position.
No new or adapted file says "trainee", "student", "repertoire", "course" or "book";
two comments explaining what the trainer does differently were reworded for that
reason. No em dashes under `src/`.

**Copies.**

- **New, from the trainer:** `src/play/game-pgn.ts` (`pgnDate` and `pgnResult` kept,
  everything about the report cut), `src/storage/files.ts` (`backup.ts`'s shape, with
  `bundles.ts`'s `fileName` and its file input turned round into an opener),
  `src/storage/paths.ts` (`isDesktop` only), `src/test/played-moves.ts`.
- `src/play/load-pgn.ts`, `src/play/level.ts` and `src/ui/message.ts` are new; the
  trainer has no equivalent of any of them.

**Left.**

- **A browser that fires neither `change` nor `cancel` on a file input leaves the
  promise unresolved and one hidden input in the page.** The chip ruled the closure
  acceptable and ruled out a timeout; the leftover input is the same fact seen from
  the DOM. Safari before 16 is the case. Nothing hangs on it: the button is live
  again the moment the chooser closes. Driven in the pane, choosing a file and
  cancelling both removed it.
- **The desktop half of `files.ts` has not run.** No unit test can drive a save dialog
  or a download, and the DOM tests mock the module at exactly the seam where the app
  stops knowing where it is running. The Tauri dialogs are driven in phase 8, which is
  where the capabilities that let them run get built.
- **Load game's real file chooser cannot be driven from the pane.** What was proved
  there instead: the button makes a hidden `input[type=file]` with `accept=".pgn"`,
  puts it in the document and clicks it; and the whole path after that, from the
  file's text to the game on the board, was driven by handing the real input a real
  `File`.

### Gate 5 findings (orchestrator, 2026-09-12)

- **Verified from the repo.** `npx vitest run`: 25 files, 222 passed, 2 skipped, 7.6
  seconds. `tsc -b` clean, `npx oxlint` silent, `npm run build` clean. The main
  bundle carries one `__TAURI_INTERNALS__` string and no plugin text; the two Tauri
  plugins are three chunks of their own, as the builder said. No forbidden words
  outside identical copies; no browser global in the pure folders; `localStorage`
  only in `src/storage`; no pixel number or colour in code; no chess.js import under
  `src/ui`; every Tauri import lazy and behind `isDesktop()`. `../London` and
  `../Conquest` untouched.
- **Mutation-checked.** Inverting the side read from the `Black` tag turns five
  load tests red. Restored from git. The builder's seven are taken on its account.
- **Driven in the pane at 1280 by 1000.** A ten-ply game seeded in storage reopened
  at "+0.5"; Undo took two plies off at once with no button greyed and the bar
  reading "the engine has not looked yet", and 600 ms later it read "+0.3". Save
  game made one blob of 225 bytes typed `application/x-chess-pgn` and said "Saved to
  your downloads folder" in the plain notice colour. Load game put a hidden `.pgn`
  file input in the page, took a Black game at level 6 through it, and the board
  came back the other way up with the select on 6, the Black radio ticked, the
  stored game rewritten, and White's reply `d4` already played; the input was gone
  afterwards. Storage cleared.
- **The floor is gone and the spec agreed with the builder.** The trainer's session
  refuses to undo below the moves it was started with, because there those moves
  are an authored line. Here they are the game, and spec 9.2 says undo goes along a
  loaded game. The builder stopped on the contradiction, resolved it by the spec's
  own preamble, replaced the test that pinned the floor, and wrote the correction
  into 5.4 with the reason. That is rule 4 done exactly as written.
- **The background evaluation is guarded properly.** Undo's number is fetched with
  nothing greyed, which leaves it in flight while the user may move; the three turns
  on the engine's queue (set analysis, search, restore) could otherwise have a move
  searched at level 8. `play` and `askHint` await the quiet promise first, and a
  test holds the evaluation and watches the move wait. This is the second time the
  builder has found a silent level-8 hazard on its own; it is the right instinct.
- **Small moves accepted:** `levelOrNull` into `src/play`, `asMessage` into
  `ui/message.ts`, `EngineError` renamed `Notice`, `pad` shared by the date and the
  file name, `playedMoves` for three test files, and `startFrom` as the one path a
  game arrives by. The CopyGame timing was 2500 ms, not 3000; the chip's number was
  built and only its attribution was wrong.
- **`LOCAL_FOLDER` waits for phase 8**, as the builder and the chip say; the plan box
  and the spec table now agree.

- [x] **Review gate 5 passed** (2026-09-12)

### Phase 6 - builder notes (2026-09-12)

The session was compacted before this phase. Every document the chip named was read
fresh before anything was touched, and so were `../London/scripts/packaged-eval.mjs`,
`../London/src/ui/Diagnostics.tsx` and `../Conquest/src/ui/useUpdate.ts`.

**Measured.**

- `npx vitest run`: 28 files, 243 tests passed and 2 skipped, 8.0 seconds warm. By
  project: `string` 19 files, 194 passed, 2 skipped; `dom` 9 files, 49 passed.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean.
- **No scene survives the build.** After `npm run build`, in `dist/assets/*.js`:
  `midgame` 0, `Qxf7` 0. Also 0: `scene`, `axb8`, `Nbd7`, `Ruy`. The whole of
  `src/dev` is gone, not merely the two words the chip asked about. The main chunk
  is 317.10 kB against phase 5's 316.95, and the 0.15 kB is the storage refactor
  below, not the scenes.
- **The twelve rows.** `?scene=midgame`, each viewport, both sizes, both themes. The
  probe was fetched from the dev server and evaluated, so the file in the repo is
  what ran. Every row: the bar, `.board` and `cg-board` end on the SAME pixel, and
  `scrollWidth` is at or under `innerWidth`.

  | Viewport | Size | Theme | Board | bar/board/cg bottom | scrollWidth vs innerWidth | Scale |
  |---|---|---|---|---|---|---|
  | 1280x1000 | small | dark | 416 | 497 / 497 / 497 | 1280 vs 1280 | 1 |
  | 1280x1000 | small | light | 416 | 497 / 497 / 497 | 1280 vs 1280 | 1 |
  | 1280x1000 | large | dark | 808 | 889 / 889 / 889 | 1280 vs 1280 | 1 |
  | 1280x1000 | large | light | 808 | 889 / 889 / 889 | 1280 vs 1280 | 1 |
  | 1180x820 | small | dark | 416 | 497 / 497 / 497 | 1180 vs 1180 | 1 |
  | 1180x820 | small | light | 416 | 497 / 497 / 497 | 1180 vs 1180 | 1 |
  | 1180x820 | large | dark | 624 | 705 / 705 / 705 | 1180 vs 1180 | 1 |
  | 1180x820 | large | light | 624 | 705 / 705 / 705 | 1180 vs 1180 | 1 |
  | 820x1180 | small | dark | 416 | 497 / 497 / 497 | 805 vs 820 | 1 |
  | 820x1180 | small | light | 416 | 497 / 497 / 497 | 805 vs 820 | 1 |
  | 820x1180 | large | dark | 728 | 809 / 809 / 809 | 805 vs 820 | 1 |
  | 820x1180 | large | light | 728 | 809 / 809 / 809 | 805 vs 820 | 1 |

  The scale was 1 in every row, which the chip's decision rule predicted: the pane
  reports 1 just after a navigation and 1.5 later, and each row was measured straight
  after one. So the large boards are S2's scale-1 numbers (808, 624, 728) rather than
  phase 5's scale-1.5 ones (800, 624, 720), and both are that rule working. Phase 5
  recorded 913 for the large board at 1280 by 1000; that drive did not pin the
  viewport height, and 889 here is 81 + 808, which is what spec 4.2 works out.
- **The other three scenes, at 1280 by 1000, both themes, looked at.** `mate`: the
  white queen on f7 with the last-move highlight, "You won by checkmate" under the
  buttons, Redo and Hint greyed and Undo live, the move list ending `4. Qxf7#`. The
  bar is level with no number, which is spec 7's "before the first evaluation
  arrives" state and is right here for the reason under **Left** below. `promotion`:
  the picker opened by dragging a7 to b8 through the real chessground (the board
  trusts synthetic events in development builds), four white pieces in a strip 210 px
  wide and one square tall centred over the board, the pawn still on a7 and the move
  list still at four rows until a piece is chosen. `hint`: the blue arrow drawn on
  the board and "The engine suggests Bh6." under the status line in dark,
  "The engine suggests axb5." in light. Both were real searches by the real engine,
  not a fake.
- **Red first, six times**, each restored and the suite re-run green. Blanking
  `scrollToShow` turns three `keep-in-view` tests red. Dropping `applyScene` from the
  hook turns three scene tests red. Moving `useDevScene` below the settings hooks in
  `Shell` turns "applies the settings the address carries" red with `expected 'dark'
  to be 'light'`, which is the ordering that comment claims, proved. Dropping the
  scene's hint turns "asks for a hint when the scene wants one" red. Making `oneOf`
  accept anything turns two scene tests AND the existing preference test red, which
  is what says `readOneOf` still goes through it. And the layout fault below was put
  back and measured again.
- `git -C ../London status` shows one untracked file, `grep.exe.stackdump` dated
  2026-09-11, and `git -C ../Conquest status` one, `tsconfig.tsbuildinfo`. They are
  the ones gates 3, 4 and 5 saw, and nothing under either folder was changed.
- **The pane's storage was cleared, the viewport reset and the dev server stopped.**

**The fault the pass found, and what it cost to see.**

**The move list scrolled the whole screen instead of itself.** `MoveList` keeps the
newest move in view with `scrollIntoView({ block: 'nearest' })`, and that scrolls
every scrollable ancestor, not the list. Above 900 by 700 the shell pins itself to
the window and `main` scrolls instead of the page (`app.css`, phase 0). On a 1180 by
820 landscape iPad the sidebar is 741 px against `main`'s 715, so `main` can scroll,
and bringing the twentieth move into view scrolled it by 26 px and took the top of
the board with it: the board's first rank was cut off the moment the app opened, at
every board size, and again after every move.

It was caught by the probe rather than by looking: the board's bottom read 471 and
679 where the arithmetic said 497 and 705. The cause was pinned by opening the same
page twice, `?scene=fresh` against `?scene=midgame` at the same size: 0 px of scroll
with the board at y 81 and no moves in the list, 26 px with the board at y 55 and
twenty. Nothing but the list had changed, which is the whole diagnosis.

The fix is `src/ui/keep-in-view.ts`: `scrollToShow` says how far a box has to move to
show a row in it, and `MoveList` adds that to the list's own `scrollTop` and touches
nothing else. Measured after: `main` at 0, the board at 81, the list scrolled 232 px
with move 20 showing. Then driven live at 1180 by 820, playing 21.Bxf6 on the board:
the list scrolled itself to 255 to show the new row, `main` stayed at 0, the board
stayed at 81, and the bar came back with the engine's reply at -0.5.

**No DOM test can hold this.** jsdom has no layout, so every rectangle in a DOM test
is zero and both the broken and the fixed version scroll nothing. That is why the
arithmetic came out into a module of its own: a number is testable where a scroll is
not, and `keep-in-view.test.ts` pins it. The behaviour itself is pinned by the
measurement above, which is the only instrument there is for it.

**Decided (code shape).**

- **`Shell` calls `useDevScene`, not `App`.** The chip says `App`, for the ordering:
  the scene's storage writes have to land before the hooks that read storage. A state
  initializer runs during its own component's render, and hooks run in order, so the
  first line of `Shell` is as early as `App` is for that purpose. It also has to be
  `Shell`, because `renderApp` mounts `Shell` and not `App` (`App` builds the real
  provider with no way in), and the chip's own DOM tests set the address and then
  call `renderApp`. One place either way; this is the place both callers reach.
- **The hook returns the scene's hint flag, not the whole request.** The chip's
  `SceneRequest` would have made `Shell` ask `SCENES` what the scene wanted, and one
  live reference to that table from a module the app always imports would put the
  scenes' moves in the shipped bundle. Everything else a scene says is in storage by
  then, and the screen reads storage as it always does. So `DevScene` is `{ hint }`
  and nothing about `src/dev` reaches `src/ui` but a boolean.
- **`rememberSide`, `rememberBoardSize` and `rememberTheme` rather than exported key
  strings.** The chip says to export the key constants so nothing in `src/dev` writes
  a key string. This goes one step further in the same direction: the key never
  leaves the module that owns it, and the hook and the dev harness write a setting
  through the same function. The hooks lost a `useCallback` each in the process,
  because a module function is already stable.
- **`oneOf` in `prefs.ts`, and `readOneOf` now asks it.** "Is this one of these
  words" was about to be written a second time in `src/dev`, for the address bar
  rather than for storage. It is the same question, so it has one home, and the
  mutation check above shows both callers going through it.
- **`THEMES` in `theme.ts`**, beside the type and the key, so the two theme words are
  not written out twice. `SIDES` and `BOARD_SIZES` already existed for their pairs.
- **The scenes write storage and nothing else.** No second way into the provider, no
  dev-only branch in `Shell` deciding where a game comes from. A scene is a game the
  app was closed on, which the app already knows how to reopen, so the path a scene
  exercises is the path a person uses. The hint is the single exception, because it
  is a question asked of the engine rather than a fact about the game, and `Shell`
  asks it in one line after the mount start resolves.
- **`applyScene` is idempotent rather than guarded.** StrictMode runs the initializer
  twice in development; writing the same three keys and the same game twice is the
  same as writing them once.
- **The scene's level is `DEFAULT_LEVEL`.** The chip says 4, which is what
  `DEFAULT_LEVEL` is. A scene shows the app as it comes and the sidebar's level is
  one of the things being looked at, so it reads the constant rather than repeating
  the number.
- **`midgame` is twenty moves of a closed Ruy Lopez**, checked against chess.js by
  the test beside it. A real opening rather than an invented one, because a move list
  full of nonsense is hard to read past when the list is the thing being looked at.
  It is nobody's authored line: it came from the opening's own main line, not from
  the trainer.
- **The address is reset in `scenes.dom.test.tsx`, not in `dom-setup.ts`.** The
  address is global to a run the way `localStorage` is, and `dom-setup.ts` would be
  the symmetric place. It is byte-identical to the trainer's (S3), and one `afterEach`
  in the only file that touches the address is not worth making it adapted.

**Departures from the chip.** The two above: `Shell` rather than `App`, and the hook
returning the hint rather than the request. Both are code shape and both have their
reason recorded. Nothing else.

**Asked of Nick.** Nothing. The one thing a person can see that was not settled - the
board's top rank scrolled out of sight - is a fault rather than a choice: spec 4.2
sizes the board to FIT the space it is given, so a board that does not fit is not a
design question. No number in spec 4.2 changed.

**Reuse review.** `oneOf` is now the only membership check and `readOneOf` is its
first caller. The three `remember*` functions are the only writers of their keys, and
no key string appears in `src/dev`. `SIDES`, `BOARD_SIZES` and `THEMES` are each one
list. `SCENES` is the only place a scene's moves are written down, and
`sceneFromLocation` the only place the address is read. `scrollToShow` is the only
scroll arithmetic. `canReplayMoves` still checks every move list, including the
scenes' in their test. `rememberGame` writes every remembered game, the dev harness
included. No pixel number or colour in a `.ts` or `.tsx`; `scripts/probes/layout.js`
names selectors and is not under `src/`. No React under `src/play`, `src/model` or
`src/engine`. No em dashes under `src/`. No new or adapted file says "trainee",
"student", "repertoire", "course" or "book".

**Copies.** `scripts/packaged-eval.mjs` is the trainer's, byte-identical below one
`Origin:` line (`diff` against `../London/scripts/packaged-eval.mjs` is empty).
Nothing in this repo runs it until phase 8. Everything else this phase is new.

**Left.**

- **`packaged-eval.mjs`'s usage comment names `repertoire-trainer.exe`**, and its
  examples name the trainer's phases, because it is an identical copy and S3 says an
  identical copy is identical. Phase 8 runs this app's own executable; the line above
  it is the trainer's history, not an instruction.
- **The `mate` scene's bar carries no number.** A mated position has no legal move,
  so the engine returns no candidate and there is nothing to show; and a game that
  arrived whole is evaluated at its final position only (ruled at gate 4), so there
  is no earlier number behind it either. A game played INTO checkmate has one, from
  the position before the mate. Both are the rules working. Worth knowing when the
  screenshot is looked at.
- **The `promotion` picker cannot be opened without a drag**, and the drag is
  synthetic. Chessground ignores synthetic events unless `trustAllEvents` is on,
  which it is in development builds only, so this works in the pane and does not
  weaken the shipped build.

### Gate 6 findings (orchestrator, 2026-09-12)

- **Verified from the repo.** `npx vitest run`: 28 files, 243 passed, 2 skipped, 7.8
  seconds. `tsc -b` clean, `npx oxlint` silent, `npm run build` clean at 317.1 kB.
  The built assets contain no `midgame`, `Qxf7`, `axb8` or `scene`.
  `scripts/packaged-eval.mjs` is byte-identical to the trainer's below its origin
  line. No key string under `src/dev`; the only import of `src/dev` from the app is
  `Shell`'s one hook. No forbidden words outside identical copies; no browser global
  in the pure folders; `localStorage` only in `src/storage`; no pixel number or colour
  in code. `../London` and `../Conquest` untouched.
- **Mutation-checked.** Dropping the scene's theme write turns "applies the settings
  the address carries" red. Restored from git. The builder's six are taken on its
  account.
- **Driven in the pane at 1180 by 820**, the viewport where the fault lived:
  `?scene=midgame&size=large&theme=light` opened in light with Large ticked, twenty
  rows in the list, the list scrolled to 232 and `main` at 0, the board at y 80.67
  and 624 tall with the bar and `cg-board` ending on 704.67 together, `scrollWidth`
  1180 against 1180, the display scale 1.5 (624 divides at 1.5, so no step down). The
  probe was fetched from the dev server and evaluated, as `testing.md` says to.
  `?scene=hint` opened with a blue arrow (`bluea1a2`) and "The engine suggests Ra2."
  from the real engine; `?scene=mate` opened on "You won by checkmate" with Redo and
  Hint greyed, Undo live, and the list ending `4. Qxf7#`. Storage cleared.
- **The layout fault was real, and the fix is the right shape.** `scrollIntoView`
  scrolls every scrollable ancestor; above 900 by 700 the shell's `main` is one, and
  on an iPad in landscape the sidebar is taller than it. The board's top rank was off
  the screen from the moment the app opened at that size, through five phases of
  green tests, because jsdom has no layout. The arithmetic is now a pure function
  with a test, the list scrolls itself, and the probe is the instrument for the rest.
  That is the whole reason section 15 exists, and it earned its place here.
- **The builder's two departures are right.** `Shell` rather than `App` calls the
  hook, because `renderApp` mounts `Shell` and the ordering argument holds there
  too; the hook returns a boolean rather than the request so no live reference to
  the scene table can reach the shipped bundle. Both reasons are recorded.
- **Small moves accepted:** `oneOf` under `readOneOf`, one `remember*` writer per
  setting with the key never leaving its module, `THEMES` beside `SIDES` and
  `BOARD_SIZES`, the address reset in the one test file that touches it.
- **Left, cosmetic:** `dom-setup.ts` still stubs `scrollIntoView`, which nothing
  calls any more. It is an identical copy of the trainer's; the stub is harmless and
  the copy rule says leave it. Noted so nobody wonders.

- [x] **Review gate 6 passed** (2026-09-12)

### Phase 7 - builder notes (2026-09-12)

The session was compacted before this phase. Every document the chip named was read
fresh before anything was touched, and so were Conquest's `vite.config.ts`,
`index.html`, `src/vite-env.d.ts`, `src/ui/useUpdate.ts`, `UpdateBanner.tsx`,
`updates.ts`, `updates.test.ts`, `tools/make-icons.mjs`, `docs/conquest-deploy.md`
and the `.update-bar` rules in `src/ui/styles.css`.

**Measured.**

- `npx vitest run`: 30 files, 250 tests passed and 2 skipped, 8.2 seconds warm. By
  project: `string` 20 files, 197 passed, 2 skipped; `dom` 10 files, 53 passed.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean.
- **The build makes the two files that matter.** `dist/manifest.webmanifest` (453
  bytes) and `dist/sw.js` (2,207 bytes) with `dist/workbox-2fbc6a65.js` beside it.
  The precache list holds **21 entries, 7,518.96 KiB**, and names both engine files:
  `engine/stockfish-18-lite-single.wasm` (7,295,411 bytes) and
  `engine/stockfish-18-lite-single.js` (21,429 bytes). Six of the 21 are the icons
  and the manifest listed twice, once by `includeAssets` and once by the globs, with
  the same revision each time, which Workbox folds back into one; fifteen files are
  precached. The main chunk is 319.66 kB against phase 6's 317.10, and the 2.5 kB is
  `workbox-window` plus the banner.
- **S11, shown red.** With `maximumFileSizeToCacheInBytes` taken out and the site
  rebuilt, Vite says "engine/stockfish-18-lite-single.wasm is 7.3 MB, and won't be
  precached" and `sw.js` no longer names it. The line was put back and the build
  re-run. That is the difference between an app that plays offline and one that
  opens offline and hangs.
- **The offline proof, driven in the pane.** `npm run build`, then the
  `simple-chess-preview` configuration on 5186. Opened at 1280 by 1000:
  `navigator.serviceWorker.getRegistrations()` gave one registration, scope
  `http://localhost:5186/`, script `/sw.js`, state `activated`, nothing waiting. One
  move played on the real board by clicking e2 and then e4 (the pane's clicks are
  real input, so chessground takes them in a production build, where a synthetic
  drag would be ignored): the engine answered `Nf6`.
  Then `preview_stop`, and the page reloaded with the server down. **It opened on the
  game it was closed on** (1. e4 Nf6, the bar at +0.5), and `2. d4` was played and
  **the engine answered `e5`** with the bar moving to +0.8. In the same breath, a
  `fetch` of a path that was never stored came back "Failed to fetch", which is what
  says the server really was down, and the engine's own JavaScript reported
  `deliveryType: "cache-storage"` with a transfer size of 0. The WASM is fetched
  inside the worker, so it does not appear in the page's resource list; the engine
  answering at all is what proves it.
- **No worker in a development build.** On 5185,
  `navigator.serviceWorker.getRegistrations()` is empty, which is `devOptions:
  { enabled: false }` working.
- **The banner, looked at**, at `?pretendUpdate`, both themes, two viewports:

  | Viewport | Theme | Banner | scrollWidth vs innerWidth |
  |---|---|---|---|
  | 1280x1000 | dark | 1280 x 85, bottom 1000 | 1280 vs 1280 |
  | 1280x1000 | light | 1280 x 85, bottom 1000 | 1280 vs 1280 |
  | 820x1180 | light | 805 x 85, bottom 1180 | 805 vs 820 |
  | 820x1180 | dark | 805 x 85, bottom 1180 | 805 vs 820 |

  It sits across the bottom over the page, the heading bold and the sentence under it
  in `--text-dim`, "Not now" as a plain button and "Load it" in the accent green at
  the right. Pressing "Not now" removed it and left the page as it was. **The board
  did not move at any of them**: the bar, `.board` and `cg-board` still end on 496.67
  together at 1280 by 1000 and at 820 by 1180, which are phase 6's numbers, and
  `scrollWidth` never exceeded `innerWidth`. The display scale read 1.5 in these
  rows, because they were measured some time after the navigation rather than
  straight after one.
- **The icons, looked at in the pane** by URL from the dev server. `favicon-32.png`:
  a rounded dark square with a pale knight's head, the ears and the muzzle still
  telling it apart from a bishop or a pawn at that size. `apple-touch-icon.png`: the
  same knight square-cornered at 180, filling the square with 22 px clear all round,
  which is what iPadOS wants because it rounds the corners itself.
- **Red first, four times**, each restored and re-run green.
  Taking "remembered" out of the notice's detail turns `updates.test.ts` red, and the
  DOM test's "offers it, and says it costs nothing" with it, which is what says the
  two files agree about the wording.
  `updateServiceWorker()` without its `true` turns "takes the new version on Load it"
  red: without the argument the waiting worker stays parked and the button does
  nothing a person can see.
  Dropping `!isDesktop() &&` in `Shell` turns "shows no bar and registers nothing"
  red, which is S12 proved rather than asserted.
  A "Not now" that does not dismiss turns "goes away on Not now" red.
- `git -C ../London status` and `git -C ../Conquest status` show the same two
  untracked files every gate since 3 has seen, both dated 2026-09-11. Nothing under
  either folder was changed.
- **The pane's storage was cleared, the service worker unregistered, the Workbox
  cache deleted, the viewports reset and both servers stopped.**

**Decided (code shape).**

- **The icon is the board's own knight, not a drawing of one.** The cburnett white
  knight's two body paths, filled and stroked in `--piece-white` on `--ground`, with
  the third path (the eye and the nostril) dropped: at 32 px those are a third of a
  pixel, and what has to read at that size is the silhouette. The piece set is GPL,
  which this app already carries (S22), and the icon on the Home Screen is then the
  same piece the user drags.
- **The rounded icon is a clip, not a second drawing.** Conquest draws its art twice,
  square and rounded, because the art is generated. Here the art is a committed file,
  so `make-icons.mjs` wraps its content in a group with a rounded clip path. One
  drawing, four renderings, and nothing that can drift from `icon.svg`.
- **`virtual:pwa-register/react` is faked in the dom project, not in each test.** The
  chip says to mock it at the top of the test file. That works for one file, and the
  trouble is that every DOM test mounts the app and the app now imports it: the first
  run after wiring the banner failed eight suites at import with "The argument
  'filename' must be a file URL object, file URL string, or absolute path string".
  So `src/test/pwa-register.ts` stands beside `fake-engine.ts` and `board-stub.tsx`,
  aliased by the dom project, and says no version is waiting. `update.dom.test.tsx`
  still mocks the same id itself, to say one is. The chip's other half is kept: the
  plugin is NOT in the vitest projects.
- **The page's four padding values are named.** The update bar needs the same
  safe-area insets on three sides as `.app` has on four, and the chip's reuse note
  asks for one home if they appear twice. They are now `--pad-top`, `--pad-right`,
  `--pad-bottom` and `--pad-left` on `.app`, and the bar uses three of them. The
  bar's words line up with the board's left edge because it is the same value, not
  because both rules say 24.
- **`button.primary` is copied from the trainer**, `drill.css` line 121, which is
  where `button:disabled` already came from. Conquest's banner gives its confirm
  button emphasis, and the class was going to be in the markup whether or not a rule
  answered it; a class with no rule is worse than either.
- **`lang: 'en-AU'` in the manifest.** Neither the chip nor the spec names it, and
  the plugin's default is `en`. `index.html` says `en-AU` and the app is written in
  Australian English, so the manifest says the same.
- **`includeAssets` is kept although the globs already match all three files.** It
  costs six duplicate precache entries that Workbox folds away, and it keeps the
  three files index.html links to precached if the globs are ever narrowed. There is
  a comment saying so, because "21 entries" for fifteen files looks like a fault.
- **The banner is rendered inside `.app`, after `<main>`.** It is `position: fixed`,
  so where it sits in the markup decides nothing about where it is drawn; but it
  inherits the four padding properties there, and a screen reader meets it after the
  screen rather than before it.

**Departures from the chip.** The fake's home (the dom project rather than nine test
files) and the rounded icon being a clip. Both are code shape and both have their
reason above. Nothing else.

**Asked of Nick.** Nothing. The two things a person sees that the chip did not settle
are the knight's shape, which it says is mine, and the banner's colours, which are
this app's existing tokens rather than new ones.

**Reuse review.** `isDesktop` is still the only place `__TAURI_INTERNALS__` is read
by the app; `update.dom.test.tsx` sets that global rather than mocking `isDesktop`,
so the real check runs. The safe-area insets have one home. The manifest's two
colours are in `vite.config.ts`, which is config and not `src/`, and a grep for a hex
value or `rgb(` under `src/` in a `.ts` or `.tsx` still finds nothing. `updateNotice`
is the only place the banner's words are written down, and the DOM test reads the
rendered words rather than repeating them. No em dashes under `src/`. No new or
adapted file says "trainee", "student", "repertoire", "course" or "book".

**Copies.** `useUpdate.ts` is Conquest's with the comments rewritten for this app;
its code is identical line for line (diffed with comments stripped).
`UpdateBanner.tsx` is Conquest's less `gameInProgress`, which is the whole diff.
`updates.ts` and `updates.test.ts` are Conquest's shape with one notice.
`tools/make-icons.mjs` keeps Conquest's `wanted` table and its comment about iPadOS
rounding the corners; the art half is this app's. `vite-env.d.ts` is Conquest's two
reference lines. The `.update-bar` rules are Conquest's with this app's colour names.

**Left.**

- **Box 7.8 is Nick's**, and so is everything in `docs/simple-chess-deploy.md`: the
  GitHub push, the Cloudflare Pages project with its `NODE_VERSION`, the DNS record,
  the Home Screen add, and the aeroplane-mode game. The document leaves the "It is
  live" date and the two `pages.dev` names blank for him to fill in.
- **The manifest's `description` repeats `package.json`'s.** It is eight words and
  the two files cannot import from each other at that point in the build, so it is
  written twice on purpose rather than by oversight.
- **Node on this machine is 20.20.2 and `.node-version` says 22.12.0.** Vite 8
  accepts either (`^20.19.0 || >=22.12.0`), so every bar in this phase is green on
  20.20.2. Cloudflare will use 22.12.0 from the file. Worth knowing if a build ever
  differs between the two.
- **`git checkout --` is not the way to undo a mutation in this phase's files.** Half
  of them are new and untracked, so it fails; the other half are tracked and it takes
  the phase's own work with them. Both happened here and both were put back by hand
  before the bar was re-run. Each mutation is now undone by the reverse edit.

### Gate 7 findings (orchestrator, 2026-09-12)

- **Verified from the repo.** `npx vitest run`: 30 files, 250 passed, 2 skipped, 8.3
  seconds. `tsc -b` clean, `npx oxlint` silent, `npm run build` clean with `sw.js`
  (2,207 bytes) and the manifest (456 bytes); the precache list names both engine
  files; the manifest carries the name, `standalone`, `en-AU`, the two colours and the
  three icons. `useUpdate.ts` is Conquest's line for line with the comments stripped.
  No forbidden words outside identical copies; no browser global in the pure folders;
  `__TAURI_INTERNALS__` read in one place; no colour in a `.ts` or `.tsx` under
  `src/`. `../London` untouched.
- **Mutation-checked.** Dropping the `!isDesktop() &&` in front of the banner turns
  "shows no bar and registers nothing" red. Restored from git. The builder's four are
  taken on its account.
- **The offline proof, repeated by the orchestrator.** Built, served on 5186, opened
  twice (the second load is what activates a `prompt` worker): one registration,
  `activated`, scope `/`, one Workbox cache. 1.e4 by two real clicks on the production
  board, the engine answered e5. The server was stopped. The page reloaded on
  `1. e4 e5` at +0.4 with a fetch of an unstored path failing; 2.d4 by two clicks and
  the engine answered d6, its script delivered from `cache-storage` with a transfer
  size of 0. The worker was then unregistered, the cache deleted and storage cleared,
  and the tab closed.
- **The engine-in-precache rule is the one that matters here**, and the builder
  showed it red: without `maximumFileSizeToCacheInBytes` Vite says in one line that
  the WASM "won't be precached" and the offline app would hang on its first move. The
  proof plays a move for exactly that reason.
- **The builder's departures are right.** The virtual module faked once in the dom
  project rather than in nine test files; the rounded icon as a clip over the one
  committed drawing; `lang: 'en-AU'` in the manifest; the four page paddings named so
  the bar shares three of them; `button.primary` copied from the trainer beside
  `button:disabled`.
- **A file appeared under `../Conquest` during this gate**,
  `src/engine/players/zz-table-probe.test.ts`, written at 14:19 today, five minutes
  after this phase's commit. Its header names a Conquest plan task and a scratchpad
  path belonging to a session rooted in `C:\Users\nick2\code`, not this one. It is
  another session's throwaway and not this builder's; nothing under Conquest was
  touched from here. Noted so the next gate's "same two untracked files" line is
  not misread.
- **Box 7.8 is Nick's**, and every step in `docs/simple-chess-deploy.md` says so at
  the top: the GitHub push, the Cloudflare Pages project with its `NODE_VERSION`
  variable, the DNS record, the Home Screen add, and the aeroplane-mode move.

- [x] **Review gate 7 passed** (2026-09-12)
