# Tabiya Player - build plan

Version 4, 2026-10-19. Status: **Active.** **Phase 20 (spec section 24) took the app public as Tabiya Player**, MIT, desktop only; everything below it is the record of building it as Simple Chess and then Simply Chess, and keeps those names. Version 1 (phases 0 to 8) is built and every
gate passed by 2026-09-12; its boxes 7.8 and 8.6 are Nick's. Version 2 (phases 9 to 12,
spec section 18) made the app Simply Chess, a sibling of the trainer's Play screen, and
shipped as 1.1.0 on 2026-09-13 with every gate passed. Phase 13 (spec section 19) landed 2026-09-14 and
passed its gate the same day: Nick used 1.1.0 and asked for the report to have the room,
so every control moved under the board and the report took the side panel, and 1.2.0 was
built and its installer made. **Phase 14 landed 2026-09-14 and passed its gate the same
day**: Nick used 1.2.0 and corrected three placements (spec Q27), so the two view toggles
went back to the header, New game joined Play as and the stepping arrows moved to the
board's bottom right corner. 1.2.1 is built and its installer made. **Phase 15 landed
2026-09-14 and passed its gate the same day**: Nick shrank the window, found the board size toggle inert, and ruled that
the window should change to match the board (spec section 20). It does, both ways, and
**1.3.0 is built with its installer**. **Phase 16 landed 2026-09-14 and passed its gate the same day**: the window it
asked for was a scrollbar short of what the layout needs, so the report landed under the
board after an automatic resize; it now carries the allowance of spec S23 and the report
stays beside the move list. **1.3.1 is built with its installer.** **Phase 17 landed 2026-09-14**: 1.3.1's window
allowed for the scrollbar and nothing else, so the side panel was squeezed onto the pixel
where its own contents round past it and a LOADED game, reviewed, scrolled the page
sideways. The allowance is now 64 (spec S24) and **1.3.2 is built with its installer**.
**Phase 18 landed 2026-09-14**: the window was declared at 1400 by 980, which is between
the two automatic sizes and therefore matches neither, so the launch now asks the same
question the toggle does (spec S25) and **1.4.0 is built with its installer**. **Phase 19 landed 2026-09-14**: a report longer than the
board made the whole window scroll, so the side panel is now a column that scrolls itself
like the move list (spec S26) and **1.4.1 is built with its installer**. Every phase in
the plan is complete and the only open boxes are Nick's.

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

- [x] 8.1 `src-tauri/`: `tauri.conf.json` (productName "Simple Chess", identifier
      `com.nick.simple-chess`, devUrl 5185, the window per spec 11.1 with
      `"create": false`, nsis `currentUser` with `installerHooks`, `csp: null` as the
      trainer), `Cargo.toml` (package `simple-chess`, lib `simple_chess_lib`),
      `build.rs`, `src/main.rs`, `src/lib.rs` identical but for `LOCAL_FOLDER`,
      `capabilities/default.json` per spec 11.4, `.gitignore`.
- [x] 8.2 `installer-hooks.nsh` with one folder, and `scripts/check-uninstall-hook.
      mjs` adapted to one folder. Run the check: four cases, only the ticked
      non-upgrade case removes the scratch folder. Record the output. *(Four PASS
      lines; the `$UpdateMode` half taken out turns case 2 red, and back.)*
- [x] 8.3 Icons: `npx tauri icon public/icon.svg` (or the 512 PNG) into
      `src-tauri/icons/`. *(The SVG was taken; the set matches the trainer's.)*
- [x] 8.4 `version.test.ts`: unskip the two Tauri tests. Set 1.0.0 in all three
      files. *(Four tests live; the bump is its own commit.)*
- [x] 8.5 `npx tauri build`. Record the installer's path and size. Start the built
      executable with the debug port and run the probe through `packaged-eval.mjs`;
      `--shot` the window. Save a game through the real dialog and load it back: the
      desktop half of phase 5.7. *(Built, probed and looked at; Hint answered from
      the engine inside the window. The two dialogs went to 8.6: they are windows on
      the screen and nobody was at it.)*
- [ ] 8.6 Nick: run the installer, open the app, play a move, save and load a game,
      close and reopen to see the game remembered. Uninstall with the box ticked and
      confirm `%LOCALAPPDATA%\Simple Chess Data` is gone. Record the date here.
- [x] 8.7 Acceptance walk: spec 17, item by item, each with what was done to check
      it, in `docs/acceptance.md`. *(It found one hole, in S15 item 10.)*
- [x] 8.8 Reuse review, docs sweep (spec, plan, testing, deploy, README, CLAUDE.md
      current), commit.

**Done when:** spec 17 is green in `docs/acceptance.md`, with 7.8 and 8.6 dated by
Nick.

---

## Phase 9 - Simply Chess, and the trainer's layout

**Goal: the app is called Simply Chess everywhere a person sees it, and the screen is
laid out as the trainer's Play screen (spec 18.1): the difficulty in a selector row
under the header, the board size toggle beside Light/Dark, the head row with the
opening line and the status, the move list in its own column, the side panel with
Play as and the file buttons.**

Read first: spec 18 (all of it), 4.2, S2; `../London/src/ui/App.tsx` (the course
switch row), `catalog.css` (`.course-switch`), `Play.tsx` (`PlayHead`, `openingLine`,
`MoveList`'s column), `play.css` (`.play-head`, `.play-opening`, `.move-list`,
`.play-side`).

- [x] 9.1 The rename (spec 18.2): every name a person sees, the folder in its three
      files and its test, the identifier, the package name, the storage keys, the
      manifest, the icon script's comment, the README and CLAUDE.md. The scenes and
      the deploy document follow. `git grep -i 'simple chess'` finds only history.
- [x] 9.2 The header: the board size toggle beside the theme toggle, one button that
      reads the OTHER size, in the `theme-toggle` style; the Board fieldset leaves the
      side panel.
- [x] 9.3 The selector row: the trainer's `.course-switch` with "Difficulty" and the
      select; the two description sentences into the select's `title`.
- [x] 9.4 The head row: the trainer's `.play-head` without its heading; the opening
      line "Playing White against 4. Club" from the running game; the status line
      beside it.
- [x] 9.5 The move list as its own column, 167 px, board height, between the board
      column and the side panel; the side panel as `.play-side` with Play as and the
      file buttons.
- [x] 9.6 The window 1400 by 980, minimum 960 by 720; the fit rule's chrome constants
      re-measured (above: header, selector row, head row; beside: bar, gap, list column,
      side panel minimum, gaps; below: both button rows), named, and the fit tests'
      expected numbers updated with the arithmetic shown.
- [x] 9.7 The narrow layout: three columns stacked; the two rows wrap.
- [x] 9.8 The scenes and the probe follow the new selectors; the twelve-row layout pass
      again, both sizes, both themes, three viewports; S16 holds.
- [x] 9.9 Reuse review and commit. Version stays 1.0.0 until phase 12.

---

## Phase 10 - stop, review, the report

**Goal: a game can be stopped and reviewed, or stopped and discarded; the report says
what the engine thought of your moves; Copy game and Save game write the report's
comments.**

Read first: spec 18.3, 18.5, 18.6; `../London/src/play/report.ts` (`scanForSlips`,
`buildReport`, `verdictInWords`, `verdictBand`, `describeSlip`, `SLIP_THRESHOLDS`),
`session.ts` (`scanGame`), `game-pgn.ts`, `Play.tsx` (`PlayActions`, `Report`,
`EvalBar`, `CopyGame`, `toClipboard`), `play-context.tsx` (`finish`, `discard`,
`scanning`, `bestMovesRef`), `play.css` (`.report`, `.slips`, `.eval-bar`,
`.copy-game`, `.play-actions`).

- [x] 10.1 `src/play/report.ts`: the trainer's, cut to the chess half: `PlayedMove`
      stays in `session.ts`; `scanForSlips`, `buildReport` (no deviation), the verdict
      functions, `describeSlip`, `SLIP_THRESHOLDS`, `MoveReview`, `GameReport`. The
      hint count on the session (`hints`), counted in `askHint`.
- [x] 10.2 `scanGame` from the trainer's `session.ts`, identical text, in
      `src/play/scan.ts`; it takes the bar's evaluations and best moves as `known`.
      The provider keeps `bestMovesRef` from every `evaluate`, as the trainer does.
- [x] 10.3 The provider: `finish` (scan, build, set the report), `discard` (a fresh
      game, the remembered one forgotten), `scanning`, `report`, `inProgress`. Undo,
      Redo, Hint and the file buttons disabled during a scan.
- [x] 10.4 `PlayActions` in the side panel: Stop and review / Review the game, Stop and
      discard, the "Review it" notice for an ended game; `Report` with Your moves and
      The final position; the horizontal `EvalBar`; `CopyGame` with `toClipboard`.
- [x] 10.5 `game-pgn.ts` grows the trainer's comments when a report is given; Save game
      and Copy game share it; the hint count in the file and the report.
- [x] 10.6 Tests: S15 items 12, 13, 17 and 19; the trainer's `report` tests for the
      slips and the verdict bands copied where they apply.
- [x] 10.7 Drive in the pane: a game with a deliberate blunder, stopped and reviewed;
      the slip named; the verdict; Copy game's text; both themes.
- [x] 10.8 Reuse review and commit.

---

## Phase 11 - the review viewer, Keep playing, Play from here

**Goal: after the review the move list is the trainer's viewer, and the two ways on
from a reviewed game exist.**

Read first: spec 18.4; `../London/src/play/replay.ts`, `src/ui/play-from-replay.ts`
and its tests, `Play.tsx` (`MoveList` with `activePly`, `PlayControls` row two,
`ReplayControls`, `preferredShapes`, the arrow-key effect), `play-context.tsx`
(`replayPly`, `resume`, `canResume`), `play.css` (`.move-step`, `.play-review-row`,
`.play-steps`, `.step-arrow`, `.jump`).

- [x] 11.1 `src/play/replay.ts` gains the trainer's `positionAtPly`, `moveAtPly`,
      `clampPly`, `plyBeforeMove`, `plyAfterMove`, identical text.
- [x] 11.2 The provider holds `replayPly`, cleared with the report; `resume` (Keep
      playing) and `canResume`; a path for Play from here that starts a new game from
      the viewed position with the same side and level and forgets the old game.
- [x] 11.3 `MoveList` with `activePly`: buttons after the review, the marked row,
      scrolling itself; the slip buttons in the report jump the board.
- [x] 11.4 `PlayControls` row two: Keep playing, Play from here with the trainer's
      `whyNotPlayable` reasons, the two arrows; the arrow-key effect, never with a
      text field focused.
- [x] 11.5 `preferredShapes`: the better move as a blue arrow on a slip's position; the
      trainer's last-move highlight rule.
- [x] 11.6 Tests: S15 items 14, 15, 16; the trainer's replay and play-from-replay tests
      copied where they apply.
- [x] 11.7 Drive in the pane: review a game, click moves, step with the keys, Keep
      playing, Play from here; the probe with the review row showing (the board size
      must not change); both themes.
- [x] 11.8 Reuse review and commit.

---

## Phase 12 - version 1.1.0

**Goal: everything section 18 asks for is built, checked and shipped.**

- [x] 12.1 The three findings of gate 11, which land before the version bump.
      **Play from here is off at the start of the game**, which spec 18.4 asks for and
      the trainer has no rule for: `whyNotPlayable` answers "This is the start of the
      game. Use New game." at ply 0, with a test for it and the DOM test's ply-0 case.
      The dead `walkable` class goes from `MoveList`. The double blank line in
      `play-context.tsx` goes.
- [x] 12.2 The acceptance walk (`docs/acceptance.md`) extended with 18.7's items and
      re-checked where earlier items changed (the screen, the file).
- [x] 12.3 Version 1.1.0 in the three files; `npx tauri build`; the packaged window
      driven again with the probe and the one screenshot; the installer's path and size.
- [x] 12.4 The deploy document updated for whichever of Q22's options Nick chooses,
      when he chooses. Until then it documents both.
- [x] 12.5 Docs sweep (spec, plan, testing, deploy, README, CLAUDE.md) and commit.
- [ ] 12.6 Nick: install 1.1.0 over 1.0.0 (the settings and the game survive), play,
      review a game. Record the date here.

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

---

## Phase 13 - room for the report

**Goal: every button and toggle is under the board, the report has the side panel to
itself and reads in the head row's colour, and the selector row lines up with the
heading. Spec section 19.**

Read first: spec section 19 all of it, then 18.1 (the layout it replaces) and S2 (the
fit rule). `src/ui/App.tsx` (the header and the nav), `src/ui/DifficultyRow.tsx`,
`src/ui/SidePanel.tsx`, `src/ui/PlayActions.tsx`, `src/ui/PlayControls.tsx`,
`src/ui/Screen.tsx`, `src/ui/board-size.ts`, `src/ui/app.css` and `src/ui/play.css`.

- [x] 13.1 The four rows under the board, in S19's order and grouping: the game, this
      game (the actions or the review row), the file, the settings with the two toggles
      at the right-hand end. Every row the width of the board at both sizes.
- [x] 13.2 The side panel holds the hint sentence and the report, nothing else, and the
      report starts at the top of the column. `SidePanel.tsx` goes or becomes the row
      it now is; `PlayActions` moves under the board.
- [x] 13.3 "Applies to the next new game." moves into the Play as control's `title`.
- [x] 13.4 The report's words take `--text-soft` at the body size and weight (S20). The
      slips' left edges, the tag colours and the bar are untouched.
- [x] 13.5 The selector row is left aligned under the heading (Q26).
- [x] 13.6 `CHROME_BELOW` re-measured at the large board with a report showing, which is
      the state with the most rows, and the new large board size recorded. Nothing else
      in `board-size.ts` changes.
- [x] 13.7 Tests: S15 items 20, 21 and 22; every test that reaches a moved control
      through the old markup updated rather than deleted.
- [x] 13.8 Driven in the pane at the three viewports of 15.2, both sizes, both themes,
      with the probe: S16's two numbers hold, no row is wider than the board, and the
      report's colour is the head row's. Both states of row 2.
- [x] 13.9 Version 1.2.0 in the three files, the docs swept, the reuse review, commit.

---

## Phase 14 - the three placements, corrected

**Goal: the two view toggles are back in the header, New game sits with Play as, and the
stepping arrows end the first row under the board. Spec Q27 and the S19 it corrects.**

Read first: spec section 19, all of it, and Q27 in particular; then 18.1, whose header
this restores. `src/ui/App.tsx`, `src/ui/SettingsRow.tsx`, `src/ui/PlayControls.tsx`,
`src/ui/app.css`, `src/ui/play.css`, and the same files at `fccab21`, which is the
commit before phase 13 and holds the header this brings back.

- [x] 14.1 The board size and theme toggles return to the header, in the trainer's
      `theme-toggle` style, restored from `fccab21` rather than rewritten: `.app-nav`,
      `.nav-link`, `.nav-link:hover` and `.theme-toggle` come back to `app.css`, and the
      nav markup to `App.tsx`.
- [x] 14.2 New game moves from row one to row four, at its left edge, beside Play as.
- [x] 14.3 The two stepping arrows move from row two to row one, right justified, so
      they end at the board's bottom right corner. The `margin-left: auto` rule already
      does this and is not rewritten.
- [x] 14.4 Tests: S15 item 23, and items 20 and 22 updated to say "every control except
      the two view toggles". Nothing else about them changes.
- [x] 14.5 Driven in the pane at 1400 by 980, both sizes, both themes, both states of
      row two, with the probe: S16's two numbers hold, no row wider than the board, and
      the board is the SAME size as 1.2.0's, because the row count has not changed.
- [x] 14.6 Version 1.2.1 in the three files, docs swept, reuse review, commit, and the
      installer built.

---

## Phase 15 - the window matches the board

**Goal: choosing a board size sets the Windows window to the size that board needs, both
ways, and the toggle is never inert again. Spec section 20.**

Read first: spec section 20 all of it, then S2 in section 4 (the fit rule), S14 (Tauri
imported lazily) and 11.4 (the capability). `src/ui/board-size.ts`,
`src/ui/use-board-pixels.ts`, `src/ui/App.tsx`, `src/storage/paths.ts` for how a Tauri
API is reached today, and `src-tauri/capabilities/default.json`.

- [x] 15.1 A pure function that answers the window size a board needs, with the work
      area, the window frame, the minimum size and the move back inside all in it, and
      its test. No browser and no Tauri in it.
- [x] 15.2 The desktop half: read the monitor, the frame and whether the window is
      maximised; un-maximise if it is; set the size; move the window back inside the
      work area if it now hangs off. Imported lazily behind `isDesktop()`.
- [x] 15.3 The toggle calls it, on both sizes, and does nothing extra on the web.
- [x] 15.4 The capability gains `core:window:allow-set-size`,
      `core:window:allow-unmaximize` and `core:window:allow-set-position`, and its
      description says what they are for.
- [x] 15.5 Tests: S15 items 24 and 25. No test starts a Tauri call.
- [x] 15.6 Driven in the pane (nothing resizes, the toggle still works) and then in the
      packaged window: shrink into the dead band, press Large, watch the window grow and
      the board become large; press Small and watch it go back to 1023 by 807. Both from
      a maximised window too.
- [x] 15.7 Version 1.3.0 in the three files, docs swept, reuse review, commit, installer.

---

## Phase 16 - the window the layout actually needs

**Goal: after either automatic resize, a reviewed game's report is beside the move list
where it belongs, not under the board. Spec section 21.**

Read first: spec section 21 all of it, then S21 and S2. `src/ui/board-size.ts`
(`innerSizeForBoard` and the chrome constants), `src/ui/window-size.ts`,
`src/ui/window-size.test.ts`, `src/ui/app.css` (`main` is the scrolling element),
`src/ui/play.css` (`.play-body` and `.play-side`).

- [x] 16.1 `innerSizeForBoard` adds the width allowance of S23, named and explained, with
      the height left exactly as it is.
- [x] 16.2 Tests: S15 item 26, and every existing number in `window-size.test.ts` that
      the allowance moves, updated with the reason in its comment.
- [x] 16.3 Driven in the packaged window at BOTH automatic sizes, with a real reviewed
      game on screen: the side panel's y equals the board's y, `main` does not scroll,
      and `scrollWidth` equals `innerWidth`. Both themes.
- [x] 16.4 Version 1.3.1 in the three files, docs swept, reuse review, commit, installer.

---

## Phase 17 - the pixel the panel rounds by

**Goal: a loaded game, reviewed, does not scroll the page sideways. Spec S24.**

Done in the orchestrator session at Nick's request ("fix it here, in this session"),
which is the one departure from the rule that this session builds nothing substantial.
It is one constant, its comment, six test numbers and a property.

- [x] 17.1 `WINDOW_ALLOWANCE` in `board-size.ts` is 64 where `SCROLLBAR_ALLOWANCE` was
      24, renamed because it is no longer only the scrollbar, with the measurements in
      its comment.
- [x] 17.2 The six numbers in `window-size.test.ts` that the allowance moves, each with
      its reason; S15 item 26 strengthened to hold the scrollbar AND the panel's room
      over its minimum, as a property rather than as 64.
- [x] 17.3 Version 1.3.2 in the three files.
- [x] 17.4 Proved in the shipped window with Nick's own file.
- [x] 17.5 Docs swept, committed, installer built.

---

## Phase 18 - the window opens at the size it will use

**Goal: the app lands on one of its two automatic sizes, whichever the remembered board
size names. Spec section 22.**

Done in the orchestrator session, as phase 17 was.

- [x] 18.1 `tauri.conf.json` declares 1087 by 807, the small board's own window, so a
      fresh install and every small-board launch open at the right size already.
- [x] 18.2 `windowForBoard` takes `atLaunch`, which centres rather than leaving the
      window where it is, and keeps every clamp it already had.
- [x] 18.3 The startup effect asks for the remembered size once, on mount.
- [x] 18.4 Tests: S15 items 27 and 28, including the declared size read out of
      `tauri.conf.json` and held against what the small board asks for.
- [x] 18.5 Version 1.4.0, proved in the shipped window with each size remembered.
- [x] 18.6 Docs swept, committed, installer built.

---

## Phase 19 - the report scrolls, not the window

**Goal: a long report scrolls inside its own column, with the board and the rows staying
where they are. Spec section 23.**

Done in the orchestrator session, as phases 17 and 18 were.

- [x] 19.1 `--board-pixels` moves from the move list to `.play-body`, so both columns
      beside the board read one number from one home.
- [x] 19.2 `.play-side` takes the board's height as a ceiling, scrolls vertically with
      the move list's own thin scrollbar, and scrolls one way only.
- [x] 19.3 The narrow layout keeps no ceiling: stacked columns, and the page scrolls
      there as it always has.
- [x] 19.4 Tests: S15 item 29, and the DOM helper that read the property off the list
      now reads it off the row.
- [x] 19.5 Version 1.4.1, proved in the shipped window with a report long enough to
      overflow its column.
- [x] 19.6 Docs swept, committed, installer built.

---

## Phase 20 - public, as Tabiya Player

**Goal: the app is Tabiya Player everywhere a person reads it, MIT licensed, installed in
place of Simply Chess, its source public, its installer on a release, and on Nick's
landing page. Spec section 24.**

Done in the orchestrator session at Nick's request, relayed from the Tabiya session and
confirmed by him directly: the name, desktop only, the data folder, and each outward step.

- [x] 20.1 The product name, the package names, the window title, the header, the PGN
      tag and default file name, and the data folder, in the files spec 24 lists; the
      identifier and the storage keys unchanged, with a comment at each saying why.
- [x] 20.2 MIT: `LICENSE`, `package.json`, `Cargo.toml`, and the README's Licence section
      with the Stockfish paragraph.
- [x] 20.3 The README rewritten for a stranger: what it is, the download with the
      unsigned-installer note, how to run and build it, how it was built, the licence.
- [x] 20.4 `.claude/launch.json` runs npm relatively, so the dev server survives the
      folder rename and a clone anywhere.
- [x] 20.5 **CORRECTED 2026-10-28: the install below happened only in this session's sandbox.**
      A Claude Code session's shell writes the registry and LocalAppData into a private copy,
      and reads them back from it, so the install and the checks that "confirmed" it agreed
      with each other and not with the machine. Read through Explorer on 2026-10-28, the real
      machine had no trace of this install. The build and the window's own checks hold; the
      word "installed" does not. Version 1.5.0 built and "installed": `Tabiya Player_1.5.0_x64-setup.exe`,
      6,902,875 bytes, registered as "Tabiya Player 1.5.0" at `%LOCALAPPDATA%\Tabiya Player`,
      holding `tabiya-player.exe` and its uninstaller, with a Start menu entry of its own.
      The INSTALLED window, driven over its debugging port: title and header "Tabiya
      Player v1.5.0", opened at 1087 by 807 with the 416 board, the bar reading +0.4 on the
      opening position so the engine answers, a fresh profile in `Tabiya Player Data`, no
      service worker, no sideways scroll.
- [ ] 20.5b **CORRECTED 2026-10-28: this uninstall also happened only in the sandbox.** On
      the real machine Simply Chess 1.4.1 was still registered, its files and uninstaller gone
      some other way, so its entry is dead; Nick chose on 2026-10-28 to remove it himself.
      What was reported: the old Simply Chess uninstalled, after Nick confirmed his game was saved,
      with `uninstall.exe /S`: a silent uninstall skips the confirm page, so the hook's
      `$DeleteAppDataCheckboxState` stays 0 and `Simply Chess Data` is left for him to
      delete. Afterwards the uninstall entry, the Start menu shortcut and the install
      folder were all gone, with no executable left behind, which the trainer's rename
      did leave. Only Tabiya and Tabiya Player are registered now.
- [x] 20.6 GitHub: `github.com/nick2468/TabiyaPlayer`, created private, pushed, tag
      `v1.5.0` with the installer on its release (sha256 `0adfeadf...f66cf668`, the same
      as the local file; GitHub names the asset `Tabiya.Player_1.5.0_x64-setup.exe`,
      because an asset name cannot hold a space), `/releases/latest` resolving to it,
      the licence detected as MIT through `gh api`, then made public. Fetched with no
      token, the repository, the latest release and the licence all answer 200. The
      release notes name the Stockfish build inside the installer and where its source
      is, because the binary carries GPL-3.0 obligations the source does not.
- [x] 20.7 Nick's landing page: an entry beside Tabiya with a Download link and no Play
      link, pushed as `nick2468@a3be821` and read back from GitHub. Tabiya's session added
      the link the other way, `Tabiya@5622b37`; this session does not edit `../Tabiya`.
- [ ] 20.8 Nick renames the folder `SimpleChess` to `TabiyaPlayer`, and the memory and
      the build cache follow it.

---

## Phase 21 - signed, with the notices the program owes

**Goal: version 1.5.1, signed by Open Source Developer Nicholas Walker, with the publisher
fixed for good, the licence notices inside the program, installed on the REAL machine
through its own windows, and released in place of the unsigned 1.5.0. Spec section 25.**

Requested by Nick through the Tabiya session on 2026-10-28 and done in the orchestrator
session, with his rulings on the questions it raised taken from him directly.

- [x] 21.1 The publisher and the copyright are Nicholas Walker in `tauri.conf.json`, and so
      is the holder in `LICENSE`, `package.json` and `Cargo.toml` (S28).
- [x] 21.2 The installer compresses with zlib (S29).
- [x] 21.3 About, the licence texts, the dependency list and the third-party notices,
      copied from Tabiya with an `Origin:` line each, and their tests (S30). Looked at in
      the pane at 1400 by 980 in both themes: the game screen unmoved by the extra toggle
      (board at y 167, bar, `.board` and `cg-board` ending on 583, no sideways scroll), About
      in its place with both licence boxes scrolling inside themselves, and the 20-move
      game back intact on Game.
- [x] 21.4 Signing: `src-tauri/tauri.signing.conf.json`, the certificate's public half,
      `npm run build:signed` and `docs/releasing.md`, from Tabiya, adapted. The preflight
      found the certificate as Open Source Developer Nicholas Walker, valid to 28 October
      2027.
- [x] 21.5 `scripts/upgrade-walk.ps1` and `.cmd`, from Tabiya, adapted: this product's
      names and keys, the log in `src-tauri/target/walk` rather than `%TEMP%`, which is
      inside the sandboxed LocalAppData.
- [x] 21.6 Version 1.5.1; the README says the installer is signed and names both GPL
      libraries.
- [ ] 21.7 The signed build, from a clean tree.
- [ ] 21.8 Walked on the real machine through Explorer: a fresh install, then a reinstall
      over the same version, the old uninstaller given the install folder.
- [ ] 21.9 v1.5.0 deleted; pushed, tagged, released; the asset is the walked file.
- [ ] 21.10 The Tabiya session told, for its downloads note.

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
| 8 - the Windows app and the installer | **Complete** 2026-09-12, gate passed the same day; box 8.6 is Nick's. 257 tests green. The window opens at 1280 by 1000 with the engine in it, the installer is 6.6 MB and installs for the current user, and the uninstaller's four cases are proved against a scratch folder. Version 1.0.0. |
| 9 - Simply Chess, and the trainer's layout | **Complete** 2026-09-13, gate passed the same day. 260 tests green in 7.9 s. The app is Simply Chess everywhere a person sees it; the screen is the trainer's Play screen, measured at three viewports, both sizes and both themes with S16 holding in all twelve rows; the window is 1400 by 980 and the chrome constants are 167, 120 and 607. |
| 10 - stop, review, the report | **Complete** 2026-09-13, gate passed the same day. 305 tests green in 14.4 s. A game can be stopped and reviewed or stopped and discarded; the report names each slip with the engine's better move and gives the final position a verdict in words; the hint count reaches the report and the file; Copy game and Save game write the same text. Driven against the real Stockfish in the pane. |
| 11 - the review viewer, Keep playing, Play from here | **Complete** 2026-09-13. 323 tests green in 16.3 s. A reviewed game is a viewer: every move is a button, the marked one is in `--mark`, the arrow keys step, the bar follows the position being looked at, and a slip's sentence puts the board where it was played from with the engine's move as a blue arrow beside it. Keep playing and Play from here both work. The board does not change size when row two appears. |
| 12 - version 1.1.0 | **Complete** 2026-09-13, box 12.6 is Nick's. 324 tests green in 9.2 s. Gate 11's finding fixed in `ce0e743`; 1.1.0 in the three files; the installer is 6,898,142 bytes and the shipped window was driven, reviewed and walked at 688 with S16 holding; `docs/acceptance.md` rewritten for version 2; both of Q22's routes documented. |
| 13 - room for the report | **Complete** 2026-09-14. 324 tests green in 9.1 s. Every button and toggle is under the board in the four rows of S19; the side panel is the hint sentence and the report, which starts at the top of the column and reads in the head row's colour; the selector row lines up under the heading. `CHROME_BELOW` is 224 and the large board 584 at 1400 by 980. Version 1.2.0 in the three files; no window built at it. |
| 14 - the three placements, corrected | **Complete** 2026-09-14. 325 tests green in 9.0 s. The two view toggles are back in the header, restored from `fccab21`; New game is in row four with Play as; the arrows end row one at the board's bottom right corner. The board is unchanged at 584 (576 at 1.5), because four rows are still four rows. Version 1.2.1 in the three files, and its installer built at 6,897,569 bytes, rebuilt at the gate as 6,897,286 (an NSIS bundle carries build timestamps, so two builds of one commit differ slightly; the file on disk is the gate's). |
| 15 - the window matches the board | **Complete** 2026-09-14. 339 tests green in 9.5 s. The board size toggle sets the Windows window to the size that board needs, both ways: driven in the shipped 1.3.0 window, a window shrunk into the dead band grew to 1439 by 1223 with an 832 board on Large and went back to 1023 by 807 with a 416 board on Small, a maximised one un-maximised first, and one in the bottom right corner was moved back inside rather than left hanging off. Nothing resizes on the web. Version 1.3.0 in the three files, and its installer built at 6,902,858 bytes, rebuilt at the gate as 6,902,111 (NSIS build timestamps; the file on disk is the gate's). |
| 16 - the window the layout actually needs | **Complete** 2026-09-14. 341 tests green in 9.7 s. `innerSizeForBoard` adds a 24 px scrollbar allowance to the WIDTH only, so the two automatic windows are 1047 by 807 and 1463 by 1223 rather than 1023 and 1439. Driven in the shipped 1.3.1 window with a real reviewed game at both automatic sizes and in both themes: the side panel is beside the board at y 164 in all four, `main` does not scroll, and `scrollWidth` equals `innerWidth`. Version 1.3.1, installer 6,902,247 bytes, rebuilt at the gate as 6,902,478 (NSIS build timestamps; the file on disk is the gate's). |
| 17 - the pixel the panel rounds by | **Complete** 2026-09-14, done in the orchestrator session. The allowance is 64 rather than 24, so the side panel sits at 349 px instead of 309.67 and its full-width children no longer round a pixel past it. The automatic windows are 1087 by 807 and 1503 by 1223. Version 1.3.2. |
| 18 - the window opens at the size it will use | **Complete** 2026-09-14, done in the orchestrator session. The window is declared at the small board's own 1087 by 807 and the launch asks for the remembered size, centred. A small-board launch resizes nothing; a large-board one resizes once. Version 1.4.0. |
| 19 - the report scrolls, not the window | **Complete** 2026-09-14, done in the orchestrator session. The side panel has the board's height as a ceiling and scrolls itself, so a long report no longer takes the board, the rows and the move list up the screen with it. The board's pixels moved to the row, which both columns now read. Version 1.4.1. |
| 20 - public, as Tabiya Player | **Complete but for the folder rename** 2026-10-19, in the orchestrator session. Spec section 24: renamed, MIT licensed, desktop only, version 1.5.0, installed here in place of Simply Chess, public at github.com/nick2468/TabiyaPlayer with the installer on release v1.5.0, and on Nick's landing page. Box 20.8 is Nick's. |
| 21 - signed, with the notices the program owes | **In progress** 2026-10-28, in the orchestrator session. Spec section 25: signed by Open Source Developer Nicholas Walker, the publisher fixed, About with every licence, zlib, version 1.5.1. |

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

### Phase 8 - builder notes (2026-09-12)

The session was compacted before this phase. Everything the chip named was read fresh
before anything was touched: `CLAUDE.md`, spec 9.3, 10, 11, 12.3, 13, 15.3 and 17, the
plan's rules and phase 8, the phase 7 notes and the gate 7 findings, `docs/testing.md`,
and then all of `../London/src-tauri/` with `check-uninstall-hook.mjs`,
`packaged-eval.mjs`, `version.test.ts` and `docs/v1-acceptance.md`.

**Measured.**

- `npx vitest run`: 31 files, **257 tests passed, none skipped**, 8.1 seconds warm. By
  project: `string` 21 files, 202 passed; `dom` 10 files, 55 passed. `tsc -b` clean,
  `npx oxlint` silent, `npm run build` clean, `npx tauri build` clean.
- **The build.** `npx tauri build` with `%USERPROFILE%\.cargo\bin` on the path: 2 m 54 s
  the first time (988 crates) and 1 m 40 s for the version bump. It makes
  `src-tauri/target/release/simple-chess.exe`, 9,147,392 bytes, and
  `src-tauri/target/release/bundle/nsis/Simple Chess_1.0.0_x64-setup.exe`, **6,894,680
  bytes (6.6 MB)**.
- **The uninstall hook, all four cases**, `node scripts/check-uninstall-hook.mjs`:

  ```
        the program saw ticked=1 update=0
  PASS  ticked, ordinary uninstall: wanted gone, got local=gone
        the program saw ticked=1 update=1
  PASS  ticked, but an upgrade: wanted present, got local=present
        the program saw ticked=0 update=0
  PASS  not ticked, ordinary uninstall: wanted present, got local=present
        the program saw ticked=0 update=1
  PASS  not ticked, and an upgrade: wanted present, got local=present
  All four cases behaved.
  ```

  **Then red on purpose.** With the `$UpdateMode <> 1` half of the guard taken out, case
  two reads `FAIL ticked, but an upgrade: wanted present, got local=gone` and the script
  exits 1. That is a routine version bump deleting the user's settings and game. The
  guard was put back by the reverse edit and the four cases run again green.
- **The packaged window, driven over the debugging port.** The executable was started
  under `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"` and read
  with `scripts/packaged-eval.mjs`:
  - `document.querySelector('h1').innerText` is **"Simple Chess v1.0.0"**.
  - The window title is "Simple Chess" and the inner size is **1280 by 1000**, which is
    spec 11.1 exactly.
  - The layout probe, from the file, against that window:

    | Box | x | y | width | height | bottom |
    |---|---|---|---|---|---|
    | `.board` | 68 | 80.67 | 416 | 416 | 496.67 |
    | `cg-board` | 68 | 80.67 | 416 | 416 | 496.67 |
    | `.live-eval` | 24 | 80.67 | 24 | 416 | 496.67 |
    | `.play-controls` | 68 | 508.67 | 416 | 37.33 | 546 |
    | `.sidebar` | 508 | 80.67 | 280 | 738.58 | 819.25 |
    | `.move-list` | 508 | 587.25 | 280 | 232 | 819.25 |

    `scrollWidth` 1280 against `innerWidth` 1280, display scale 1.5. **S16 holds in the
    shipped window**, which is the second way spec 15.3 asks the probe to be read.
  - **The engine runs inside it.** The bar read "+0.4" on the start position, and Hint,
    pressed through the port, answered "The engine suggests e3." with the blue arrow
    drawn from e2 to e3. A button press is not a synthetic board event, so this works
    where a move would not, and it proves the whole engine path: the WASM loading from
    the bundled files, the worker starting, a real search finishing.
  - **No service worker, read rather than asserted** (S12):
    `navigator.serviceWorker.getRegistrations()` is empty and there is no `.update-bar`
    in the document.
  - **The screenshot** (`--shot`, the one screenshot file this project makes, written to
    the scratchpad and not the repo). It shows the whole app in the dark theme at 1280 by
    1000: the header "Simple Chess v1.0.0" with Light at the right, the bar at the left
    with its pale White share from the bottom and "+0.4" under it, the small board with
    the start position and its coordinates, New game, Undo and Redo greyed, Hint live,
    "Your move" under them, and the sidebar's Difficulty (4. Club, with the two sentences
    about the scale), Play as (White), Board (Small), Save game and Load game. The second
    capture, after Hint, adds the arrow and "The engine suggests e3." in the notice style.
    Nothing is cut off and nothing scrolls.
  - **The folders, before and after.** Before the run none of `%LOCALAPPDATA%\Simple Chess
    Data`, `%LOCALAPPDATA%\com.nick.simple-chess` or `%APPDATA%\com.nick.simple-chess`
    existed. After it, `%LOCALAPPDATA%\Simple Chess Data\WebView2\EBWebView` does and the
    other two still do not. That is the whole reason the window is built in `lib.rs`
    rather than left to the config.
  - The app was closed afterwards. Two windows cannot share one WebView2 profile, and
    Nick's installer run is next.
- **The copies, diffed against the trainer's**, with the `Origin:` line stripped:
  - `build.rs` and `.gitignore`: **0 differing lines**.
  - `src/main.rs`: **1**, the lib it calls.
  - `Cargo.toml`: **4**, the package name, the version, the description and the lib name.
  - `tauri.conf.json`: **11**, the product name, the version, the identifier, the dev
    port, the five window numbers and the two descriptions.
  - `src/lib.rs`: **2 lines of code**, `LOCAL_FOLDER` and the message in the second
    `expect`. The comments are rewritten (see below).
  - `installer-hooks.nsh`: the `APP_DATA_FOLDER` define and its `RMDir` removed, the local
    folder renamed, and one comment word changed from "these two folders" to "this
    folder".
  - `capabilities/default.json` is not a diff: it is the trainer's shape with five
    permissions instead of thirty-eight.
- `git -C ../London status` and `git -C ../Conquest status` are unchanged from gate 7.
  Nothing under either folder was touched.

**Decided (code shape).**

- **`src-tauri`'s comments are rewritten where they described the trainer's data.** The
  chip says to keep `lib.rs`'s comments, and spec S3 says an adapted file's comments
  describe this app. They disagree wherever the trainer's comments name its progress
  file, its marker and its backup copy, none of which exist here. S3 wins, as the chip
  says it should: a comment naming a file the app does not have is worse than no comment.
  The reasoning those comments carry - why the profile folder is not the install folder,
  why the identifier does not change, why the guard is not optional - is kept in full and
  is why the files read long.
- **An `Origin:` line was added to `build.rs`, `main.rs`, `lib.rs`, `Cargo.toml`,
  `check-uninstall-hook.mjs` and `installer-hooks.nsh`.** The chip calls `build.rs`
  "identical (three lines)"; S3 says an identical copy is byte-identical plus one
  `Origin:` line. Both are satisfied: the code is identical and the file has one comment
  line above it. `tauri.conf.json`, `capabilities/default.json` and the one-line
  `.gitignore` have no `Origin:` line, because JSON has nowhere to put a comment.
- **The folder name is held by a test rather than by a comment.** Three files name
  `Simple Chess Data` and none can import from another: `paths.ts` declares it, `lib.rs`
  points the profile at it, `installer-hooks.nsh` deletes it. `local-folder.test.ts`
  reads all three files and compares them, and its third case asserts the folder is not
  the product name, which is the install folder an uninstall always removes. The trainer
  holds its version number across three files the same way, and that test exists because
  the three had drifted to 0.0.0, 1.1.0 and 1.1.0.
- **The version bump is its own commit, after the shell.** The chip's 8.1 asks for
  `version: "1.0.0"` in `tauri.conf.json` and its 8.3 asks for the bump as its own commit;
  both cannot hold with a green suite at every commit, because `version.test.ts` compares
  `tauri.conf.json` with `package.json`. So the shell landed at 0.1.0 and compiled, then
  `Version 1.0.0` moved all three together. `package-lock.json` carries the number too and
  was refreshed with `npm install --package-lock-only`.
- **`npx tauri icon` was given the SVG**, not the 512 PNG, and took it. The set it wrote
  matches the trainer's file for file except `source.png`, which it only writes when the
  source is a raster; `public/icon.svg` is the tracked source here.
- **The fixture in the hook check is a folder inside a folder.** The trainer writes one
  file in each scratch folder so an empty folder cannot pass. This one writes
  `WebView2/Local State`, which is both the same guard and the shape of the real thing,
  so the check also proves the removal is recursive.

**The acceptance walk found a hole, and it is closed.** Spec S15 item 10 asks for a DOM
test that New game clears the hint, the outcome and the redo stack. Only the redo stack
was held, through five phases and two gates. Two tests were added and both were shown red
first against a real mutation: taking `setHint(null)` out of the provider's `start` turns
"goes when a new game starts" red, and giving New game the old game's moves as
`startMoves` turns "New game clears the outcome and unlocks the board" red, along with an
existing remembered-game test. Both mutations were undone by the reverse edit.

**Departures from the chip.** The comment rewrite in `src-tauri` (S3 over the chip, which
the chip itself says is the right way round), the `Origin:` lines on the Rust and NSIS
files, and the two commits in the order shell-then-version. Nothing else.

**Asked of Nick.** Nothing. The chip said to ask him to press Save and Load in the real
dialogs and said to say so at spawn; this session had no reply from him, so both are
left as 8.6 items rather than faked, which is what the chip's own decision rule says to
do. Nothing else a person sees was unsettled: the window's numbers, its title and the
installer's mode are all in spec 11.

**Reuse review.** The folder name now has one home in `src/` and a test across the other
two files. The version has one home and a test across three. The layout probe is still
one file, read two ways, with no second expression written anywhere. `isDesktop()` is
still the only reader of `__TAURI_INTERNALS__`, and the packaged drive used the window's
own global rather than a second copy of that check. No em dashes under `src/` or
`src-tauri/`, and no forbidden word in any new or adapted file, Rust and NSIS comments
included.

**Left.**

- **Box 8.6 is Nick's**, and it is the last thing in the plan besides 7.8: run the
  installer, open the app, play a move on the board, save a game and load it back through
  the real dialogs, close and reopen to see the game remembered, then uninstall with the
  box ticked and check `%LOCALAPPDATA%\Simple Chess Data` is gone. `docs/acceptance.md`
  leaves the date blank for him under item 8, and item 9 under 7.8.
- **`%LOCALAPPDATA%\Simple Chess Data` exists on this machine now**, left by the drive.
  Nick's first run will reuse it, which is the right behaviour, and his uninstall with the
  box ticked is what removes it.
- **The Tauri icon set includes `android/` and `ios/` folders.** `npx tauri icon` writes
  them, the trainer commits them, and they are committed here for the same reason: the
  next `npx tauri icon` would write them again and an untracked half of a generated set is
  worse than an unused one.
- **`npm run build` runs inside `npx tauri build`** (`beforeBuildCommand`), so the web
  bundle in the installer is always the current one. It also means a Tauri build copies
  the engine into `public/engine/` first, which is why a clean checkout can build the
  installer without a separate step.

### Gate 8 findings (orchestrator, 2026-09-12)

- **Verified from the repo.** `npx vitest run`: 31 files, 257 passed, nothing skipped,
  7.8 seconds. `tsc -b` clean, `npx oxlint` silent, `npm run build` clean. `node
  scripts/check-uninstall-hook.mjs` here: four PASS lines and "All four cases
  behaved." The version is 1.0.0 in all three files with the four version tests live.
  Every `src-tauri/` file diffs against the trainer's by exactly the lines the builder
  named; the capability file grants five things. No em dashes under `src/` or
  `src-tauri/`; no trainer word in the Rust or NSIS comments. `../London` untouched.
- **Mutation-checked.** Renaming the folder in `lib.rs` alone turns "is what lib.rs
  points the window profile at" red. Restored from git. The builder's own (the
  `$UpdateMode` half of the guard, and the two New game tests) are taken on its
  account with their outputs recorded above.
- **The packaged window, driven by the orchestrator over the debug port.** The
  executable built at 15:02 (9,147,392 bytes) started under the debugging port; the
  header read "Simple Chess v1.0.0", the title "Simple Chess", the inner size 1280 by
  1000 at the machine's scale of 1.5. The probe from the file gave the builder's
  numbers to the decimal: bar, `.board` and `cg-board` from 80.67 to 496.67 at 416,
  the sidebar 280 wide at x 508, `scrollWidth` 1280 against 1280. No service worker
  registered and no update bar (S12). `isDesktop()`'s global present. New game and
  Hint live, Undo and Redo greyed on the start position, Save and Load live. Hint
  pressed through the port answered "The engine suggests d4." after a real search,
  which is the whole engine path inside the shipped window. The one screenshot file
  was taken to the scratchpad and looked at: the dark theme, the bar with "+0.4" at
  the bottom, the board with its coordinates, the four buttons, the sidebar as
  specified, nothing cut off. `%LOCALAPPDATA%\Simple Chess Data\WebView2` exists and
  no identifier-named folder was made. The app was closed afterwards.
- **The acceptance walk is honest about what a session cannot do.** Items 8 and 9
  name Nick's halves and leave their dates blank. The walk also found the one missing
  test (S15 item 10's hint and outcome halves) and the builder closed it with two
  tests shown red first. Reading the suite against the spec's list rather than
  against itself is the habit worth keeping.
- **Two departures accepted:** the Rust and NSIS comments rewritten for this app
  (S3 over the chip's "keep them", which the chip itself said is the right order),
  and the shell landing at 0.1.0 with the version bump as its own commit after it,
  so every commit is green.
- **Not repeated here:** `npx tauri build`. The executable and the installer carry
  the version bump's timestamp and the commit after it changed tests and docs only,
  so the artefacts are the current source. Nick's installer run is the build's real
  proof.
- **Another session's work under `../Conquest` has grown** (five modified files and
  four new tools). None of it is this builder's; nothing under Conquest is read or
  written by anything here.

- [x] **Review gate 8 passed** (2026-09-12)

The build is complete as far as a session can take it. Open: 7.8 and 8.6, Nick's.

### Phase 9 - builder notes (2026-09-13)

The session was compacted before this phase. Everything the chip named was read fresh
before anything was touched: `CLAUDE.md`, spec 18 in full and then 4.2, S2, 5.6, 10,
11.1, 12.1 and 12.3, the plan's rules and phase 9 and the gate 8 findings,
`docs/testing.md`, and then `../London/src/ui/App.tsx`, `catalog.css`, `Play.tsx` and
`play.css`.

**Measured.**

- `npx vitest run`: 32 files, **260 tests passed, none skipped**, 7.9 seconds warm.
  Three tests are new: the opening line, the difficulty select's place in the selector
  row, and the size toggle inside the remembered-settings test. `tsc -b` clean,
  `npx oxlint` silent, `npm run build` clean (main chunk 319.92 kB, precache 21
  entries). `grep -c midgame dist/assets/*.js` is 0 in every chunk and
  `grep -c course-switch` is 1, so the scenes are still dropped from a build and the
  new row is still in it.
- **The layout pass, twelve rows**, `?scene=midgame`, the probe read from the file in
  the pane. The bar, `.board` and `cg-board` share one bottom in every row, and
  `scrollWidth` never exceeds `innerWidth`, which is S16.

  | Viewport | Size | Theme | Board | Bar/board/cg bottom | List | Side | scrollWidth / innerWidth |
  |---|---|---|---|---|---|---|---|
  | 1400 x 980 | large | dark | 688 | 855 | 167 x 688 | 405 | 1400 / 1400 |
  | 1400 x 980 | large | light | 688 | 855 | 167 x 688 | 405 | 1400 / 1400 |
  | 1400 x 980 | small | dark | 416 | 583 | 167 x 416 | 448.5 | 1400 / 1400 |
  | 1400 x 980 | small | light | 416 | 583 | 167 x 416 | 448.5 | 1400 / 1400 |
  | 1180 x 820 | large | dark | 528 | 695 | 167 x 528 | 345 | 1180 / 1180 |
  | 1180 x 820 | large | light | 528 | 695 | 167 x 528 | 345 | 1180 / 1180 |
  | 1180 x 820 | small | dark | 416 | 583 | 167 x 416 | 448.5 | 1180 / 1180 |
  | 1180 x 820 | small | light | 416 | 583 | 167 x 416 | 448.5 | 1180 / 1180 |
  | 820 x 1180 | large | dark | 728 | 895 | 757 x 232 | 772 | 805 / 820 |
  | 820 x 1180 | large | light | 728 | 895 | 757 x 232 | 772 | 805 / 820 |
  | 820 x 1180 | small | dark | 416 | 583 | 772 x 232 | 772 | 820 / 820 |
  | 820 x 1180 | small | light | 416 | 583 | 772 x 232 | 772 | 820 / 820 |

  The last four rows are the narrow layout: the three columns stack, the list is the
  page's width at exactly ten rows (232 px), and the side panel takes the width under
  it. The pane reports a display scale of 1 after a navigation (a standing hazard in
  `CLAUDE.md`), so these are the scale-1 numbers; `board-size.test.ts` carries 1.25,
  1.5 and 2 by arithmetic.
- **The chrome constants, re-measured at 1400 by 980 with the small board**, from the
  probe rather than from the stylesheet, then rounded up:
  - `CHROME_ABOVE` **167** = 81 (the page padding and the header, which is the
    selector row's y) + 34 (the row) + 12 (its margin) + 24 (the head row) + 16 (its
    margin). The board's y was exactly 167 at a display scale of 1 and 164 at 1.5,
    where a row of text is a third of a pixel shorter. The larger is the one that has
    to fit: taking 164 would have let phase 11's review row push the page 3 px past
    the bottom of the window.
  - `CHROME_BELOW` **120** = 12 (the column's gap) + 38 (row one) + 46 (row two: 38
    plus its 12 gap less its -4 margin) + 24 (the page padding). Row two does not
    exist yet and is counted anyway, so the board will not change size when it
    arrives.
  - `CHROME_BESIDE_WIDE` **607** = 48 (padding both sides) + 24 (the bar) + 20 (its
    gap) + 24 (the gap to the list) + 167 (the list) + 24 (the gap to the panel) +
    300 (the panel's minimum). Measured: the panel's x is 699 at 1400 with the small
    board, which is 68 + 416 + 24 + 167 + 24 exactly.
  - `CHROME_BESIDE_NARROW` **92**, unchanged: 48 + 24 + 20.
  - What they give: 688 in the window at scales 1 and 1.5 and 672 at 1.25; 528 in
    landscape; 728 upright; and the full 832 on a 1600 by 1200 screen. The large
    board is smaller than version 1's by about the height the two new rows take,
    which is the fit rule doing its job rather than a fault (the chip's own decision
    rule).
- **167 for the list column** is not a number the trainer has: it is what the
  trainer's own row measures. `2em + 3.6em + 3.6em` is 147.2 at a 16 px body font,
  two 6 px gaps make 159.2, and 4 px of padding each side make 167.2.
- **Looked at.** `?scene=midgame` at 1400 by 980 in both themes: the header with
  Large and Light at the right, the centred Difficulty row, "Playing White against 4.
  Club" with "Your move" beside it, the board with its bar, the four buttons under
  it, the move list ending level with the board, and the panel with PLAY AS, Save
  game and Load game. `?scene=mate`: "You won by checkmate" in the head row and Hint
  greyed. `?scene=hint`: the blue arrow on the board and "The engine suggests axb5."
  in the panel under the file buttons, with its blue left border. At 820 by 1180 the
  three columns stack in order. Nothing is cut off and nothing scrolls sideways.
- **Against the spec 18.1 diagram, nothing differs.** The only things on the diagram
  that are not on the screen are the ones this phase does not build: the second
  button row, Stop and review, Stop and discard, and the report (phases 10 and 11).

**Decided (code shape).**

- **`StatusLine.tsx` went and `Notice.tsx` took its place.** The status wording moved
  into `PlayHead`, which left the file holding one component that was not the one it
  was named after. One component, one file, named after it.
- **`Sidebar.tsx` is `SidePanel.tsx`.** It is no longer a bar of everything: two of
  its four things left this phase. The class is the trainer's `.play-side`, so the
  component now reads as what the stylesheet calls it. `.sidebar-files` keeps its
  name, as the chip says: it is the row of two buttons and nothing else.
- **`openingLine` is its own module, `ui/opening-line.ts`.** It began as a second
  export from `PlayHead.tsx` and oxlint said so: a file that exports a component and
  a function breaks fast refresh. The trainer keeps its version private inside
  `Play.tsx` and does not test it; this one is a sentence worth a test of its own.
- **The move list's height travels as a custom property, not as an inline `height`.**
  The chip asks for `style={{ height: pixels }}`, which would have outranked the
  narrow layout's `height: var(--list-rows)` and left a 728 px list on an upright
  iPad. `--board-pixels` on the element lets the stylesheet decide which of the two
  rules wins, which is where that decision belongs.
- **The two sentences about a level are `levelTitle` in `DifficultyRow.tsx`**, and
  that is the only place either is written. They were two paragraphs under the select.
- **The description in `package.json`, `Cargo.toml`, `tauri.conf.json` and the
  manifest is now "A no-frills chess game against Stockfish".** It was "A simple chess
  game against Stockfish", which names the old product in a sentence a person reads in
  the installer. "No-frills" is spec section 1's own word for the app.
- **`Cargo.lock`'s package line was rewritten by cargo**, not by hand: `cargo metadata
  --offline`, with `%USERPROFILE%\.cargo\bin` on the path, changed the one `name =`
  line and then exited 101 trying to download `android_system_properties`, which
  Windows does not need. That one line is the only change in the file.

**Departures from the chip.**

- **One commit, not two.** The chip prefers the rename and the layout apart, and after
  the fact they could not be separated without a red commit between them: the header's
  name and the header's new size toggle are three lines of the same file, and
  `tauri.conf.json` carries both the identifier and the window size. The rename WAS
  green on its own before the layout was started (257 tests, the same suite as gate
  8), and that is recorded here rather than in the history. The lesson for phase 10:
  commit the mechanical half the moment it is green.
- **The trainer does not centre its course row.** The chip says it does, citing the
  trainer's phase 17. `London/src/ui/catalog.css` has no `justify-content` on
  `.course-switch` today, so the copy is the trainer's rule plus one line and the
  origin comment says which line is this app's. Spec 18.1 asks for centred, and
  centred is what it is.
- **Section 18 supersedes more of the spec than 11.1 alone.** The chip asks for a
  bracketed note on 11.1's window numbers; section 10's storage keys needed the same
  and got one. Nothing else in sections 1 to 17 was touched: the spec's own front
  matter says the earlier sections keep the old name as history, so
  `git grep -i 'simple chess'` still matches there - Q1 (which now carries a
  "superseded by Q15" note), the 4.1 diagram, 9.1's example file, 11.1, 11.3, 12.1
  and 17 - and in `SimpleChess-brief.txt`, which is history by definition. Whether
  those live sentences should be rewritten is the orchestrator's call, not this
  session's.

**Asked of Nick.** Nothing. Everything a person sees was settled by spec 18: the two
toggles' words and their order, the row's label and its centring, the opening line's
wording, the list's width, the panel's minimum and the window's four numbers.

**Reuse review.** The four the chip predicted, all found and all closed: the level's
two sentences now have one home in `levelTitle`; the second select style is gone (the
`.sidebar select` rule was deleted and `.course-switch select` is the one rule); the
board's pixels are worked out once in `Screen` by `useBoardPixels` and handed to both
the board and the list; and no `.sidebar` rule is left behind. Every class in the two
stylesheets is used by a component, checked by counting them. `openingLine` is the one
place the head row's sentence is written and `PlayHead` the one place spec 5.6's
status words are. No em dashes under `src/`, and no forbidden word in a new or adapted
file.

**Left.**

- **The identifier changed with the name**, from `com.nick.simple-chess` to
  `com.nick.simply-chess`, and so did the product name. NSIS keys an install on the
  product name, so a 1.0.0 install would not be upgraded by the next installer: it
  would sit beside it. Nothing is at risk today, because box 8.6 is still open and
  nobody has installed 1.0.0. If that changes before phase 12, phase 12 has to say so.
- **`%LOCALAPPDATA%\Simple Chess Data` is still on this machine**, left by phase 8's
  drive, and was not touched: Nick's files are not this session's. The new folder,
  `Simply Chess Data`, is made by the next packaged run in phase 12.
- **`.claude/launch.json`'s two configurations are now `simply-chess-dev` and
  `simply-chess-preview`.** `docs/testing.md` names the second one, so both moved
  together.
- **Nothing under `../London` or `../Conquest` was read for anything but copying, and
  neither was written.**

### Gate 9 findings (orchestrator, 2026-09-13)

- **Verified from the repo.** `npx vitest run`: 32 files, 260 passed, nothing skipped.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean with the precache at 21
  entries. The built assets carry no scene text and one `course-switch`. `git grep -i
  'simple chess'` over `src/`, `src-tauri/`, `public/`, `tools/`, `scripts/`,
  `index.html`, `vite.config.ts`, `package.json`, `README.md` and `CLAUDE.md` finds
  **nothing**: the old name is only in the spec's history sections and the brief. The
  product name, the identifier, the package and lib names, the four storage keys and
  the folder in its three files all say Simply. The window is 1400 by 980.
- **Mutation-checked.** Putting `CHROME_ABOVE` back to version 1's 81 turns six fit
  tests red, naming the window and the landscape iPad. Restored from git. The
  builder's own are taken on its account.
- **Driven in the pane** at 1280 by 980 (the pane caps its width at 1280, so 1400 was
  read from the arithmetic, as the chip allows). The large board came out 672 at the
  pane's display scale of 1.5, which is 1280 less the 607 beside it, stepped down to a
  multiple of 16; the bar, `.board` and `cg-board` all 672 and all ending on 836;
  `scrollWidth` 1280 against 1280. The selector row is centred at y 80.67, the head
  row at 124 reading "Playing White against 4. Club" and "Your move", the move list
  167 wide at the board's height, the side panel 301 wide holding Play as and the two
  file buttons. The `hint` scene in the light theme put "The engine suggests axb5."
  in the panel under the buttons with the blue arrow on the board, the toggles reading
  "Large" and "Dark". Looked at both: the screen is spec 18.1's diagram. Storage
  cleared.
- **The board is smaller than version 1's and that is the rule working.** Two rows of
  chrome arrived, so the fit rule took the height out of the board rather than out of
  the page: 688 in the window at scales 1 and 1.5, 528 in landscape. The chip's own
  decision rule says so.
- **The builder's departures are accepted.** One commit rather than two, with the
  rename's green bar recorded in the notes rather than in the history; the trainer
  does not in fact centre its course row, so the copy is its rule plus one line, said
  in the comment; the move list's height as a custom property rather than an inline
  style, which is what lets the narrow layout's ten-row rule win. All three are better
  than what the chip asked for, and each says why.
- **Left for the orchestrator, answered here.** The spec's sections 1 to 17 still say
  Simple Chess in their prose (the 4.1 diagram, 9.1's example file, 11.1, 11.3, 12.1,
  17 and Q1). They stay: the front matter says the earlier sections are version 1's
  history, section 18 wins, and rewriting them would erase the record of what was
  built under which name. Phase 12's docs sweep leaves them alone.
- **The identifier changed with the product name**, so an installer of this version
  installs beside Simple Chess 1.0.0 rather than upgrading it. Nothing is at risk:
  box 8.6 is open and 1.0.0 has never been installed. Phase 12 says so again.

- **An interim installer was built at gate 9, at Nick's request**, from the source as
  it stands: `src-tauri/target/release/bundle/nsis/Simply Chess_1.0.0_x64-setup.exe`,
  6,894,205 bytes, and `simply-chess.exe`, 9,147,392 bytes, built in 3 m 14 s. It
  carries the rename and the layout and NOT phases 10 to 12's review, report or
  viewer, so it is not what spec 18 calls version 2; phase 12 still ships 1.1.0. It
  is the first artefact of the renamed product, so 1.0.0 is honest for it: Simple
  Chess 1.0.0 is a different product that was never installed.
- **The packaged window was driven** over the debugging port: the header reads
  "Simply Chess v1.0.0", the window is 1400 by 980, the selector row is centred at
  y 80.67 with "Difficulty" and "4. Club", the head row reads "Playing White against
  4. Club" and "Your move", the bar reads "+0.5", the toggles read "Large" and
  "Light", the panel holds Save game and Load game, and the move list column is 167
  wide at the board's height. The board, `cg-board` and the bar all end on 580 and
  `scrollWidth` is 1400 against 1400, so S16 holds in the shipped window. Hint,
  pressed through the port, answered "The engine suggests c4." after a real search,
  so Stockfish runs inside the packaged build. No service worker (S12).
  `%LOCALAPPDATA%\Simply Chess Data\WebView2` was created and no identifier-named
  folder appeared. The app was closed afterwards; the screenshot is in the
  scratchpad.

- [x] **Review gate 9 passed** (2026-09-13)

### Phase 10 - builder notes (2026-09-13)

Everything the chip named was read fresh before anything was touched: `CLAUDE.md`,
spec 18 in full and then 5.5, 5.6, 6.3, 7, 8, 9.1 and 14, the plan's rules and phase
10 and the phase 9 notes with the gate 9 findings, `docs/testing.md`, and then
`../London/src/play/report.ts`, `session.ts`'s `scanGame`, `game-pgn.ts`,
`ui/Play.tsx` (`PlayActions`, `Report`, `EvalBar`, `CopyGame`, `toClipboard`),
`ui/play-context.tsx` and `ui/play.css`.

**Measured.**

- `npx vitest run`: 35 files, **305 tests passed, none skipped, 14.4 seconds** warm.
  Forty-five are new. `tsc -b` clean, `npx oxlint` silent (exit 0), `npm run build`
  clean, main chunk 325.96 kB, precache 21 entries. `grep -c midgame` is 0 in every
  built chunk and `grep -c 'Stop and review'` is 1, so the scenes are still dropped
  and the new screen is still in.
- **The suite is 6.5 seconds slower than phase 9's 7.9**, all of it in the new
  `review.dom.test.tsx`: nine tests that each mount the app, play a game through the
  board stub and wait for a scan. It is inside the twenty-second rule and the rule is
  a ceiling rather than a target (`docs/testing.md`), but phase 11 adds more DOM tests
  to the same screen and should watch it.
- **Driven in the pane against the real Stockfish**, at 1280 by 980 (the pane caps its
  width), storage cleared first. A game was seeded through the real record and reopened
  so the scan would have real work to do: 1.e4 e5 2.Qh5 Nc6 3.Qxe5+?? Nxe5, White
  hanging the queen, then 4.Nf3 played through the real chessground board by pointer
  events. Stop and review went **"Scanning 0 of 0..." to "Scanning 3 of 6..." to the
  report**, and the report read:

  > A blunder on move 3: Qxe5+ turned "level" into "winning for black". The engine
  > preferred 3.Bc4.
  > A mistake on move 2: Qh5 turned "slightly better for white" into "slightly better
  > for black". The engine preferred 2.Nf3.
  > THE FINAL POSITION: Winning for Black. Stopped after move 4.

  Most recent first, the two tags in `--bad` and `--warn`, and both better moves are
  the engine's own from the scan's own searches.
- **The slip's numbers are the bar's.** The report's bar drew White's share at
  **2.78322%**, and `50 + 50 * tanh(pawns / 3) = 2.78322` is pawns = -5.33, which is
  exactly the **-5.3** the live bar was showing beside the board at the same moment.
  The report cannot disagree with the numbers that were watched, because the scan is
  handed them.
- **Save game's text, read out of the blob** (the phase 5 method), with the report in
  it:

  ```
  [Event "Simply Chess"]
  [Site "-"]
  [Date "2026.09.13"]
  [Round "-"]
  [White "You"]
  [Black "Stockfish level 1"]
  [Result "*"]

  1. e4 e5 2. Qh5
  {mistake: slightly better for white to slightly better for black; the engine preferred 2.Nf3}
  2... Nc6 3. Qxe5+ {blunder: level to winning for black; the engine preferred 3.Bc4}
  3... Nxe5 4. Nf3 c6
  {Winning for Black. Stopped after move 4. White was played by you at level 1.} *
  ```

- **Copy game could not be read back in the pane, and said so correctly.** Both paths
  need a focused document and the pane is hidden, so `navigator.clipboard.writeText`
  was refused and `execCommand` returned false; the button said "That could not be
  copied: the browser refused to copy", which is the failure path working rather than
  a button that lies. That the two texts are the same is held by a DOM test instead
  (S15 item 17), and by there being one builder: `pgnNow` in `Shell`.
- **The probe, with the report showing.** The bar, `.board` and `cg-board` end on the
  same pixel in every row and `scrollWidth` never exceeds `innerWidth`, which is S16.

  | Viewport | Size | Theme | Board | Bar/board/cg bottom | List | Side | scrollWidth / innerWidth |
  |---|---|---|---|---|---|---|---|
  | 1280 x 980 | small | dark | 416 | 583 | 167 x 416 | 448.5 | 1280 / 1280 |
  | 1280 x 980 | small | light | 416 | 583 | 167 x 416 | 448.5 | 1280 / 1280 |
  | 1280 x 980 | large | dark | 672 | 839 | 167 x 672 | 301 | 1280 / 1280 |
  | 1280 x 980 | large | light | 672 | 839 | 167 x 672 | 301 | 1280 / 1280 |
  | 820 x 1180 | small | dark | 416 | 580 | 756.67 x 232 | 756.67 | 805 / 820 |

  **The report does not change the board's size**: 672 large and 416 small at 1280 are
  the same numbers gate 9 measured on the same viewport with no report. The panel gets
  taller instead, to 624 with the report against the board's 672, and in the narrow
  layout to 550 under it, so the page scrolls DOWN, which spec 4.3 allows and the
  chip's decision rule names.
- **Looked at.** The light theme at 1280 by 980 with the two-slip report: the head row
  reading "Playing White against 1. Very casual" and "Game reviewed", Undo, Redo and
  Hint greyed with New game still live, the two slips with their coloured left borders,
  the horizontal bar almost entirely black under "Winning for Black", and Copy game
  under it. The dark theme with a clean report: "Nothing the engine calls an inaccuracy
  or worse. Well played." and a level bar. Stop and discard on a second game left an
  empty move list, no report, `simply-chess.game` gone from storage and the two buttons
  back.

**Decided (code shape).**

- **`stoppedAt` moved from `game-pgn.ts` into `report.ts` and is exported.** The chip
  asked for one home for it and there are now two callers, the provider building a
  report and the writer closing a file. It did not go into `outcome.ts`, which is the
  home of the outcome sentences, because that file is byte-identical to the trainer's
  and spec S3 says it stays that way.
- **`scanGame` is `src/play/scan.ts`, not part of `session.ts`.** The trainer keeps it
  at the bottom of its session file, where it has nothing to do with the class above
  it. It is a function over a game's moves and an engine, and phase 11's replay will
  read from it.
- **The caller sets the analysis profile, not the scan.** The trainer's `finish` sets
  it and never puts the playing profile back, which is safe there only because its
  screen throws the game away afterwards. Here Keep playing hands the board back
  (phase 11), so the whole scan is wrapped in `atAnalysisProfile` and the level is
  restored in a `finally` (spec 6.3).
- **`finish` waits for `quietRef` first.** An undo's evaluation may be in flight, and
  its own restore would land in the middle of the scan and put the playing level back
  for the rest of it, so the report would judge one game's positions by two standards.
  It does NOT go behind `quietRef`'s fire-and-forget path: a report is asked for and
  waited on, which is the chip's own decision rule.
- **`discard` takes the fresh game's options.** The chip says discard starts a fresh
  game "at the current side and level", and the provider only knows the RUNNING game's.
  Spec 5.1 says the side setting applies to the next new game, and a discarded game is
  the next new game, so the settings win and `Shell` hands them in. It differs from New
  game by exactly one line: it forgets the stored game FIRST, before anything can fail,
  because the user asked for this game to be gone and an engine that would not start
  must not leave it in storage to reopen tomorrow. New game leaves that to the fresh
  game's own record.
- **`PlayHead` gained `reviewed` and says "Game reviewed".** Driving it in the pane
  showed a locked board under "Your move", which is the screen asking for something it
  will not accept. Neither spec 5.6 nor 18.4 says what the status line reads during a
  review, so by the chip's rule this was a question for Nick - except that the trainer
  had already answered it in the file being copied, `Play.tsx`'s own `PlayHead`, with
  exactly that string. Copied rather than invented, so nothing was asked.
- **The slips are plain list items, as the chip says**, with a comment naming phase 11.
  `.slips li .jump` was left out of the stylesheet with them.
- **`CopyGame` uses `asMessage`** for its failure sentence rather than the trainer's
  inline `instanceof Error` test, because this app has one home for a thrown thing as a
  sentence (`ui/message.ts`).
- **`ReportBar` is a second export from `EvalBar.tsx`** rather than a file of its own.
  Both are the same bar drawn two ways and both are `evalShare`; oxlint's
  `only-export-components` does not object to two components in one file, only to a
  component beside a function.

**A fault in the copy, fixed here and carried back.**

- **The trainer's `gameToPgn` says a checkmate twice.** Its closing comment is
  `[report.verdict]` and then `report.outcome`, and for a mated game those are the same
  string, because a mated position has no evaluation and `buildReport` takes the outcome
  as the verdict. The file then reads "You won by checkmate. You won by checkmate.
  White was played by you at level 4." This copy pushes the ending only when it is not
  already the verdict, and a test holds it. `../London` was not touched; this is for the
  orchestrator to carry over.

**Departures from the chip.**

- **A game played through in the app scans NOTHING.** The chip's progress test assumes
  a scan with work to do, and the bar has already evaluated every position of a game
  played move by move, so `scanGame` finds nothing to search and the button reads
  "Scanning 0 of 0..." for an instant. The scan does real work exactly where the bar has
  not been: a game reopened from storage or loaded from a file, which is evaluated at
  its final position only. Both the pane drive and the progress test use a reopened
  game for that reason, and the test says so. This is the trainer's behaviour too, and
  it is right: the point of handing the bar's numbers over is that they do not get
  searched again.
- **The chip lists `engineError` among `PlayActions`' props**, from the trainer, where
  the actions block is the only thing at the bottom of the screen. Here the engine error
  is already a `Notice` under the board (spec 18.1), so passing it again would print it
  twice. It is not a prop.
- **`verdictForYou` was not brought across**, as the chip instructs: nothing uses it.
  `describeAlternatives`, `findDeviation`, `findCourseBookEnd`, `placeDeviation` and
  `describeDeviation` went with the repertoire.

**Asked of Nick.** Nothing. The one thing a person sees that the spec does not settle,
the status line during a review, was answered by the file being copied.

**Reuse review.** The four the chip predicted, all found and all closed: "Stopped after
move N" has one home in `stoppedAt`; the PGN text has one builder, `pgnNow` in `Shell`,
called by Save game and handed to Copy game; there is one clipboard helper,
`toClipboard` inside `CopyGame.tsx`; and `.pawns` is read out of the map in one module,
`report.ts`, which is the only thing that asks the map a question the bar does not.
`evalShare` draws both bars and `verdictInWords` words every verdict, in the report, in
the file's comments and as the report bar's accessible name. Every new class in
`play.css` is used by a component, checked by counting. No em dashes under `src/`, and
no forbidden word in a new or adapted file outside the one origin line that names what
was removed.

**Left.**

- **The engine takes longer than its own 20-second start timeout in a hidden pane.**
  The first load of this session failed three times with "the engine did not answer in
  time" before the WASM was compiled and cached; a bare worker started by hand took
  between 12 and 15 seconds to answer `uci`. Nothing in the app is wrong - the timeout
  is generous on real hardware and the error is honest - but a session driving the pane
  should expect to reload once before the engine answers. Added to the standing hazards.
- **Phase 11 turns the slips into buttons and the move list into the viewer.** The
  markup is already shaped for it: `.slips li` carries the tag class and the ply is the
  key.

### Gate 10 findings (orchestrator, 2026-09-13)

- **Verified from the repo.** `npx vitest run`: 35 files, 305 passed, nothing skipped,
  14.8 seconds, inside the twenty-second rule. `tsc -b` clean, `npx oxlint` silent,
  `npm run build` clean. The built assets carry no `midgame`, no `repertoire` and no
  `deviation`, and one "Stop and review". No browser global in the pure folders, no
  colour in a `.ts` or `.tsx`, and the one pixel number is the trainer's own
  off-screen textarea inside the copied clipboard helper. Every file the forbidden-word
  grep flags says the word in an origin line or a comment explaining what was removed,
  which is what S3 asks for; `course-switch` is the deliberate shared class name.
  `../London` and `../Conquest` untouched.
- **Mutation-checked.** Raising the blunder threshold out of reach turns three
  `scanForSlips` tests red, naming the grading, the Black subtraction and the order.
  Restored from git. The builder's own are taken on its account.
- **Driven in the pane at 1280 by 980 against the real Stockfish.** A seeded game
  hanging the queen (1.e4 e5 2.Qh5 Nc6 3.Qxe5+ Nxe5 4.Nf3 d6) reopened from storage,
  so the scan had real work: the button went through "Scanning 4 of 8..." to the
  report, which read "A blunder on move 3: Qxe5+ turned "level" into "winning for
  black". The engine preferred 3.Bc4." above "An inaccuracy on move 2: Qh5 gave up
  more ground in a position already level. The engine preferred 2.Nf3." Most recent
  first, the two tag classes on the list items, "Winning for Black" under THE FINAL
  POSITION with the horizontal bar at 1.74 percent white, and Copy game under it. The
  status read "Game reviewed", the board was locked, and Undo, Redo and Hint were
  greyed with New game still live.
- **The report's numbers are the bar's.** The report bar's 1.74068 percent inverts to
  -6.0 pawns, which is exactly what the live bar was reading beside the board. That is
  the point of handing the scan what the bar already knew, demonstrated rather than
  asserted. (My run graded move 2 an inaccuracy where the builder's graded it a
  mistake: the same position at 150 ms either side of a band edge, not a fault.)
- **The report does not resize the board.** With it showing, the small board is still
  416 and everything still ends on 580; the side panel grows to 549.9 instead and the
  page needs no scroll at all at that size. `scrollWidth` 1280 against 1280.
- **Stop and discard leaves nothing**: no report, no stored game, an empty list, the
  two buttons back and "Your move".
- **The profile restore is real.** `finish` awaits `quietRef.current` first and wraps
  the whole scan in `atAnalysisProfile`, so the level the game was being played at is
  restored in a `finally`. The trainer leaves the engine at level 8 there, which is
  safe only because its screen then throws the game away; this app hands the board
  back at phase 11, so the builder was right to close it now rather than then.
- **A fault in the trainer, found by copying it.** Its `gameToPgn` writes a checkmate
  twice, as the verdict and again as the outcome, because a mated position has no
  evaluation and the verdict falls back to the outcome. This copy pushes the ending
  only when it is not already the verdict, and a test holds it. **Carried back to the
  trainer**, with the two faults from version 1, for a London session.
- **The builder's departures are accepted.** A game played move by move scans nothing,
  because the bar has already evaluated every position, so the pane drive and the
  progress test both use a reopened game; that is the trainer's behaviour and the
  reason the scan is handed the bar's numbers. `engineError` is not a `PlayActions`
  prop here because the notice already sits under the board. "Game reviewed" came from
  the trainer's own `PlayHead` rather than being invented, which is why nothing was
  asked.
- **One thing to watch, not a fault.** The suite is 6.5 seconds slower, all of it in
  the nine new DOM tests that mount the app and wait for a scan. Phase 11 adds more
  tests to the same screen. If it crosses twenty seconds, the answer is fewer
  full-app mounts rather than a higher ceiling.

- [x] **Review gate 10 passed** (2026-09-13)

### Phase 11 - builder notes (2026-09-13)

The session was compacted after phase 10. Everything the chip named was read fresh
before anything was touched: `CLAUDE.md`, spec 18.4 word for word and then 5.4, 7 and
14, the plan's rules and phase 11 and the gate 10 findings, `docs/testing.md`, and then
`../London/src/play/replay.ts` and its test, `src/ui/play-from-replay.ts` and its test,
`src/ui/Play.tsx` (`MoveList` with `activePly`, `PlayControls` row two,
`preferredShapes`, the highlight rule, the arrow-key effect), `src/ui/play-context.tsx`
(`replayPly`, `resume`, `canResume`) and `src/ui/play.css`.

**Measured.**

- `npx vitest run`: 37 files, **323 tests passed, none skipped, 16.3 seconds** warm.
  Eighteen are new. `tsc -b` clean, `npx oxlint` silent (exit 0), `npm run build` clean,
  main chunk 329.15 kB, precache 21 entries. No `midgame` in any built chunk.
- **The suite is 1.5 seconds slower than phase 10's 14.8**, and the new DOM file is
  three mounts rather than the six its tests would naturally want. The chip's rule was
  fewer mounts rather than a higher ceiling, so the walking tests share one mount, Keep
  playing and Play from here share a second (the first puts the report away, the second
  builds it again), and the finished-game cases share a third.
- **Driven in the pane at 1280 by 980 against the real Stockfish**, storage cleared
  first, both themes. The gate 10 game was seeded and reopened so the scan had work:
  1.e4 e5 2.Qh5 Nc6 3.Qxe5+ Nxe5 4.Nf3 d6 at level 1 as White.
  - **The list, the mark and the bar.** Clicking Nc6 put the board on the position
    after it, moved the mark to Nc6 and took the bar from **-5.8 to -0.3**, which is
    the position before the queen went. Stepping with the keys walked it one move at a
    time, the bar reading -0.3, then +0.3 at e5, then +0.3 at e4.
  - **The keys, and where they do not listen.** Three ArrowLefts pressed with the page
    focused stepped three moves. The same two keys dispatched at the difficulty select
    with it focused moved nothing: the mark stayed on e4. (Two keys fired in ONE
    synchronous tick step only once, because both read the `ply` of the render they
    were dispatched in. A person cannot do that; key repeat arrives frames apart. The
    trainer's effect has the same shape.)
  - **The slip's own position.** Clicking "A blunder on move 3: Qxe5+..." put the
    board on the position it was played from, marked Nc6, and drew the engine's
    **3.Bc4 as a blue arrow from f1 to c4 with the played move Qh5-e5 still
    highlighted underneath**, which is spec 18.4's "both on the board at once". Looked
    at in the light theme and again in the dark.
  - **Keep playing** put the report away from a board standing at the slip, and handed
    back the game's OWN final position (`__cg.getFen()` equal to `__game.fen`), with
    "Your move", row two gone and Undo and Hint live again.
  - **Play from here** was on at the end of the game, off one step back with "It is
    the engine's move here. Step one move on or back." in its tooltip, and on again a
    step after that. Pressed there, it started a game whose moves are exactly the six
    of the prefix, on the same position, with no report, no row two and the new game in
    storage in place of the old eight-move one. A move played on it was answered by the
    engine, so it is a game rather than a picture of one.
- **The one thing no test can hold: the list scrolls ITSELF.** A twenty-move game
  (`?scene=midgame`) reviewed, then move 1 clicked from the bottom of the list: the
  list's `scrollTop` went **304 to 0** while the board's y stayed **167**, `main`'s
  `scrollTop` stayed 0 and the window's `scrollY` stayed 0. That is spec 18.4's
  "scrolling itself and nothing above it" and the phase 6 rule, measured.
- **The probe, with the report and row two showing.** The bar, `.board` and `cg-board`
  end on the same pixel in every row, and `scrollWidth` never exceeds `innerWidth`.

  | Viewport | Size | Theme | Board | Bar/board/cg bottom | Row 1 y | Row 2 y | Side | scrollWidth / innerWidth |
  |---|---|---|---|---|---|---|---|---|
  | 1280 x 980 | small | dark | 416 | 580 | 592 | 637 | 448.5 | 1280 / 1280 |
  | 1280 x 980 | small | light | 416 | 580 | 592 | 637 | 448.5 | 1280 / 1280 |
  | 1280 x 980 | large | light | 672 | 836 | 848 | 894 | 301 | 1280 / 1280 |
  | 1280 x 980 | small | dark, 20 moves | 416 | 583 | 595 | 641 | 448.5 | 1280 / 1280 |

  **The board does not change size when row two appears**: 416 small and 672 large at
  1280 are gate 10's own numbers on the same viewport with only row one showing. Phase
  9's `CHROME_BELOW = 120` already counted a second row that did not exist yet, which
  is exactly what that was for. Nothing in `board-size.ts` was touched. Both rows span
  the board exactly, x 68 to 484 against a board of 68 to 484, with the two arrows at
  the right-hand end. (The last row is at a display scale of 1 after a navigation and
  the others at 1.5, which is the standing hazard, not a difference in the layout.)

**Decided (code shape).**

- **`ReplayedGame` is `{ moves }` and nothing else.** The trainer's carries a course, a
  chapter, a level and the record's date, and every one of those is for
  `requestFromReplay`, which this app does not have. `moveAtPlyLabel`,
  `requestFromReplay` and `playedDay` were not copied: gate 2 ruled that unused code
  goes, and Play from here here is `start` with a prefix rather than a request object.
- **Play from here is `start({ level, side, startMoves })`**, the path a loaded game
  already takes, so Save, Load and Undo work on the new game for nothing and the PGN
  needs no `SetUp` or `FEN` tag. The side and the level are the RUNNING game's rather
  than the settings', so a game reviewed after a mid-game level change is carried on at
  the level it was actually played at.
- **`keepInView` in `MoveList` now takes an `HTMLElement` and finds its list with
  `closest('ol')`.** It was typed to the row and read `parentElement`, which is right
  for a record's `li` and wrong for a viewer's marked button, two levels down. One
  function still, because it is one question: bring this node into view by scrolling the
  list and nothing else.
- **The trainer's `scrollIntoView` was not copied**, as the chip instructs. Its
  `MoveList` still calls it on the marked move, which is the phase 6 fault waiting on
  the same screen: it scrolls every scrollable ancestor, and above 900 by 700 this
  shell's `main` is one of them. Carried back to the trainer below.
- **The arrow-key effect lives in `Screen.tsx`**, where the report is composed. This app
  has one screen, so there is no second handler to fight with; the trainer has to keep
  two screens from both listening.
- **`.move-step` and `.jump` share their reset.** The trainer writes the same eight
  declarations twice and this app writes them once, with only the `border-radius` and
  the two hovers kept apart. That is the reuse review's one find (below).

**A fault in the trainer, not copied, to carry back.**

- **`MoveList`'s marked move calls `scrollIntoView({ block: 'nearest' })`.** The trainer
  met exactly this in its own list once and fixed the newest-move case; the viewer's
  marked-move case still has it. On a window where an ancestor scrolls, stepping through
  a reviewed game will scroll the board out from under the reader. This app uses
  `scrollToShow` on the list's own `scrollTop` for both cases, which is `keep-in-view.ts`
  and was proved again in the pane above.

**Not a fault, and it cost an hour: the hidden pane suspends `requestAnimationFrame`.**

Chessground redraws behind `requestAnimationFrame` (`debounceRedraw` in its
`chessground.ts`), and a hidden browser pane suspends that entirely. So `svg.cg-shapes`
sat empty while `__cg.state.drawable.autoShapes` already held the right arrow, and an
arrow the app had CLEARED stayed drawn after Play from here. Both times the app's state
was correct and only the frame was missing: `redrawAll()` or a screenshot paints it at
once, and the screenshots above show the arrow appearing and disappearing correctly.
I misread the first of these as a fault and changed `Board.tsx` to carry the shapes
through `set()` instead of `setAutoShapes`; when the real cause turned up I reversed the
edit and `git diff src/ui/Board.tsx` is empty. **`Board.tsx` is untouched by this
phase.** Added to CLAUDE.md's standing hazards beside the React-throttling one, because
it is the same hazard one layer down and it reads as a broken feature.

**Asked of Nick.** Nothing. Spec 18.4 settles every sentence on the screen, and the two
tooltips are the trainer's own words with the record it keeps and this app does not
taken out of them.

**Reuse review.** The three the chip predicted: there is no second "position at a ply"
loop, `positionAtPly` is the only one and both `play-from-replay.ts` and `Screen.tsx`
call it; `squaresOf` is still the one function in `Screen.tsx` and all three shape
callers go through `squaresForSan`, so it did not need moving; and the second
`.jump`-style button reset was real and is now one rule shared with `.move-step`.
`.nav-link` in `app.css` keeps its own, because it is a nav control with padding, a
bottom border and a hover background rather than a sentence. Every new class in
`play.css` is used by a component, checked by counting. No em dashes under `src/`, no
forbidden word in any new or adapted file.

**Left.**

- **Phase 12** is the version bump to 1.1.0, `npx tauri build`, the acceptance walk
  extended with 18.7's items, and the deploy document. Nothing in this phase is
  waiting on anything.
- **`../London` and `../Conquest` were read for copying and not written.**

### Gate 11 findings (orchestrator, 2026-09-13)

**Verified from the repo.** `npx vitest run`: 37 files, **323 passed, none skipped,
15.4 seconds**, inside the twenty-second rule. `tsc -b` clean, `npx oxlint` exit 0 with
no output, `npm run build` clean. The built assets carry no `midgame`, `repertoire`,
`deviation` or `trainee`; "Keep playing" and "Play from here" appear once each and the
two arrow names twice each, which is their `aria-label` and their `title`. `Board.tsx`
and `board-size.ts` are untouched by this phase, as the notes claim. `../London` and
`../Conquest` hold no change of ours.

**Mutation-checked, four, each reversed with the reverse edit.**

| Mutation | Red |
|---|---|
| `clampPly` stops clamping at the top | 3 tests, across `replay.test.ts` and the viewer |
| `plyBeforeMove` answers the position AFTER the move | 3 tests, both files |
| the marked move is `entry.ply` rather than `entry.ply + 1` | the mark test |
| `canResume` forgets `!session.outcome` | the finished-game test |

**Driven in the pane myself at 1280 by 980**, storage cleared first and after, both
themes, against the real engine.

- **The viewer.** The 20-move scene reviewed: clicking a move moved the board and the
  mark, the bar followed the position looked at (+0.8 at the end, +0.3 after 1.e4,
  +0.4 at the start), the arrows disabled at each end, and the board stayed locked.
- **The list scrolls itself** (the one thing no test can hold). From a list scrolled to
  the top, clicking the last move took the list's `scrollTop` 0 to 304 while `main`'s
  stayed 0, the window's `scrollY` stayed 0 and the board's y stayed 167.
- **The slip's position, both marks at once.** On the blunder: `lastMove` h5-e5, which
  is Qxe5+ itself, with one blue arrow f1-c4, which is the engine's 3.Bc4. One step on,
  the arrow is gone and the bar drops -0.3 to -6.1. The inaccuracy reads the same way,
  d1-h5 with a blue d2-d4. Seen drawn in the light theme in a screenshot, and the mark
  computes to `--mark` in both themes (#c9e2cc light, #3a5b3f dark).
- **Keep playing** from a board standing at ply 2 handed back the game's OWN final
  position (`__cg.getFen()` equal to `__game.fen`), report gone, row two gone, no move
  buttons left in the list, Undo and Hint live, status "Your move".
- **Play from here** started a game that the engine then played: e4 answered by c5,
  the bar +0.3, the new game in storage in place of the old.
- **The probe with the report and row two showing.** Small: board 416, bar, `.board`
  and `cg-board` all ending at 583, row two spanning x 68 to 484 against a board of 68
  to 484. Large: board 672, all three ending at 836, row two 68 to 740 against 68 to
  740, its own bottom 930.7 in a 980 window. `scrollWidth` 1280 = `innerWidth` in both,
  `scrollHeight` 980 = `innerHeight`. **416 and 672 are gate 10's own numbers on this
  viewport with only row one showing, so the board does not change size when row two
  appears.** Below the board: 94.7 px used of `CHROME_BELOW`'s 120.

**One finding that needs a fix, and it is mine rather than the builder's.** Spec 18.4
says Play from here is "disabled ... when the position is the engine's move **or the
start**". The chip said "the trainer's `whyNotPlayable` reasons" and left the second
half out, and the trainer has no rule for the start, because a trainer game can begin
from a Study position where the start is a real position to practise. Here it never is:
ply 0 is always the opening position, so Play from here there is New game with a
different name that also throws the reviewed game away. Measured: at ply 0 with the
user as White the button is live, its tooltip says "Start a new game from the position
on the board", and pressing it starts an empty game. (As Black it is already off, with
the engine's-move sentence.) Nothing breaks; it is a duplicate control the spec asked
us not to offer. **Ruling: `whyNotPlayable` answers "This is the start of the game. Use
New game." at ply 0**, which is the shape of its other two sentences, a statement and
what to do instead. Box 12.1.

**Two small ones, same box.** `MoveList` sets a `walkable` class that no rule in this
app or the trainer uses; gate 2's rule is that unused code goes, and the builder
applied it to three trainer functions, so it applies here too. And `play-context.tsx`
gained a double blank line where `discard` used to follow `finish`.

**Taken on the builder's account.** Its own pane measurements, its light-theme and
dark-theme walk, and the `requestAnimationFrame` finding, which I met myself while
reading shapes out of the SVG and which its CLAUDE.md entry describes exactly.

**Nick's open boxes are unchanged:** 7.8 (publish, Home Screen, aeroplane mode), 8.6
(the installer walk) and now 12.6 (1.1.0 over 1.0.0). Q22, the deployment choice, is
still his to make and nothing in the app waits on it.

### Phase 12 - builder notes (2026-09-13)

The session was compacted after phase 11. Everything the chip named was read fresh
before anything was touched: `CLAUDE.md` all through, spec 17 then 18 and 18.7 then S15,
the plan's rules and phase 12 and the gate 11 findings, `docs/acceptance.md`,
`docs/simple-chess-deploy.md`, `docs/testing.md`, `README.md`, and then
`ui/play-from-replay.ts` and its test, `ui/MoveList.tsx`, `ui/play-context.tsx` and
`ui/viewer.dom.test.tsx`.

**Two commits, as the chip asks.** `ce0e743` is gate 11's three findings, on its own so a
bisect can tell the fix from the release; the release is the second.

**12.1, measured.** Before the fix, stepping back through a six-move reviewed game in the
pane, Play from here was live at ply 0 with "Start a new game from the position on the
board". After it, the sentence at each ply reads: Nxe5 on, Qxe5+ engine's move, Nc6 on,
Qh5 engine's move, e5 on, e4 engine's move, and at the start **"This is the start of the
game. Use New game."** with Back disabled beside it. The start is asked BEFORE the colour,
because at ply 0 a user playing Black is also facing the engine's move and "Step one move
on or back" is half wrong there: back is disabled. Mutation-checked: changing `ply <= 0`
to `ply < 0` in both functions turns two tests red, one string and one DOM, and it was
reversed with the reverse edit. The `walkable` class is gone from `MoveList` and the class
list reads `move-list` in the pane; the double blank line in `play-context.tsx` is gone.

**12.3, the build.** `npx tauri build` with `%USERPROFILE%\.cargo\bin` on the path,
**2 m 29 s** for the Rust half.

| | |
|---|---|
| Installer | `src-tauri/target/release/bundle/nsis/Simply Chess_1.1.0_x64-setup.exe`, **6,898,142 bytes** |
| Executable | `src-tauri/target/release/simply-chess.exe`, **9,150,976 bytes** |
| Version | 1.1.0 in `package.json`, `tauri.conf.json` and `Cargo.toml`, held by four tests |

**The packaged window, driven over the debugging port.** Title "Simply Chess", inner size
**1400 by 980**, header "Simply Chess v1.1.0", `__TAURI_INTERNALS__` present,
`navigator.serviceWorker.getRegistrations()` **empty** and no update bar (S12). The layout
probe against that real window: board and `cg-board` both **688** at x 68, the bar 24 wide
at x 24, **all three ending on 852**; the list 167 x 688 at x 780; the side panel 405 at
x 971; the selector row at y 80.67 and the head row at y 124; `scrollWidth` **1400** =
`innerWidth` **1400**. S16 holds in the shipped window, and 688 is exactly what phase 9's
re-measured chrome predicted for this window at a display scale of 1.5.

**The engine and the review both run in the shipped window.** A game seeded into the
window's own storage and reopened was evaluated to **-6.0** on the bar. Stop and review
scanned it and produced "A blunder on move 3: Qxe5+ turned "level" into "winning for
black". The engine preferred 3.Bc4." above the inaccuracy, with "Winning for Black" and
"Stopped after move 3", the status "Game reviewed", and row two with Keep playing, Play
from here and the arrows, Forward disabled at the end. Clicking the blunder's sentence
moved the mark to Nc6, took the bar to **-0.2**, highlighted h5 and e5 (the slip itself,
computed from the 688 board: 344/86 = e, 602/86 = h, both on rank 5) and drew the blue
arrow f1-c4 beside it. `window.__cg` is undefined there, which is right: the dev handle is
`import.meta.env.DEV` gated and this is a production bundle, so the arrow was read from
the SVG instead.

**The one screenshot** (`packaged-eval.mjs --shot`) was taken on that position and looked
at: the header at 1.1.0 with Small and Light, the centred Difficulty row, "Playing White
against 1. Very casual" and "Game reviewed", the 688 board with the bar at -0.2, the two
green highlight squares and the blue arrow together, Nc6 marked in `--mark` in the list,
the report with its red and blue slip borders, and both button rows with New game live and
Undo, Redo and Hint greyed. That is the whole of version 2 in the shipped window.

`node scripts/check-uninstall-hook.mjs` re-run: all four cases behaved, only the ticked
non-upgrade uninstall removing the folder.

**12.2, the acceptance rewrite.** `docs/acceptance.md` was version 1's walk and parts of
it had become false: the name, a 1280 by 1000 window, four buttons, a 280 px sidebar and
257 tests. It is rewritten rather than added to, because it is the record of what was
checked and a record that describes an app that no longer exists is not one.

- **A new item 8, "Stopping, reviewing and walking a game"**, rather than folding 18.3 to
  18.5 into items 2 and 6. It is the largest thing version 2 added and item 2 is about
  playing rather than reading, so they are different questions. The file half of 18.6 did
  go into item 6, beside the version 1 file it extends, because that item is already about
  what a saved game contains. Windows and iPad shifted to 9 and 10, tests to 11, docs to
  12, and the two stale "item 8" cross-references were corrected.
- Every number in it is either measured in this phase or quoted from the phase note or
  gate finding that measured it, and says which. Item 1 carries a table of six rows saying
  where each measurement came from.
- **All eight of 18.7's items already had tests**, so none had to be written: 12, 13, 17
  and 19 in `review.dom.test.tsx`, 14, 15 and 16 in `viewer.dom.test.tsx` with
  `play-from-replay.test.ts` beside it, 18 in `remembered.dom.test.tsx` across two tests,
  and 19 again in `game-pgn.test.ts` for the file half. The S15 table now runs to nineteen
  rows, each naming the file and the test.
- The walk records the two items that found holes rather than confirming them: item 10 in
  phase 8 (the hint and the outcome were not held), and item 16 at gate 11 (Play from here
  at the start), which is what 12.1 fixed.

**12.4, the second route.** `docs/simple-chess-deploy.md` gains a table comparing the two
and a section 3a, Caddy on the LAN: build, `mkcert -install` and a certificate for the
machine's LAN name, the root certificate trusted once on the iPad in two places (the
profile AND Certificate Trust Settings, because the first without the second leaves Safari
refusing the page), a six-line Caddyfile with `try_files` for the single page, the
firewall on private networks only, and then the same Home Screen steps. Each existing
section is now labelled with the route it belongs to, and the front of the document says
the choice changes nothing in the code: the app is the same `dist/` either way and nothing
in the source reads a URL.

**Decided (and said here rather than guessed at).**

- **The acceptance document keeps spec 17's shape and numbering where it can**, with the
  two new items inserted rather than the whole list renumbered around them. A reader
  holding the spec open should be able to follow both.
- **The bar reading "the engine has not looked yet" on a reopened checkmate is correct**,
  not a fault, and the acceptance document says so: a mated position has no move to
  search, so there is no evaluation for it. It looked wrong when the packaged window first
  opened on a 65-move mated game left by an earlier session's drive.

**Left, and it is all Nick's.**

- **Box 12.6**, which supersedes 8.6: install 1.1.0 (over the interim Simply Chess 1.0.0
  if it is there, checking the settings and the game survive), open it, play a move, save
  and load through the real dialogs, close and reopen, stop and review a game, then
  uninstall with the box ticked and check `%LOCALAPPDATA%\Simply Chess Data` is gone.
- **Box 7.8**, the iPad, once he chooses a route.
- **Q22 itself.** Nothing in the code waits on it.
- The installer was NOT run from this session, and `%LOCALAPPDATA%\Simply Chess Data` was
  not deleted. The packaged window's own storage did have a game seeded into it for the
  review drive, over a 65-move game a previous session's drive had left; the seeded game
  was removed afterwards and the four settings keys left as they were.
- `../London` and `../Conquest` were not touched.

### Phase 13 - builder notes (2026-09-14)

Everything the chip named was read fresh before anything was touched: `CLAUDE.md` all
through, spec 19 then 18.1, 18.3 to 18.5 and S2, the plan's rules and phase 13 and the
phase 9 notes, `docs/testing.md` and `docs/acceptance.md`, and then `App.tsx`,
`DifficultyRow.tsx`, `SidePanel.tsx`, `PlayActions.tsx`, `PlayControls.tsx`,
`Screen.tsx`, `board-size.ts`, `app.css` and `play.css`.

**Measured.**

- `npx vitest run`: 37 files, **324 tests passed, none skipped**, 9.1 seconds warm (255
  string in 25 files, 69 DOM in 12). The count is unchanged because this phase added
  assertions to tests that already mount rather than mounts of its own, which is what
  the twenty-second rule asks for. `tsc -b` clean, `npx oxlint` silent, `npm run build`
  clean (main chunk 329.31 kB, precache 21 entries), `grep -c midgame` 0 in every built
  chunk, no em dashes under `src/` or `src-tauri/src/`.
- **The layout pass, twelve rows**, `?scene=midgame`, the probe read from the file in
  the pane. The bar, `.board` and `cg-board` share one bottom in every row, no row under
  the board is wider than the board, and `scrollWidth` never exceeds `innerWidth`.

  | Viewport | Size | Theme | Board | Bar/board/cg bottom | Fourth row ends at | Row widths | scrollWidth / innerWidth |
  |---|---|---|---|---|---|---|---|
  | 1400 x 980 | large | dark | 584 | 751 | 951 | 584, 584, 584, 584 | 1400 / 1400 |
  | 1400 x 980 | large | light | 584 | 751 | 951 | 584, 584, 584, 584 | 1400 / 1400 |
  | 1400 x 980 | small | dark | 416 | 583 | 783 | 416, 416, 416, 416 | 1400 / 1400 |
  | 1400 x 980 | small | light | 416 | 583 | 783 | 416, 416, 416, 416 | 1400 / 1400 |
  | 1180 x 820 | large | dark | 424 | 591 | 791 | 424, 424, 424, 424 | 1180 / 1180 |
  | 1180 x 820 | large | light | 424 | 591 | 791 | 424, 424, 424, 424 | 1180 / 1180 |
  | 1180 x 820 | small | dark | 416 | 583 | 783 | 416, 416, 416, 416 | 1180 / 1180 |
  | 1180 x 820 | small | light | 416 | 583 | 783 | 416, 416, 416, 416 | 1180 / 1180 |
  | 820 x 1180 | large | dark | 728 | 895 | 1095 | 728, 728, 728, 728 | 805 / 820 |
  | 820 x 1180 | large | light | 728 | 895 | 1095 | 728, 728, 728, 728 | 805 / 820 |
  | 820 x 1180 | small | dark | 416 | 583 | 783 | 416, 416, 416, 416 | 820 / 820 |
  | 820 x 1180 | small | light | 416 | 583 | 783 | 416, 416, 416, 416 | 820 / 820 |

  The last four rows are the narrow layout, where the page scrolls down as it always
  did there and the board takes the width the other two columns would have had.

  One thing about the pane rather than about the app: its viewport emulation does not
  fire a `resize` event, so the first reading after a resize is the OLD window's answer
  and says 584 where the board is about to be 424. Every row above was taken after a
  navigation at that viewport. A real window fires `resize` and `useBoardPixels` listens
  for it.
- **`CHROME_BELOW` is 224**, where phase 9 measured 120. Read off the probe at 1400 by
  980 with the small board: the column's 12px gap under the board, then four rows of 38
  with a 12px gap between them, then the page's 24px bottom padding. 12 + 38 + 12 + 38 +
  12 + 38 + 12 + 38 + 24 = 224. Measured at a display scale of 1, where a row is 38
  rather than the 37.33 the pane reports at 1.5, because the larger is the one that has
  to fit.
- **The state with the most rows is a game in progress, not a report**, which is the one
  place this phase departs from the chip's wording. Both states have four rows; the
  review row carries phase 11's -4px top margin, so a report showing ends at 947 where a
  game in progress ends at 951, in the same load at the same board size. 224 covers the
  taller of the two, and the board was 584 in both, so it still does not change size when
  the report arrives.
- **What it costs the board**, recorded so the number is not a surprise: the large board
  is **584** at 1400 by 980 where phase 9 measured 688, and **576** at a display scale of
  1.25 or 1.5, which is this machine. On a landscape iPad it is **424** against the small
  board's 416, and at a fractional scale there it steps to 416 itself. The upright iPad is
  unchanged at 728, because the width runs out there before the height does. The full 832
  now needs a viewport 1223px tall rather than 1115.
- **The report, in the pane at 1400 by 980.** It starts at y 167 with the side panel's own
  top at y 167, where the chip measured it starting 195.8px down the column. Its computed
  colour is `rgb(200, 204, 210)` at 16px and weight 400, and `.play-opening`'s is
  `rgb(200, 204, 210)` at 16px and weight 400: the same three values, read in the same
  load. In the light theme both are `rgb(61, 65, 71)`. The headings, the slips, the
  verdict, the hint count and the outcome are all that colour; the blunder's left edge is
  still `rgb(224, 122, 111)`.
- **"Difficulty" starts on the same pixel as "Simply Chess"**: both x 24, which is the
  page's `--pad-left` and nothing else (Q26). No button is left in the header, and the
  only buttons in the panel are the report's own two slips and Copy game.
- **Looked at**, two screenshots. A reviewed game at the large board in the dark theme:
  the header with the name alone, the Difficulty row under it at the left, the 584 board
  with its bar at -6.2, the four rows under it with the review row second and the arrows
  at the board's right edge, the settings row with PLAY AS, the two radios and Small and
  Light at the far end, and the report filling the panel from its top with both slips in
  their coloured borders. The same game at the small board in the light theme reads the
  same way. Nothing is cut off and nothing scrolls sideways.
- **The seeded game for that drive** was 1.e4 e5 2.Qh5 Nc6 3.Qxe5+ Nxe5, scanned by the
  real engine into a blunder and an inaccuracy, so the slips on screen are the engine's
  rather than a fixture's.

**Decided (code shape), and why.**

- **A component per row, and `PlayControls` keeps rows one and two.** The chip left the
  choice open. Rows one and two act on the game in front of you and row two has two
  exclusive states, so the choice between them belongs in one place, which is
  `PlayControls`: it renders `PlayActions` where the review row is not. Rows three and
  four act on neither, so they are `FileRow.tsx` and `SettingsRow.tsx`, composed by
  `Screen` beside it. Each row is built in exactly one file.
- **`SidePanel.tsx` is gone rather than renamed.** Both halves of it left: Play as went
  into `SettingsRow` and the file buttons into `FileRow`, and what is left in the panel
  is the hint sentence and the report, which `Screen` already composed. A file holding
  nothing is not a file. `SettingsProps` and `FileProps` went with their controls, so each
  interface now lives in the component that consumes it.
- **`SettingsProps.onLevel` went with it.** It was passed from `Shell` to `Screen` and
  read by nobody: the selector row is wired up directly. The level itself stays in the
  bundle, because the head row falls back to it.
- **Play as is a `role="radiogroup"` rather than a fieldset.** Measured first: a fieldset
  draws its legend in the top border, which put "PLAY AS" on a line of its own, made the
  row 53.39px tall against the 38 of the three above it, and cost the board 15 more
  pixels. The role and an `aria-label` say the same thing to a screen reader, on one
  line. The label keeps the legend's faint upper case.
- **The outcome's sentence is a `Notice` under the rows**, not a line inside row two. The
  chip asks for it "where the other notices already are, under the buttons", and that is
  also the only place it does not move the two rows below it every time a game ends. It
  is written in `Screen`, beside the two notices it now sits with, and `PlayActions` says
  so in its header comment. It was a hand-written `<p className="notice">` in
  `PlayActions` before this phase, which was a second copy of what `Notice.tsx` exists to
  be, so the move closed a duplication as well.
- **The two toggles are ordinary buttons now.** They were `nav-link theme-toggle`, whose
  margin, left border and faint colour are a header device; in a row of buttons under the
  board they read as buttons, which is what spec 19.1's diagram draws. `.nav-link`,
  `.theme-toggle` and `.app-nav` are gone from `app.css` with the nav they styled.
- **`.play-steps` and `.play-views` share one rule.** The chip asks for the toggles to end
  their row "exactly as the stepping arrows end row 2 today. One pattern, already in
  play.css", so the pattern is one rule with two selectors rather than three declarations
  written twice.
- **The report's colour is one rule on `.report`**, and the per-line classes went: the
  hint count's `.hint-count` and the outcome's `.hint` were the two lines that read
  differently, and with one colour for all of them neither has anything left to say. The
  `.hint` class survives with one user, Copy game's "Copied", which is feedback rather
  than a line of the report.
- **The headings keep their case and letter spacing.** S20 names the colour, the size and
  the weight and says nothing about case, and without something a heading at the body size
  and weight is not a heading. Looked at in both themes: they read as labels, which is
  what they are.

**Tests.**

- **S15 item 20** is held twice, once per state of row two. `remembered.dom.test.tsx`
  walks ten named controls plus the radios and asks that each one's
  `closest('.play-column')` is not null, and that neither the panel nor the header holds
  a button; `viewer.dom.test.tsx` asks the same of Keep playing, Play from here and the
  arrows, and that every button in the panel is inside the report. Finding each by NAME is
  the point: a control that moves again keeps its test, and only the column it is asked
  about changes.
- **S15 item 21** can only be held structurally in jsdom, which applies no stylesheet:
  `review.dom.test.tsx` asks that no heading or paragraph of the report carries a class of
  its own for the one rule to lose to. The colour itself is a pane measurement, above, and
  `docs/acceptance.md` says so rather than implying a test holds it.
- **S15 item 22** is `remembered.dom.test.tsx`, which now clicks the theme toggle beside
  the other three settings and checks all four across a restart.
- **Mutation-checked.** Rendering `FileRow` inside the side panel instead of under the
  board turns both halves of item 20 red, one test in each file. Reversed with the reverse
  edit, never `git checkout --`.
- **Five test files reached a moved control, not the four the chip predicted.** The fifth
  is `shell.dom.test.tsx`, whose theme-toggle test pressed a button that used to be in the
  header and is now inside `Screen`, which renders nothing until the first game exists: it
  waits for the board first, which is the one line it cost. `files.dom.test.tsx` needed no
  change at all, because every one of its seventeen references finds a button by its name.

**Asked of Nick.** Nothing. Section 19 settled every question this phase raised, and the
two judgement calls it left open (which component holds each row, and what to do with a
row that will not fit) are the chip's own decision rules.

**Reuse review.** Four things found and closed: the notice duplication above; the
`margin-left: auto` pattern, now one rule for both groups; the dead `onLevel`; and the
"switch to the large board" and "switch to the light theme" sentences, which are now
written once in `SettingsRow` where they were in `App`. Every class in both stylesheets
still has a component that uses it, counted. `--surface-hover` in `index.css` is now
unused and was left, because that file is the trainer's palette copied byte-identical (S3)
and a palette entry is not a rule. No em dashes under `src/`, and no forbidden word in a
new or adapted file.

**Left.**

- **No Windows window was built.** 1.2.0 is a source version this phase (the chip's own
  out-of-scope list), so the only installer on disk is 1.1.0's.  `docs/acceptance.md` item
  9 says which version its numbers belong to and what will differ when a 1.2.0 window is
  built: the board size and the four rows.
- **Box 12.6 still names 1.1.0**, because that is the installer that exists. Whoever
  builds 1.2.0 should point that box at the new one.
- **The landscape iPad's two board sizes have nearly converged**: 424 against 416, and 416
  against 416 at a fractional display scale. It is not BELOW the small board, so the
  chip's stop rule does not fire, but at 1180 by 820 the size toggle now does almost
  nothing, and Nick should know that before he meets it.
- Two files, `src/dev/use-dev-scene.ts` and `src/ui/keep-in-view.ts`, showed as modified in
  `git status` at the start of this session with an empty diff. They are byte-identical to
  `HEAD`, checked by hash and by length: a stale stat cache, and neither was touched or
  staged.
- The pane's `localStorage` and `sessionStorage` were cleared after the last drive and the
  dev server was stopped.
- `../London` and `../Conquest` were not touched.

### Gate 13 findings (orchestrator, 2026-09-14)

**Passed.** One thing for Nick to rule, and it is a trade rather than a defect: see the
last paragraph.

**Verified from the repo.** `npx vitest run`: 37 files, **324 passed, none skipped, 9.2
seconds**. `tsc -b` clean, `npx oxlint` exit 0 with no output, `npm run build` clean,
precache 21 entries. No `midgame`, `repertoire` or `trainee` in any built chunk; no em
dash under `src/` or `src-tauri/src/`. `../London` and `../Conquest` hold no change of
ours.

**Mutation-checked, three, each reversed.**

| Mutation | Red |
|---|---|
| `CHROME_BELOW` back to 120, the two-row number | 6 of `board-size.test.ts`'s 16 |
| `SettingsRow` rendered in the side panel instead of the board column | 2 tests, one in `remembered.dom.test.tsx` and one in `viewer.dom.test.tsx` |
| the report's outcome line given a class of its own again | the report's structural test in `review.dom.test.tsx` |

**Driven in the pane myself at 1400 by 980**, storage cleared first and after.

- **Nothing is left behind.** Zero buttons in the header, zero in the side panel with no
  report showing, and with one showing the only three are the report's own two slips and
  Copy game.
- **The four rows are each exactly the width of the board**, 584 at this viewport, at y
  763, 813, 863 and 913, which is 38 and a 12 gap four times over. Row two carried Stop
  and review and Stop and discard before the review and Keep playing, Play from here and
  the two arrows after it, and **the board stayed 584 across that change**.
- **The report starts at y 167 with the panel's own top at y 167**, where the chip
  measured it starting 195.8 px down. All of it is back.
- **The report reads in the head row's colour, measured in the same load**: every line of
  it, headings included, is `rgb(200, 204, 210)` at 16 px and weight 400 in the dark
  theme, and `.play-opening` is the same three values; in the light theme both are
  `rgb(61, 65, 71)`. The blunder's left edge is still `rgb(224, 122, 111)`, so the
  meaning-carrying colours were left alone.
- **"Difficulty" starts on the same pixel as "Simply Chess"**, both x 24.
- **The probe, light theme, review state**: bar, `.board` and `cg-board` all end at 751,
  every row 584 wide ending at 947, `scrollWidth` 1400 = `innerWidth`, and
  `scrollHeight` 980 = `innerHeight`, so the page scrolls in neither direction.
- **1180 by 820**: the large board is 424 and the small is 416.

**Taken on the builder's account**, and it corrected the chip rather than the other way
round: the state with the MOST rows is a game in progress, not a report, because the
review row carries phase 11's -4 px top margin. It measured both and sized the constant
for the taller. The chip said the opposite and the chip was wrong.

**The one thing for Nick.** The room for the report came out of the board, as the chip
said it would, and the number is bigger than I guessed: `CHROME_BELOW` went 120 to 224,
so the large board is **584 at 1400 by 980, or 576 at this machine's display scale**,
where it was 688. On a landscape iPad it is **424 against the small board's 416**, and at
a fractional scale there the two are both 416, so the size toggle does nothing on that
one device. Everything else is unaffected: the small board is 416 as it always was, and
the upright iPad is still 728 because the width runs out there before the height does.
If Nick wants the board back, the lever is the number of rows: putting the two view
toggles back in the header makes it three rows, `CHROME_BELOW` about 174, and the large
board about 632 in the window and 472 landscape. That is his call, not a fix.

**The 1.2.0 Windows build, made at this gate** (Nick asked for it with the review).
`npx tauri build` clean in 1 m 59 s. The installer is
`src-tauri/target/release/bundle/nsis/Simply Chess_1.2.0_x64-setup.exe`, **6,897,503
bytes**, and the executable is `simply-chess.exe`, 9,150,464 bytes. The window was
started with its debugging port and read with `scripts/packaged-eval.mjs`: title "Simply
Chess", "v1.2.0" in the header, inner size 1400 by 980 at a display scale of 1.5, no
button in the header and none in the side panel, "Difficulty" and "Simply Chess" both at
x 24, the head row's colour `rgb(200, 204, 210)`, no service worker (S12), and
`scrollWidth` 1400 against `innerWidth` 1400. The small board is 416 with its four rows
each 416 wide, and the large board is **576** there, which is `board-size.test.ts`'s own
number for a scale of 1.5; its four rows are each 576 and the last ends at 937 in a 980
window, with the bar and `cg-board` ending together at 740. **The engine runs in it**:
the bar read +0.4 on the opening position. One screenshot was taken and looked at.
Box 12.6 now has a 1.2.0 installer to point at.

### Phase 14 - builder notes (2026-09-14)

Everything the chip named was read fresh before anything was touched: `CLAUDE.md`, spec
section 19 in full with Q27 and the S19 it corrects, 18.1's header, the plan's rules and
phase 14's boxes, the phase 13 notes and the gate 13 findings, then `App.tsx`,
`SettingsRow.tsx`, `PlayControls.tsx`, `Screen.tsx`, `app.css` and `play.css`, and the
same files at `fccab21`, the commit before phase 13.

**Measured.**

- `npx vitest run`: 37 files, **325 tests passed, none skipped**, 9.0 seconds warm (255
  string in 25 files, 70 DOM in 12). One test is new. `tsc -b` clean, `npx oxlint`
  silent, `npm run build` clean (main chunk 329.25 kB, precache 21 entries), `grep -c
  midgame` 0 in every built chunk, no em dashes under `src/` or `src-tauri/src/`.
- **The pane pass at 1400 by 980, eight rows**: both states of row two, both board sizes,
  both themes. The bar, `.board` and `cg-board` share one bottom in every row, no row is
  wider than the board, the page scrolls in neither direction, and the arrow group's
  right edge is the board's right edge in all four review rows.

  | Row two | Size | Theme | Board | Bar/board/cg bottom | Fourth row ends at | Row widths | Arrows end at | scrollWidth / innerWidth |
  |---|---|---|---|---|---|---|---|---|
  | playing | large | dark | 584 | 751 | 951 | 584 x 4 | not shown | 1400 / 1400 |
  | review | large | dark | 576 | 740 | 933.33 | 576 x 4 | 644, board 644 | 1400 / 1400 |
  | review | large | light | 576 | 740 | 933.33 | 576 x 4 | 644, board 644 | 1400 / 1400 |
  | review | small | light | 416 | 580 | 773.33 | 416 x 4 | 484, board 484 | 1400 / 1400 |
  | review | small | dark | 416 | 580 | 773.33 | 416 x 4 | 484, board 484 | 1400 / 1400 |
  | playing | small | dark | 416 | 580 | 777.33 | 416 x 4 | not shown | 1400 / 1400 |
  | playing | small | light | 416 | 580 | 777.33 | 416 x 4 | not shown | 1400 / 1400 |
  | playing | large | light | 576 | 740 | 937.33 | 576 x 4 | not shown | 1400 / 1400 |

  The first row is the one load the pane reported at a display scale of 1, where the
  board is 584 and a row is 38; every other row is at 1.5, where the board is 576 and a
  row 37.33. Both are 1.2.0's own numbers for those scales, which is 14.5's real
  question: **the board did not change size.** `board-size.ts` was not touched.
- **The four rows' content widths at the small board**, which is the 416 that matters:
  197 (Undo, Redo, Hint), 293 (Stop and review, Stop and discard), 214 (Save game, Load
  game) and **324** (New game, Play as and its radios). The widest is row four with 92px
  to spare. The chip predicted about 294 for it; the extra 30 is the Play as label's
  upper case and letter spacing, which phase 13 measured at 214 for the group rather
  than the 184 the chip carried forward. Nothing wraps at either size.
- **The three placements, read off the screen.** The header's buttons are Small and
  Light, both inside `.app-nav`, with the nav's right edge at x 1376 against the page's
  own right padding. The arrows are in row ZERO, ending at x 644 with the board's right
  edge at 644 (484 and 484 at the small board), immediately under the board's bottom.
  New game is the first thing in row three, the last row, with Play as beside it.
  "Difficulty" and "Simply Chess" still start on the same pixel, both x 24.
- **Two screenshots, looked at.** The large dark review state: Small and Light at the
  right of the header, the 576 board, the arrows on its bottom right corner in the Undo,
  Redo, Hint row, Keep playing and Play from here under them, then Save game and Load
  game, then New game beside PLAY AS, and the report filling the panel from its top with
  both slips in their coloured borders. The large dark playing state reads the same with
  Stop and review and Stop and discard in row two and no arrows anywhere. The seeded
  game for both was 1.e4 e5 2.Qh5 Nc6 3.Qxe5+ Nxe5, scanned by the real engine into a
  blunder and an inaccuracy.

**The installer, 14.6.** `npx tauri build` with `%USERPROFILE%\.cargo\bin` on the path,
**1 m 55 s**, the Rust half 1 m 40 s.

| | |
|---|---|
| Installer | `src-tauri/target/release/bundle/nsis/Simply Chess_1.2.1_x64-setup.exe`, **6,897,569 bytes** |
| Executable | `src-tauri/target/release/simply-chess.exe`, **9,150,464 bytes** |
| Version | 1.2.1 in `package.json`, `tauri.conf.json` and `Cargo.toml`, held by four tests |

**The shipped window was driven, not assumed.** Started with its debugging port and read
through `scripts/packaged-eval.mjs`: title "Simply Chess", "v1.2.1" in the header, inner
1400 by 980 at a display scale of 1.5, `__TAURI_INTERNALS__` present, no service worker
(S12). The header's two buttons are Small and Light. The four rows read "UndoRedoHint",
"Stop and reviewStop and discard", "Save gameLoad game" and "New gamePlay asWhiteBlack",
each 576 wide from x 68 to x 644, which is the board's own span; New game is in the
fourth. The bar, `.board` and `cg-board` all end at 740, `scrollWidth` 1400 =
`innerWidth` and `scrollHeight` 980 = `innerHeight`. A game seeded into the window's own
storage was scanned by Stop and review into two slips, the blunder naming 3.Bc4, with the
report starting at the panel's own top; row one then read "UndoRedoHint" plus the arrows,
the arrow group ending at x 644, and row two was Keep playing and Play from here with no
arrows in it. One screenshot was taken, looked at and sent to Nick. The seeded game was
removed afterwards and the four settings keys left as they were.

**Decided (code shape), and why.**

- **The header is bytes, not a rewrite.** `git show fccab21:src/ui/app.css` was diffed
  against the file afterwards: the only differences left are 1.2.0's selector-row
  change, which stays. `.app-header`'s `justify-content: space-between`, `.app-nav`,
  `.nav-link`, `.nav-link:hover`, `.theme-toggle` and `.theme-toggle:hover` are the same
  declarations in the same order with their own comments, and the nav markup in
  `App.tsx` is the same JSX with one word added to its comment to say Q27 restored it.
  Nick liked what was there, so what he gets back is what was there.
- **`SettingsProps` lost two setters and kept two readers.** `onBoardSize`, `theme` and
  `onTheme` went back to `Shell`, which owns the header. `boardSize` stays in the bundle
  because `Screen` works the board's pixels out from it, beside `level`, which the head
  row falls back to: the interface already said in a comment that a value can be there to
  be READ, and now two are.
- **`SettingsRow` keeps its name**, as the chip asks. It is still the row that says what
  the NEXT game will be, which is what the name means; its header comment says that
  rather than describing settings in general, and says where the toggles went.
- **`PlayControls` lost `onNew` altogether.** It was passed from `Screen` and used by one
  button, and that button is in row four now, so the prop went with it rather than being
  left to be wired to nothing. `Screen` passes `onNewGame` to `SettingsRow` instead.
- **New game's disabled rule travelled with the button**, comment included: still
  `disabled={thinking}`, still for gate 2's reason.
- **`.play-views` is gone from the markup and from the selector list**, and
  `.play-controls .play-steps` stands alone again with the comment saying it moved rows
  rather than changed. `--surface-hover` in `index.css` has a user again, which is what
  the chip predicted.

**Tests.**

- **S15 item 23** is held in both places it can be seen: `viewer.dom.test.tsx` asks that
  the two arrows, Undo, Redo and Hint are all in `rows[0]`, that Keep playing is in
  `rows[1]`, and that row two holds no `.play-steps` at all;
  `remembered.dom.test.tsx` asks that each toggle's `closest('.app-nav')` is not null and
  its `closest('.play-column')` is.
- **Items 20 and 22 now say "every control except the two view toggles"**, which is
  19.2's own wording, and the test that held item 20 is renamed to match: "puts every
  control but the two toggles under the board".
- **One new test**, "puts New game in the same row as Play as", for the third of Q27's
  placements: it takes the four `.play-controls` rows and asserts New game and the White
  radio are both in the fourth. That is the pairing Nick asked for, held where a test can
  see it.
- **Mutation-checked, three, each reversed with the reverse edit.**

  | Mutation | Red |
  |---|---|
  | the arrows never rendered in row one (`false && replay`) | 3 tests in `viewer.dom.test.tsx` |
  | New game hidden in row four | 10 tests across five files |
  | `.app-nav` renamed on the header's nav | 1, the header half of items 20 and 23 |

  The third is the weakest of the three and is recorded as such: it proves the assertion
  reads the header's nav rather than the button's existence, but a real move of the
  toggles back under the board would have needed the props threading through `Screen`
  again, which is a bigger edit than a mutation check should be.
- **`shell.dom.test.tsx` kept phase 13's extra line.** It waits for the board before
  pressing the theme toggle. That wait is no longer needed now the toggle is in the
  header again, and it costs nothing and is true either way, so it stays rather than
  being taken out and put back the next time something moves.

**Asked of Nick.** Nothing. Q27 settled all three placements and the chip settled the
rest.

**Reuse review.** Both "switch to" sentences are written once, in `App.tsx`, where they
were before phase 13; the row markup is still one component per row with no row built
twice; `.play-views` left no orphan rule behind; and every class in both stylesheets has
a component that uses it, counted (`live-eval-number` is reached through a template
literal in `EvalBar.tsx`, as it was in phase 13). No em dashes under `src/`, and no
forbidden word in a changed file.

**Left.**

- **The board is still 584 at 1400 by 980** (576 at 1.25 or 1.5) and 424 on a landscape
  iPad. Gate 13 offered Nick a lever for getting it back and Q27 did not pull it: the
  toggles left row four and New game arrived in it, so there are still four rows and
  `CHROME_BELOW` still counts four. If he wants the board back it is a separate ruling
  about the number of ROWS, not about where a control sits.
- **Box 12.6 now has a 1.2.1 installer to point at**, and `docs/acceptance.md` says so.
  The 1.1.0 walk is kept under it because that is where the uninstaller, the data folder
  and the capability list were checked and none of that has changed.
- **The installer was not run** and `%LOCALAPPDATA%\Simply Chess Data` was not deleted.
- The pane's `localStorage` and `sessionStorage` were cleared after the drive and the dev
  server stopped; the packaged window was closed.
- Two files, `src/dev/use-dev-scene.ts` and `src/ui/keep-in-view.ts`, still show as
  modified in `git status` with an empty diff and are byte-identical to `HEAD`. It is the
  same stale stat cache phase 13 recorded; neither was touched or staged.
- `../London` and `../Conquest` were not touched.

### Gate 14 findings (orchestrator, 2026-09-14)

**Passed, with nothing outstanding.** All three of Q27's placements are on screen, in the
dev build and in the shipped window, and the board did not move.

**Verified from the repo.** `npx vitest run`: 37 files, **325 passed, none skipped, 10.6
seconds**. `tsc -b` clean, `npx oxlint` exit 0 with no output, `npm run build` clean.
`board-size.ts` is untouched and `CHROME_BELOW` is still 224, which is what 14.5 asks.
`../London` and `../Conquest` hold no change of ours.

**The header is the bytes it was.** `.app-nav`, `.nav-link` and `.theme-toggle` diffed
against `fccab21` rule by rule: identical. The nav markup diffed the same way: identical
but for four words added to its comment to say Q27 restored it. That is what 14.1 asked
for and it is the reason Nick gets back exactly what he liked.

**Mutation-checked, three, each reversed.**

| Mutation | Red |
|---|---|
| New game put back in row one | 5 tests in `remembered.dom.test.tsx` |
| the two arrows put back in row two | the viewer's stepping test |
| the two toggles rendered under the board | the placement test |

**Driven in the pane myself at 1400 by 980**, storage cleared first and after, both
sizes, both themes, both states of row two.

- **The toggles are in the header**, `nav-link theme-toggle`, the nav's right edge at
  x 1376 against the header's own right edge at x 1376.
- **The arrows are in row ZERO** with Undo, Redo and Hint, and the forward arrow's right
  edge is x 652 with the board's right edge at x 652 (484 and 484 at the small board).
  That is the board's bottom right corner, which is what Q27 asks for.
- **Row two is Keep playing and Play from here** and nothing else; **row four is New game
  and the two radios**.
- **The board is 584 large and 416 small**, which are 1.2.0's own numbers at this
  viewport: the row count did not change, so the board did not either.
- Bar, `.board` and `cg-board` all end at 751 large and 580 small; every row is exactly
  the board's width; `scrollWidth` 1400 = `innerWidth` and `scrollHeight` 980 =
  `innerHeight`.

**The shipped 1.2.1 window, driven over its debugging port.** "v1.2.1" in the header,
1400 by 980 at a display scale of 1.5, the header's two buttons Small and Light with the
nav ending at x 1376, no button in the side panel, no service worker (S12). The four rows
read "UndoRedoHint", "Stop and reviewStop and discard", "Save gameLoad game" and "New
gamePlay asWhiteBlack", each the board's own width. A game seeded into the window's own
storage was scanned by the real engine into two slips; with the report showing, row one
read "UndoRedoHint" plus the arrows with the group ending on the board's right edge, row
two was Keep playing and Play from here, and the report started at the panel's own top.
The seeded game was removed afterwards and the four settings keys left as they were. One
screenshot taken, looked at and sent to Nick.

**The installer, built at this gate.**

| | |
|---|---|
| Installer | `src-tauri/target/release/bundle/nsis/Simply Chess_1.2.1_x64-setup.exe`, **6,897,286 bytes** |
| Executable | `src-tauri/target/release/simply-chess.exe`, 9,150,464 bytes |

The builder's own build of the same commit recorded 6,897,569 bytes. **Neither number is
wrong**: an NSIS bundle carries build timestamps, so two builds of one commit differ by a
few hundred bytes. The file on disk now is this gate's, and it is the one Nick installs.

**One number corrected in the spec, not in the code.** S19 said the fourth row was "about
294 px" at the small board. The builder measured 324 and said so: the Play as group is
214 rather than the 184 the chip carried forward, because of the label's upper case and
letter spacing. The spec now carries the measured number. The row still fits 416 with 92
px to spare, so nothing about the layout changes.

**Nick's three boxes are all that is left**: 7.8 (publish, Home Screen, aeroplane mode),
8.6 and 12.6, now against the 1.3.0 installer.

### Phase 15 - builder notes (2026-09-14)

Everything the chip named was read fresh before anything was touched: `CLAUDE.md`, spec
section 20 in full, S2, S14 and 11.4, the plan's rules and phase 15's boxes, the gate 13
findings, then `board-size.ts`, `use-board-pixels.ts`, `App.tsx`, `storage/paths.ts`,
`storage/files.ts` for how a Tauri import is done here, `capabilities/default.json` and
`tauri.conf.json`.

**Measured.**

- `npx vitest run`: 38 files, **339 tests passed, none skipped, 9.5 seconds** warm (268
  string in 26 files, 71 DOM in 12). Fourteen tests are new. `tsc -b` clean, `npx oxlint`
  silent, `npm run build` clean, no em dashes under `src/` or `src-tauri/src/`.
- **The pane, at 1322 by 1274, v1.3.0 confirmed in the header first.** Pressing Large
  took the board from 416 to 712 and pressing Small took it back, with `innerWidth` and
  `innerHeight` the same 1322 by 1274 in all three readings and the setting written to
  storage each time. Nothing was fetched from the Tauri chunk: a check of
  `performance.getEntriesByType('resource')` for anything matching `tauri` came back
  empty, which is S14 held live rather than asserted. The layout probe read bar, `.board`
  and `cg-board` all ending on 583, four rows each 416 wide, `scrollWidth` 1322 =
  `innerWidth`. No console error. Storage cleared afterwards, 0 and 0.
- **The packaged 1.3.0 window, which is where this phase lives.** Read over
  `--remote-debugging-port=9333` with `scripts/packaged-eval.mjs`: title "Simply Chess",
  "v1.3.0" in the header, `__TAURI_INTERNALS__` present, display scale 1.5, monitor
  3840 by 2160 physical with a work area of 3840 by 2088, which is **2560 by 1392
  logical**.

  | Step | Window, inner logical | Position | Board |
  |---|---|---|---|
  | shrunk to the dead band | 1000 by 780 | x 572.67, y 190.67 | 416 |
  | Large | **1439.33 by 1223.33** | x 572.67, y 131.33 | **832** |
  | Small | **1023.33 by 807.33** | unchanged | 416 |
  | maximised | 2560 by 1369.33 | x -7.33, y -7.33 | 832 |
  | Small, from maximised | 1023.33 by 807.33 | the restored position | 416 |
  | small, in the bottom right corner | 1023.33 by 807.33 | x 1522, y 547.33, edges 2560 and 1392 | 416 |
  | Large, from that corner | 1439.33 by 1223.33 | **x 1106.67, y 132** | 832 |

  The corner case is the one worth reading twice. The window was on the bottom right
  corner of the work area and the large window is 416 wider and 416 taller than it, so
  leaving it where it was would have hung it 415 px off two edges. It came back to
  x 1106.67, y 132, whose right and bottom edges are 2560.67 and 1392.67 against the work
  area's 2560 and 1392: inside, to within the two-thirds of a pixel that a logical
  reading at a scale of 1.5 rounds by. It was not centred, which is the rule.
  In the Large step of the first table the x was left exactly where it was and only the y
  moved, which is "by the least that puts it there" doing its job on one axis.
- **S16 in the shipped window at both sizes.** 416 ending on 580 with `scrollWidth` 1024
  of `innerWidth` 1024, and **832 ending on 996** with 1440 of 1440, with the four rows
  the width of the board in both. One screenshot of the 832 board was taken, looked at
  and sent to Nick: the full large board with the bar level with it, the toggles reading
  Small and Light in the header, and the four rows under it.
- **The installer, 15.7.** `npx tauri build` with `%USERPROFILE%\.cargo\bin` on the path,
  **2 m 4 s**, the Rust half 1 m 49 s.

  | | |
  |---|---|
  | Installer | `src-tauri/target/release/bundle/nsis/Simply Chess_1.3.0_x64-setup.exe`, **6,902,858 bytes** |
  | Executable | `src-tauri/target/release/simply-chess.exe`, **9,156,096 bytes** |
  | Version | 1.3.0 in `package.json`, `tauri.conf.json` and `Cargo.toml`, held by four tests |

**Checked rather than assumed, which the chip asked for by name.**

- **`setSize` sets the INNER size.** Asked for 1439 by 1223 logical, the window read back
  an inner size of 1439.33 by 1223.33 and an outer size of 1454 by 1260.67. The
  difference, 14.67 by 37.33, is exactly the frame measured before the call, so the frame
  is added when deciding whether the window fits the screen and never subtracted from the
  size being set. Getting that backwards would have been a window a title bar too short
  every time, so it was read off the real window before anything depended on it.
- **The three new permissions were enough and none was refused.** Every read the phase
  needs was already in `core:window:default`; `set-size`, `unmaximize` and `set-position`
  were the three missing and all three answered in the shipped build.

**Decided (code shape), and why.**

- **One new file, `src/ui/window-size.ts`, holding both halves.** The pure
  `windowForBoard` and the thin `matchWindowToBoard` around it. They are one subject and
  splitting them would have put two files a letter apart in the same folder; the Tauri
  import is inside the function, so a string test importing the module pulls in nothing.
- **The chrome constants did not move.** `board-size.ts` gained `innerSizeForBoard`,
  which is the one way to ask what a board needs around it, so 607, 167 and 224 are still
  written in exactly one file and this phase never mentions them.
- **The window's minimum, 960 by 720, is written in one more place than it was**, because
  the arithmetic cannot read `tauri.conf.json` at runtime. It is held the way the data
  folder's name is held across its three files: a test reads the configuration and
  asserts both numbers, so a minimum changed in one place fails the suite.
- **The minimum wins over the work-area clamp**, in that order: a target too big for the
  screen is cut to the screen, and a target under the minimum is then raised to it,
  because Windows would raise it anyway and an answer that lies about that is worse than
  no answer.
- **The large board is asked of the WORK AREA, not the window.** That is the fix rather
  than an optimisation: asking the window is what made the toggle inert, because a window
  with no room in it answers 416 however many times it is asked.
- **`matchWindowToBoard` fails quietly**, and the setting is written before it is called,
  so a window that will not resize still changes the board. The catch has a comment in
  it saying so.

**Tests.**

- **S15 item 24** is `ui/window-size.test.ts`, thirteen tests with no browser and no
  Tauri in them: the 1023 by 807 small target, the large target worked out from the work
  area, the full 832 on a screen with the room, the step down to 592 at a scale of 1.5,
  both clamps, the minimum read out of `tauri.conf.json` itself, and four cases of moving
  or not moving, including a second monitor at a negative x so that "the corner" is not
  quietly the origin.
- **S15 item 25** is held in both projects. In `remembered.dom.test.tsx`, "changes the
  board and resizes nothing on the web" widens jsdom's viewport to 1600 by 1280, presses
  the toggle both ways and reads the board off the move list's `--board-pixels`: 416,
  832, 416. In `window-size.test.ts`, "does nothing, and imports no Tauri, where there is
  no window" calls the function twice in node and asserts a mock's factory never ran. The
  mock is the point: it is the only way to say "no test started a Tauri call" as an
  assertion rather than as a hope, because without the guard the import resolves and the
  call fails quietly, which would have passed.
- **Mutation-checked, four, each reversed with the reverse edit.**

  | Mutation | Red |
  |---|---|
  | the frame ADDED to the work area instead of subtracted | 6 of `window-size.test.ts`'s 13 |
  | `pushInside` returning the position unchanged | 3, the three that move a window |
  | the `isDesktop()` guard dropped from `matchWindowToBoard` | 1, the no-Tauri test |
  | the toggle no longer writing the setting | 2 DOM tests, in two files |

**Asked of Nick.** Nothing. Q28 settled the behaviour, including the both-ways question,
and the chip settled the shape.

**Reuse review.** The new code introduced no second copy of anything: `clamp` and
`pushInside` are private to the one file, the chrome numbers are still asked for rather
than written, and the only arithmetic about board sizes is still `fitBoardSize`, which
this phase calls rather than repeats. `App.tsx` gained `chooseBoardSize` beside
`chooseLevel`, which is the same shape for the same reason - the two halves of a setting
change belong where the running app is known, not in the control. No em dashes under
`src/`, no forbidden word in a changed file.

**Left.**

- **The web build precaches one more entry**, 22 rather than 21, because the Tauri window
  API is a 14.46 kB chunk in `dist/assets/` that the iPad will never load. It is the
  price of the lazy import and it was already being paid for the dialog and filesystem
  plugins. Worth a line in a future phase if the precache is ever trimmed; not worth a
  build-config exception now.
- **Spec 11.4's own list still reads five permissions.** S22 in section 20 says it
  becomes eight and section 20 wins, so the app is right and the older section is stale.
  The spec is the orchestrator's document, so it is recorded here rather than edited.
- **The installer was not run** and `%LOCALAPPDATA%\Simply Chess Data` was not deleted.
  Box 12.6 is now a 1.3.0 walk and `docs/acceptance.md` says so, with the toggle added to
  what Nick is asked to try.
- The packaged window was put back as it was found before it was closed: the board size
  setting back to small, the window back to 1400 by 980, and the four settings keys
  otherwise untouched. No game was seeded in this phase. The pane's storage was cleared
  and the dev server stopped.
- Two files, `src/dev/use-dev-scene.ts` and `src/ui/keep-in-view.ts`, still show as
  modified in `git status` with an empty diff. It is the stale stat cache phases 13 and
  14 both recorded; neither was touched or staged.
- `../London` and `../Conquest` were not touched.

### Gate 15 findings (orchestrator, 2026-09-14)

**Passed.** One observation for Nick at the end, which is a consequence of the rule he
chose rather than a fault in it.

**Verified from the repo.** `npx vitest run`: 38 files, **339 passed, none skipped, 9.4
seconds**. `tsc -b` clean, `npx oxlint` exit 0 with no output, `npm run build` clean.
`../London` and `../Conquest` hold no change of ours.

**Mutation-checked, four, each reversed.**

| Mutation | Red |
|---|---|
| `pushInside` returns the position it was given, so nothing is ever moved | 3 tests |
| `clamp` drops the minimum and keeps only the work-area cap | the minimum test |
| `MIN_INNER_WIDTH` set to 900, drifting from `tauri.conf.json` | the cross-file test |
| `innerSizeForBoard` leaves `CHROME_ABOVE` out of the height | 6 tests |

The third is the one worth naming: `window-size.test.ts` reads `tauri.conf.json` and
holds its `minWidth` and `minHeight` against the two constants, the way
`local-folder.test.ts` holds the data folder's name across three files. A minimum changed
in one place now fails the suite.

**Driven by me in the packaged 1.3.0 window**, with the window moved and maximised from
OUTSIDE the app through `user32`, which is what a person dragging a corner actually does,
rather than by asking the app to move itself. The work area is 2560 by 1392 logical at a
display scale of 1.5.

| Step | Window inner | Board |
|---|---|---|
| shrunk from outside into the dead band | 1001 by 781 | 416 |
| **Large** | **1440 by 1224** | **832** |
| Small | 1024 by 808 | 416 |
| maximised from outside | 2560 by 1370 | 416 |
| Large, from maximised | 1440 by 1224 | 832 |
| Small, from there | 1024 by 808 | 416 |

**The corner case, measured on the real window.** Placed with its bottom right on the
work area's own corner, at 1522, 547 with an outer size of 1038 by 845, pressing Large
moved it to **1107, 131**, whose outer edges are 2561 and 1392 against a work area of
2560 by 1392. Inside, to within the two-thirds of a logical pixel that a scale of 1.5
rounds by, and moved by the least that puts it there rather than centred. That is S21's
rule holding on the machine rather than in a test.

**The toggle is no longer inert**, which was the whole point: at 1001 by 781, where the
old build drew 416 for both sizes and the button did nothing a person could see, Large
now draws the full **832** board. It is the first time this app has drawn it.

**Taken on the builder's account**, and it answered the chip's one named question with a
measurement rather than an assumption: **`setSize` sets the INNER size.** Asked for 1439
by 1223 it read back an inner of 1439.33 by 1223.33 and an outer of 1454 by 1260.67, the
difference being the frame measured before the call. My own drive agrees: a 1440 by 1224
inner reading with an outer of 1454 by 1261.

**The installer, built at this gate.**

| | |
|---|---|
| Installer | `src-tauri/target/release/bundle/nsis/Simply Chess_1.3.0_x64-setup.exe`, **6,902,111 bytes** |
| Executable | `src-tauri/target/release/simply-chess.exe`, 9,156,096 bytes |

The builder's own build of the same commit recorded 6,902,858. As at gate 14, an NSIS
bundle carries build timestamps, so two builds of one commit differ by a few hundred
bytes; the file on disk is this gate's.

**The observation for Nick.** Pressing **Large on a MAXIMISED window makes the window
smaller**: it un-maximises and sets 1440 by 1224, and the board is 832 either way,
because a maximised window on this screen already had room for it. That is S21 doing
exactly what it says - the window is always the size the chosen board needs - and it is
the one case where "match both ways" costs something rather than buying something. If he
wants it left alone, the rule would become "match, unless the window already has room for
that board", which is one condition in `windowForBoard` and one test. Not changed here:
he ruled the rule, and this is what it does.

**Nick's three boxes are all that is left**, now against the 1.3.1 installer: 7.8, 8.6
and 12.6.

### Phase 16 - builder notes (2026-09-14)

Everything the chip named was read fresh before anything was touched: `CLAUDE.md`, spec
section 21 in full, then section 20, S2 and 19.1, the plan's rules, phase 16's boxes and
the gate 15 findings, then `board-size.ts`, `window-size.ts`, `window-size.test.ts`,
`app.css`'s scrolling rule and `play.css`'s `.play-body` and `.play-side`.

**The diagnosis was verified rather than re-derived**, and verifying it was worth the ten
minutes: it reproduced at a display scale of **1** as well as the 1.5 the spec measured
it at, which is what made the worst case answerable. In the pane at 1024 by 808, with a
real six-move game scanned by the engine into a report:

| | With the report | Without it |
|---|---|---|
| `.play-body` width | **961** | 976 |
| The three columns need | 975 | 975 |
| Side panel | x 24, **y 803**, under the board | x 699, y 167, beside it |
| `main` scrollHeight / clientHeight | 1130 / 642, so it scrolls | 657 / 657 |
| `main.offsetWidth - main.clientWidth` | **15** | 0 |
| `innerWidth - documentElement.clientWidth` | **0** | 0 |

The last two rows together are the whole fault, and they are why it hid: the scrollbar
belongs to `main`, not to the document, so the page reports no scrollbar while behaving
as though one is there. 976 minus 961 is exactly the 15 the scrollbar measures. It also
shows the fault needs a REPORT: with the panel empty the page does not scroll, so there
is no scrollbar, so the layout fits by its one pixel and nothing wraps.

**The scrollbar itself, measured twice** with a throwaway `overflow-y: scroll` box:
**15 CSS pixels in the pane at a scale of 1, and 15 again in the packaged window at
1.5.** So 15 is the number to clear, the spec's "about 17" was pessimistic, and the
gate's "14 px short" was the shortfall rather than the scrollbar. **24** was chosen: it
clears 15 at every scale measured, it is above the 21 that spec 21.1 proved sufficient,
and it is a round number rather than one tuned to this machine.

**Measured.**

- `npx vitest run`: 38 files, **341 tests passed, none skipped, 9.7 seconds** warm (270
  string in 26 files, 71 DOM in 12). Two are new. `tsc -b` clean, `npx oxlint` silent,
  `npm run build` clean, no em dashes under `src/` or `src-tauri/src/`.
- **The packaged 1.3.1 window, with a real reviewed game on screen**, driven over
  `--remote-debugging-port=9333`. The game is 1.e4 e5 2.Qh5 Nc6 3.Qxe5+ Nxe5 4.Nf3 d5
  5.d4 Nxf3+ 6.gxf3 Qh4, seeded into the window's own storage and scanned by the real
  Stockfish into a blunder on move 3 and an inaccuracy on move 2. Both automatic sizes,
  both themes, and the three numbers 16.3 asks for in every one of them:

  | State | Window inner | Width for the columns | Side panel | `main` scrollHeight / clientHeight | scrollWidth / innerWidth |
  |---|---|---|---|---|---|
  | as opened | 1400 by 980 | 1352 | x 699, y 164 | 832 / 832 | 1400 / 1400 |
  | **Large, dark** | **1464 by 1224** | 1416 | x 1115, **y 164** | 1076 / 1076 | 1464 / 1464 |
  | **Large, light** | 1464 by 1224 | 1416 | x 1115, y 164 | 1076 / 1076 | 1464 / 1464 |
  | **Small, light** | **1048 by 808** | 1000 | x 699, **y 164** | 660 / 660 | 1048 / 1048 |
  | **Small, dark** | 1048 by 808 | 1000 | x 699, y 164 | 660 / 660 | 1048 / 1048 |

  The board's own `y` is 164 in all five, so "the side panel's y equals the board's y" is
  the panel being beside the board rather than under it. `main` scrolls in none of them,
  which is the same statement as "no scrollbar is taken". The window readings are 1464
  and 1048 where the pure function answers 1463 and 1047: one pixel of rounding at a
  display scale of 1.5, in the app's favour.
- **S16 still holds in the wider windows**: the bar, `.board` and `cg-board` end on 580
  together at the small size with `scrollWidth` 1048 of 1048, and on **996** at the large
  with 1464 of 1464, with the four rows the width of the board in both. The board is
  unchanged at 416 and 832: the allowance widens the WINDOW, and the board is worked out
  from the work area rather than from the window.
- **One screenshot, looked at and sent to Nick**: the 832 board with the report beside the
  move list, the blunder and the inaccuracy each in their coloured border, THE FINAL
  POSITION under them with "Winning for Black" and "Stopped after move 6", and Copy game
  at the bottom of the panel. That is the thing Nick asked for, in the shipped build.
- **The installer, 16.4.** `npx tauri build` with `%USERPROFILE%\.cargo\bin` on the path,
  **2 m 8 s**, the Rust half 1 m 50 s.

  | | |
  |---|---|
  | Installer | `src-tauri/target/release/bundle/nsis/Simply Chess_1.3.1_x64-setup.exe`, **6,902,247 bytes** |
  | Executable | `src-tauri/target/release/simply-chess.exe`, **9,156,096 bytes** |
  | Version | 1.3.1 in `package.json`, `tauri.conf.json` and `Cargo.toml`, held by four tests |

**Decided (code shape), and why.**

- **One named constant, `SCROLLBAR_ALLOWANCE`, beside the chrome constants but not one of
  them.** It is in `board-size.ts` because that is where the pixel numbers live and
  `innerSizeForBoard` is the only thing that may use it; it is separate from
  `CHROME_BESIDE_WIDE` because that constant describes what the layout truly needs and
  the fit rule of S2 uses it to answer honestly about a window the user sized. Buried
  there, the allowance would take 24 px off the board on every iPad for a scrollbar that
  is only sometimes there.
- **The comment carries 21.1's two rows of numbers and both scrollbar measurements**, so
  the next reader does not have to ask why the window is wider than the thing inside it.
- **The width only.** The height is still `board + CHROME_ABOVE + CHROME_BELOW` exactly,
  and the drive shows why that is right: `main` does not scroll at either automatic size
  now that the panel is beside the board, so there was never a height to find.

**Tests.**

- **S15 item 26** is two tests in `window-size.test.ts`. The first reconstructs the width
  beside the board from two answers of the same function - `small.width - 416` and
  `large.width - 600` - asserts they agree, and asserts what is left over 607 is at least
  a scrollbar. It is written that way on purpose: `CHROME_BESIDE_WIDE` is private to
  `board-size.ts` and a test that imported it would make it public to keep one assertion
  honest. The second holds the other half of S23, that the height is exactly the layout's.
- **Five existing expectations moved by 24**, each with the reason in its comment rather
  than a new number: the small target (1023 to 1047), the large target on the example
  screen (1207 to 1231), the full-832 target (1439 to 1463), the work-area clamp's width,
  and the x a window at the right edge is pushed back to (697 to 673, because the window
  it is pushing is 24 px wider).
- **Mutation-checked, two, each reversed with the reverse edit.**

  | Mutation | Red |
  |---|---|
  | `SCROLLBAR_ALLOWANCE` back to 0, which is phase 15's behaviour | 6 tests |
  | the allowance added to the HEIGHT as well as the width | 6 tests, including "leaves the height exactly as the layout needs it" |

  The second is the one that earns its keep: it is the mistake a later reader is most
  likely to make in good faith, and the suite now says no to it by name.

**Asked of Nick.** Nothing. Q29 settled the behaviour and the chip settled the shape,
including the one judgement it left open, which was the size of the allowance.

**Reuse review.** Nothing was duplicated: one new constant with one caller, no new file,
and no number written twice. `CHROME_BESIDE_WIDE` still has exactly the two readers it
had, `fitBoardSize` and `innerSizeForBoard`. The board, the layout, the fit rule, the
resize logic and the report were not touched, which is what "one-line fix" was supposed
to mean and does.

**Left.**

- **What this does not fix, and section 21 accepts**: a window the USER drags to within a
  scrollbar's width of the boundary still wraps the panel under the board. The toggle is
  what promises a window that fits, and that promise is now kept.
- **Spec 20.2 still quotes 1023 by 807** as the small target. S23 in section 21 changes it
  to 1047 and section 21 wins, so the app is right and the older section reads stale; the
  spec is the orchestrator's document, so it is recorded here rather than edited. The same
  is true of 11.4's five permissions, which phase 15 left.
- **The installer was not run** and `%LOCALAPPDATA%\Simply Chess Data` was not deleted.
  Box 12.6 is now a 1.3.1 walk.
- The packaged window was put back as it was found: the seeded game removed, the board
  size back to small, the theme, level and side untouched, and the window returned to
  1400 by 980. The pane's storage was cleared, its viewport emulation reset and the dev
  server stopped.
- Two files, `src/dev/use-dev-scene.ts` and `src/ui/keep-in-view.ts`, still show as
  modified in `git status` with an empty diff, and were verified byte-identical to `HEAD`.
  It is the stale stat cache phases 13, 14 and 15 all recorded; neither was touched or
  staged.
- `../London` and `../Conquest` were not touched.

### Gate 16 findings (orchestrator, 2026-09-14)

**Passed, with nothing outstanding.** The report is beside the move list after both
automatic resizes, checked by me in the shipped build with a real reviewed game on
screen, which is the thing Nick asked for.

**Verified from the repo.** `npx vitest run`: 38 files, **341 passed, none skipped, 9.9
seconds**. `tsc -b` clean, `npx oxlint` exit 0 with no output, `npm run build` clean.
`../London` and `../Conquest` hold no change of ours.

**Mutation-checked, three, each reversed.**

| Mutation | Red |
|---|---|
| the allowance set to 0, which is phase 15's behaviour | 6 tests |
| the allowance set to 8, a number smaller than a scrollbar | 6 tests |
| the allowance added to the height as well as the width | 6 tests |

The second is the one that matters: it fails because S15 item 26 holds the PROPERTY, that
what is left over the layout's 607 must cover a scrollbar, rather than the number 24. A
future allowance that looks plausible and is too small cannot pass.

**Driven by me in the packaged 1.3.1 window**, with the game seeded into the window's own
storage and scanned by the real engine into a blunder and an inaccuracy, so the panel has
a real report in it rather than an empty column.

| State | Window inner | Width for the columns | Side panel | Board | `main` scrolls | scrollWidth |
|---|---|---|---|---|---|---|
| **Large** | 1464 by 1224 | 1416 | x 1115, **y 164** | 832 | no, scrollbar 0 | 1464 = innerWidth |
| **Small** | 1048 by 808 | 1000 | x 699, **y 164** | 416 | no, scrollbar 0 | 1048 = innerWidth |

The board's own y is 164 in both, so the panel's y matching it is the panel sitting beside
the move list rather than under the board. The move list is at x 924 and x 508, between
the two, which is 19.1's order. Both themes checked at both sizes: the same four answers
in all four. A screenshot of the large one was taken, looked at and sent to Nick.

**What it was**, for the record, because the fault hid well: `main` is the scrolling
element above 900 by 700, so its vertical scrollbar took 15 px out of the columns'
width **without changing `document.documentElement.clientWidth`**. Every check the app
could have made for a scrollbar would have read zero. The layout fitted its window by one
pixel, and the scrollbar took fifteen.

**Two numbers corrected, both by the builder measuring rather than trusting a document.**

- **A scrollbar is 15 CSS pixels at a display scale of 1 AND at 1.5**, measured twice with
  a throwaway scrolling box. Spec 21.2 and my chip both said a scrollbar is a physical
  thing and therefore worst at scale 1, which would have made it about 17 there. It is
  not: it stays 15. The spec now says the measured thing. The allowance of 24 clears it
  either way, so nothing built on the wrong reasoning was wrong.
- **"14 px short" in the gate 15 measurements was the SHORTFALL, not the scrollbar.** The
  scrollbar is 15 and the layout had one pixel of slack; 15 minus 1 is the 14. The
  builder said so rather than letting the two numbers sit there disagreeing.

**The installer, built at this gate.**

| | |
|---|---|
| Installer | `src-tauri/target/release/bundle/nsis/Simply Chess_1.3.1_x64-setup.exe`, **6,902,478 bytes** |
| Executable | `src-tauri/target/release/simply-chess.exe`, 9,156,096 bytes |

The builder's own build of the same commit recorded 6,902,247, which is the NSIS
timestamp difference this plan has recorded at each of the last three gates. The file on
disk is this gate's.

**Nick's three boxes are all that is left**, now against the 1.3.1 installer: 7.8, 8.6
and 12.6.

### Phase 17 notes (orchestrator, 2026-09-14)

Built in this session rather than chipped, at Nick's request: "fix it here, in this
session". It is one constant, its comment, six test numbers and a property, and the whole
of it is `5613e55`.

**Reproduced first, in the shipped 1.3.1 window, with Nick's own file.** He named it, so
it was read: a 23-move game with **ten slips**, which is what makes the report long enough
for `main` to scroll. My own six-move game at gate 16 had two slips and never triggered
it. With his game loaded and reviewed at the small automatic size: `main.scrollWidth` 986
against `clientWidth` 985, the vertical scrollbar taking its 15, and the side panel
**309.67 px wide reporting a `scrollWidth` of 311**. The large size was identical - the
same 309.67 - because the board and the move list grow together and the panel is what is
left over.

**The panel's own minimum is not the problem.** Measured with a `width: min-content`
clone: the report shrinks to 300 happily. It is the ROUNDING at a display scale of 1.5,
and the report's horizontal bar is where it shows: a computed width of 309.667 px that
paints 311.

**Then measured rather than guessed at.** The window was widened a step at a time from
outside, with that report on screen:

| Side panel | Its `scrollWidth` | The page |
|---|---|---|
| 311 | 312 | scrolls sideways |
| 319 | 320 | scrolls sideways |
| **327** | 327 | does not |
| 335, 343, 359, 383, 415, 448.5 | exact | does not |

So 327 is where it stops, and the allowance has to clear it. **64** puts the panel at
349.67 at both sizes, 22 px clear, and makes the automatic windows 1087 by 807 and 1503
by 1223. The constant is renamed `WINDOW_ALLOWANCE`, because "scrollbar" is no longer the
whole of what it is for.

**Proved in the shipped 1.3.2 window**, same file, same review, both automatic sizes and
the 1400 window it opens in: the panel is 349.67 (448.5 at 1400, where it reaches its
max-width), `horizontal` false and the overflow 0 in all three, and the panel is beside
the board at y 164 in all three.

**The bar:** 341 tests green, `tsc -b` clean, `npx oxlint` silent, `npm run build` clean.
The allowance put back to 24 turns six tests red, and S15 item 26 now holds the property
- the allowance covers the scrollbar AND the panel's room over its minimum - rather than
the number, so a plausible-looking value that is too small cannot pass.

**A mistake worth writing down, because this project's own CLAUDE.md warns about it.**
The mutation check above was first reversed with `git checkout -- src/ui/board-size.ts`,
and board-size.ts was tracked with my own UNCOMMITTED fix in it, so the checkout threw
the fix away along with the mutation. The tests went green against 1.3.1's code and would
have looked like a pass. It was caught by re-reading the constant rather than trusting
the word "restored", re-applied, and the mutation redone with the reverse edit, which is
what the hazard note says to do and what I had just not done.

### Phase 18 notes (orchestrator, 2026-09-14)

One question and three small changes, in this session as phase 17 was.

- **`tauri.conf.json` declares 1087 by 807**, the small board's own window, where it
  declared 1400 by 980. Small is the default board size, so a fresh install now opens at
  exactly the size the app would choose and nothing resizes at all. The two files cannot
  import from each other, so `window-size.test.ts` reads the declared width and height out
  of the configuration and holds them against `windowForBoard('small', ...)`. A drift in
  either file fails the suite, which is the same guard the window's minimum already had.
- **`windowForBoard` takes `atLaunch`.** It centres, where the toggle leaves the window
  where it is. The reason is in the parameter's own comment: at a launch nobody has placed
  the window, the configuration centres it at the size it declares, and a window that then
  resized from its top-left corner would sit off centre by half the difference. Every
  clamp it already had still applies, including the one that puts a window too big for the
  screen at the work area's corner rather than off the top left of it.
- **The startup effect asks once**, beside the game it reopens.

**Proved in the shipped 1.4.0 build, twice, by restarting it with each size remembered.**

| Remembered | Window inner | Board | Where |
|---|---|---|---|
| small | **1088 by 808** | 416 | centred, `screenX` 737 on a 2560 wide work area |
| large | **1504 by 1224** | 832 | centred, `screenX` 529 |

Neither scrolls in either direction. The one pixel over the 1087 and 1503 the arithmetic
asks for is the display scale of 1.5 rounding, in the app's favour, and is the same pixel
every window reading in this plan carries.

**The bar:** 346 tests green (five new), `tsc -b` clean, `npx oxlint` silent, `npm run
build` clean. One expectation was wrong when first written and the code was right: a
centred x of (1920 - 1103) / 2 is 408.5, which rounds to 409, not the 408 the comment
claimed. The comment now says so.

### Phase 19 notes (orchestrator, 2026-09-14)

**Measured in the shipped 1.4.1 window**, with Nick's own 23-move file seeded and
reviewed into nine slips, at the small automatic size of 1088 by 808:

| | Before, in 1.4.0 | After |
|---|---|---|
| `main` | scrollHeight 1130 against clientHeight 642, so the WINDOW scrolled | 660 against 660, so it does not |
| The side panel | as tall as the report, no ceiling | 416 tall with a scrollHeight of 1029, so it scrolls itself |
| The three columns | the panel ran on past the board | board 416, list 416, panel 416, all at y 164 |

**And scrolling the panel moves nothing else**, which is the whole of what Nick asked
for: with `scrollTop` driven to 600, the board stayed at y 164, the move list at 164, the
first button row at 592, `window.scrollY` 0 and `main.scrollTop` 0, and the bottom of the
report came into view - "Stopped after move 23" and Copy game.

**Decided, and why.**

- **The ceiling is the board's own height**, so the panel ends level with the board and
  the move list. It is the same rule the list has had since phase 9, and the third column
  now reads the same way as the second.
- **`--board-pixels` moved from the move list to `.play-body`.** Two columns need the
  number now, so it is set once on the row they share rather than twice. `MoveList` lost
  its `pixels` prop with it, and the DOM helper that read the property off the list reads
  it off the row.
- **`overflow-x: hidden` on the panel, which 21.3 refused at page level.** The panel is a
  scroll container now, so a child rounding a pixel past it at a fractional display scale
  would draw a scrollbar along its bottom. Scoped to one column it hides a rounding
  artefact; at page level it would have hidden the layout telling the truth about a window
  too small for it. The distinction is in the spec rather than only in the stylesheet.
- **The narrow layout keeps no ceiling**: there is no board beside the panel there, and
  the page scrolls in that layout as it always has.

**The bar:** 346 tests green, `tsc -b` clean, `npx oxlint` silent, `npm run build` clean.
The scrolling itself is a pane and window measurement, as the move list's is: jsdom lays
nothing out, so the test that can be written is that the number lives on the row, and the
rest is the table above.
