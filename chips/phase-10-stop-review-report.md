# Chip: phase 10 - stop, review, the report

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`. Your
context may have been compacted since phase 9; Nick decides that each time. **Do not
rely on what you remember of phases 0 to 9.** Read fresh, in this order, before
touching a file: `CLAUDE.md`; `docs/simple-chess-spec.md` section 18 (all of it, it
wins over sections 1 to 17), then 5.5, 6.3, 7, 8, 9.1 and 14; the plan
`docs/simple-chess-build-plan.md` "Rules for the builder", "Standing discipline",
phase 10, and the phase 9 notes with the gate 9 findings at the end; then
`docs/testing.md`; then, in `../London/src`: `play/report.ts` in full,
`play/session.ts`'s `scanGame`, `play/game-pgn.ts`, `ui/Play.tsx` (`PlayActions`,
`Report`, `EvalBar`, `CopyGame`, `toClipboard`), `ui/play-context.tsx` (`finish`,
`evaluate`'s `bestMovesRef`) and `ui/play.css` (`.report`, `.slips`, `.eval-bar`,
`.copy-game`, `.play-actions`, `.play-extend`, `.hint-count`, `.notice`).
Everything below is compressed from those; where this chip and the spec disagree,
the spec wins and you say so in the phase notes.

**Goal: a game can be stopped and reviewed or stopped and discarded; the report says
what the engine thought of your moves and of the final position; the hint count is
carried; Save game and Copy game write the report's comments.** The review VIEWER is
phase 11: after this phase the report is on the screen and the move list is still a
record. Version stays 1.0.0 until phase 12.

## Where things stand

Version 1 is complete and gated, and phase 9 renamed the app Simply Chess and gave it
the trainer's layout (gate 9 passed, commits `5c5dcf4` and `ce31e55`; an interim
installer was built at `c9f1dde`). The screen today: header with the size and theme
toggles, the centred Difficulty row, the head row (`PlayHead`, `opening-line.ts`), the
board column (bar, board, `PlayControls` row one, `Notice`), the move list column
(`MoveList`, 167 px, board height), and the side panel (`SidePanel.tsx`, class
`.play-side`) holding Play as, Save game, Load game and the hint sentence.

What this phase builds on, exactly:

- `src/ui/play-context.tsx` has `evaluate` (the analysis profile through
  `atAnalysisProfile`, writing `evaluationOf(best.score, sideToMove(fen))` into
  `evaluationsRef` and the state map), `quietRef` (undo's background evaluation, which
  `play` and `askHint` await), `start`, `play`, `undo`, `redo`, `askHint`, `setLevel`,
  `rememberNow`. It has **no** `report`, `finish`, `discard`, `scanning` or
  `bestMovesRef`: phase 4 dropped the best moves because there was no report to use
  them. They come back here.
- `src/play/evalbar.ts` defines `Evaluation { pawns, text }` and `evaluationOf`. **The
  evaluation map is `Map<string, Evaluation>`, not the trainer's
  `Map<string, number>`.** Everything copied from the trainer that reads a number out
  of that map reads `.pawns`.
- `src/play/session.ts` has `PlayedMove`, `fullMove`, `outcome`, and **no** `hints`
  counter: this app has not counted hints (spec section 8 said so, and section 18
  reverses it).
- `src/play/analysis.ts` has `ANALYSIS_MOVETIME` (150), `analysisProfile()`,
  `isAnalysisProfile()` and `atAnalysisProfile(engine, playing, ask)`.
- `src/test/by-profile.ts` has `engineByProfile({ analysis, playing })`, which is how
  every fake tells an analysis search from a move. `scripted-engine.ts` and
  `held-engine.ts` are built on it.

The trainer is `C:\Users\nick2\Code\London`; you read and copy from it and never
change it.

## Settled decisions you build on

- **The report is the chess half only** (Q19, spec 18.5). Nothing about openings,
  repertoires, books or deviations. `buildReport` loses its `book`, `side`, `context`
  and `deviation` entirely; `GameReport` has `slips`, `verdict`, `finalEval`,
  `outcome` and `hints`.
- **Words in the report, a number on the bar** (S18). `verdictInWords` and
  `describeSlip` come across unchanged; the bar keeps `evalText`.
- **The slip thresholds are the trainer's**: a blunder loses two pawns or more, a
  mistake one, an inaccuracy half, measured from the user's side. Most recent first,
  not worst first, for the trainer's reason.
- **The scan is handed what the bar already knows** so the report cannot disagree with
  the numbers the user watched, and it keeps the engine's move at each position, which
  is what "the engine preferred" means.
- **Stop and discard leaves nothing**: no scan, no report, the remembered game
  forgotten, and a fresh game started (spec 18.3). No confirmation.
- **Copy per spec S3**; `user` words, never `trainee` or `student`; no pixel numbers or
  colours in `.ts`/`.tsx` outside `board-size.ts`; screenshots looked at and measured,
  no files, no headless browser; clear the pane's storage at the end.

## The work

### 10.1 The report module

- [ ] `src/play/report.ts`, new, adapted from `London/src/play/report.ts` with an
  origin line saying the chess half only. Bring across, text unchanged except where
  the map's type forces a change:
  - `export type MoveTag = 'blunder' | 'mistake' | 'inaccuracy'`, `MoveReview` and
    `SLIP_THRESHOLDS` with their comments; `tagFor` private.
  - `export type Evaluations = Map<string, Evaluation>` (this app's entry, not the
    trainer's number) and `export type BestMoves = Map<string, string>`.
  - `scanForSlips(moves, evaluations, userColour, bestMoves)`: the trainer's, with
    `before` and `after` read as `evaluations.get(key)?.pawns`. Rename its
    `studentColour` parameter to `userColour` (this is an adapted file, spec 3).
  - `verdictInWords`, `verdictBand`, `describeSlip`, `numberedMove`, `betterMove`.
    Do NOT bring `verdictForYou` unless something uses it; gate 2 ruled that unused
    code goes.
  - `buildReport(moves, evaluations, userColour, outcome?, hints = 0, bestMoves?)`:
    the trainer's body with the deviation gone. Keep its comment on why a mated final
    position takes the outcome as its verdict rather than reading "Not scanned", and
    its comment on leaving `hints` off entirely when there were none.
  - `GameReport` without `deviation`.
  - `PlayedMove` and `fullMove` stay in `session.ts` where phase 2 put them; import
    them.
- [ ] `src/play/report.test.ts`: the trainer's tests for `scanForSlips`,
  `verdictInWords`, `verdictBand`, `describeSlip` and `buildReport` where they apply,
  adapted to the entry type. Add one the trainer does not have: a game with no
  evaluations produces no slips and the verdict "Not scanned".

### 10.2 The scan

- [ ] `src/play/scan.ts`, new: the trainer's `scanGame` from its `session.ts`,
  adapted. It searches every position of the game at `ANALYSIS_MOVETIME`, skipping
  what `known` already holds, and returns `{ evaluations, bestMoves }`. Two changes
  from the trainer's text: the map it builds holds `evaluationOf(best.score,
  position.side)` rather than `whitePovPawns(...)`, and the engine is put at the
  analysis profile by the CALLER (the provider, through `atAnalysisProfile`) rather
  than here, as the trainer does it. Keep its comment on why fixed effort matters and
  why `known` is handed over.
- [ ] `src/play/scan.test.ts`: a scan of a short game with a fake engine returns an
  entry for every position; a position already in `known` is not searched again
  (count the searches); the progress callback is called once per position with the
  running total.

### 10.3 The session counts hints

- [ ] `src/play/session.ts`: a public `hints = 0` field with the trainer's comment
  (a game played with the answers on is a different game, and the report says so).
  Nothing else in the session changes.
- [ ] `play-context.tsx`'s `askHint` increments it when a hint is actually given, in
  both the early return and the answered path if there are two; today there is one.
- [ ] A session test: the count rises with each hint and is zero on a fresh game.

### 10.4 The provider

- [ ] `evaluate` keeps the engine's move again: a `bestMovesRef` beside
  `evaluationsRef`, filled from `result.bestMove ?? best.move`, cleared in `start`
  with the evaluations. The trainer's comment on why it sits beside rather than
  inside the evaluation map comes with it.
- [ ] `scanning: { done: number; total: number } | null` and `report: GameReport |
  null` in the value; `report` is cleared by `start` (so New game, Load game and Play
  from here all clear it).
- [ ] `finish()`: the trainer's, cut to this app. Await `quietRef.current` first (the
  phase 5 rule: an undo's evaluation may be in flight and the scan sets the profile).
  Set `thinking` and `scanning`; get the engine; run `scanGame` inside
  `atAnalysisProfile` so the playing level is restored in a `finally`; write the
  returned maps back into both refs and the state; clear the hint with the trainer's
  comment; build the report with `running.outcome ?? \`Stopped after move
  ${fullMove(running.moves.length - 1)}\`` (and "Stopped before the first move" for a
  game with no moves, matching `game-pgn.ts`'s `stoppedAt`; give that sentence ONE
  home and use it in both places); set the report; `finally` clear `scanning` and
  `thinking`. No record, no `recordedAt`, no history: this app keeps none (S9).
- [ ] `discard()`: forget the remembered game and start a fresh one at the current
  side and level, so the screen is never left with no game (spec 18.3). It is not
  `reset`: gate 2 deleted that. Say in the notes how it differs from New game, if at
  all; if it does not, make New game call it and keep one path.
- [ ] While `report !== null` the game is over as far as the board is concerned:
  `canHint` false, undo and redo disabled, the board locked. `inProgress` becomes
  `session !== null && report === null && !session.isFinished()`.
- [ ] Undo, Redo, Hint, Save game and Load game are all disabled while `scanning`.

### 10.5 The screen

- [ ] `src/ui/PlayActions.tsx`, new, adapted from the trainer's `PlayActions` in
  `Play.tsx` without the two extend buttons: for a game that has ended by itself, the
  trainer's notice ("`${outcome}.` Review it to see what it cost."); then the two
  buttons in a `.play-extend` row, **Stop and review** (primary; "Review the game"
  when the game has ended; "Scanning 12 of 40..." while scanning) and **Stop and
  discard**. Both disabled while thinking or scanning.
- [ ] `src/ui/Report.tsx`, new, adapted from the trainer's `Report` with "The
  repertoire" gone: `h3` "The report"; `h4` "Your moves" with the hint count line and
  either the clean sentence or the `.slips` list, each item a `<li className={slip.tag}>`
  carrying `describeSlip(slip)`; `h4` "The final position" with the verdict, the
  horizontal `EvalBar` when `finalEval` is known, and the outcome in a `.hint` line;
  then `CopyGame`.
  **The slips are not buttons this phase.** The trainer's are, because clicking one
  jumps the board, and that is phase 11's viewer. Render them as plain list items with
  a comment naming phase 11, so nothing on screen suggests a control that does
  nothing.
- [ ] `src/ui/EvalBar.tsx` gains the trainer's horizontal report bar as a second
  export (`ReportBar`, the trainer's `EvalBar`), sharing `evalShare`. Its accessible
  name is the verdict in words, not the number: this one is read with the report.
- [ ] `src/ui/CopyGame.tsx`, new: the trainer's `CopyGame` and `toClipboard`,
  identical text, with the origin line. It says "Copied" for 2500 ms or why it failed.
- [ ] `Screen.tsx`: the side panel shows `PlayActions` while a game is running and
  `Report` once there is one, under the Play as fieldset, the file buttons and the
  hint sentence, per spec 18.1's diagram.
- [ ] CSS into `play.css` from the trainer's: `.play-actions`, `.play-extend`,
  `.report h3`, `.report h4`, `.report p`, `.slips` and its `li` with the three tag
  colours, `.hint-count`, `.eval-bar`, `.eval-white`, `.copy-game`. Origin line naming
  the trainer's `play.css`. No colour outside the existing tokens.

### 10.6 The file and the clipboard

- [ ] `src/play/game-pgn.ts`: `GameForPgn` takes an optional `report: GameReport`.
  When it is there, write the trainer's comments: `{Played with 2 hints.}` before the
  first move when `report.hints`; after each move that has a slip, the trainer's
  `slipComment` wording; and the closing comment carries the verdict as well as the
  outcome, joined the trainer's way. Without a report the file is exactly what phase
  5 wrote (spec 9.1), and its test must still pass unchanged.
- [ ] `Shell`'s `save` passes the report when there is one; `CopyGame` is given the
  same text, built once. One function builds it, called by both.
- [ ] Tests: S15 item 17 (Copy game and Save game produce the same text for a reviewed
  game, with the comments) and item 19 (the hint count reaches the report and the
  file). The round trip still holds: `loadPgn` ignores comments (S8), so a reviewed
  game's file loads back to the same moves, side and level.

### 10.7 Tests

- [ ] **A fake engine that scores by position.** The existing fakes answer one `cp`
  for every search, so no scan can produce a slip. Add `src/test/scored-engine.ts`:
  `scoredEngine(scores: Record<string, number>, moves?: string[])`, built on
  `engineByProfile`, whose ANALYSIS answers look the position up by
  `positionKey(fen)` (falling back to 0) and whose PLAYING answers come from a script
  as `scriptedEngine`'s do. Its comment says why: a blunder is a change of
  evaluation across one move, so a test that wants one has to be able to say what the
  position was worth before and after.
- [ ] S15 item 12: a scripted game with a deliberate blunder, stopped and reviewed;
  the report names it with its move number, its tag and the engine's preferred move,
  and the verdict is the final position's words. Shown red first against a
  `SLIP_THRESHOLDS` that cannot fire.
- [ ] S15 item 13: Stop and discard leaves no report, no remembered game in storage,
  and a fresh game on the board.
- [ ] The scan's progress: "Scanning N of M..." appears on the button while a held
  engine is scanning, and the four controls are disabled with it.
- [ ] A game that ended in checkmate shows the notice and reviews without a scan
  failure (the mated position has no evaluation; the verdict is the outcome).

### 10.8 Prove it in the pane

- [ ] `npm run dev` on 5185 (the configuration is `simply-chess-dev`), storage cleared
  first, at 1280 by 980 (the pane caps its width). Play a short game as White against
  level 1 and give away a piece on purpose. Stop and review: the scan's progress on
  the button, then the report in the panel with the slip named and the verdict. Read
  the report's text and the `evaluations` map through the dev handle and say whether
  the slip's numbers match the bar's.
- [ ] Copy game: read the clipboard back with the JavaScript tool
  (`navigator.clipboard.readText()`) and paste the text into the notes. Save game's
  blob should carry the same text; check it as phase 5 did.
- [ ] Stop and discard on a second game: the board is fresh and storage holds no game.
- [ ] Both themes at 1280 by 980, and the probe: the report must not change the
  board's size or make the page scroll sideways (the side panel scrolls or wraps
  instead). Record the probe with the report showing.
- [ ] Clear the pane's storage.

### 10.9 Close

- [ ] `npx vitest run` both projects green under twenty seconds; counts and time.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean.
- [ ] Copies diffed and listed. No forbidden words in adapted or new files.
- [ ] Reuse review, then commit.

## Decision rules

- **The scan holds the engine while the user waits.** That is expected and is why the
  button says how far it has got. Do not put the scan behind `quietRef`'s
  fire-and-forget path: a report is something the user asked for and is waiting on.
- **A slip's `before` or `after` is missing** (a position the scan could not
  evaluate): the trainer skips that move rather than guessing. Keep that.
- **The report is long enough to push the panel past the board.** The panel is
  `max-width: 52ch` and the page may scroll DOWN (spec 4.3). Sideways is the fault.
- **Something a person would see is not specified** (a heading's words beyond spec
  18.5, the order of the two buttons): stop and ask Nick. Code shape: decide and say
  why.
- **A contradiction** between chip, plan, spec (18 wins over 1 to 17) and copied code:
  stop that item, write it down, continue with the rest.

## Out of scope for this phase

The review viewer: clickable moves, the marked row, the arrow keys, the better move's
arrow, Keep playing and Play from here (phase 11). The version bump and the Tauri
build (12). Game history, which this app does not have (Q20).

## Acceptance

Phase 10 of the plan, every box ticked as it lands: a game can be stopped and
reviewed, and the report names a deliberate blunder with the engine's preferred move
and gives the final position a verdict in words; Stop and discard leaves nothing; the
hint count reaches the report and the file; Copy game and Save game write the same
text and a reviewed file still loads; the report does not change the board's size or
scroll the page sideways; suite green under twenty seconds; `tsc -b` clean;
`../London` and `../Conquest` untouched.

## Conventions

- Tick the plan's phase 10 boxes as you go. Append "Phase 10 - builder notes" under
  the plan's "Phase notes" after the gate 9 findings: measured, decided, asked, the
  reuse review's find, left. Update the Progress table row.
- The reuse review's likely finds this phase: the "Stopped after move N" sentence
  written twice (the provider and `game-pgn.ts`); a second place that reads `.pawns`
  out of the map; the PGN text built twice for Save and for Copy; a second clipboard
  helper.
- One commit at least, on `main`. Short imperative subject, a body that says why. End
  the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, naming the
  model you actually are. Write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours.

## Cleanup

Stop the dev server. Clear the pane's storage. Report the commit hash, the test counts
and time, the report's text for the blunder game, the PGN Copy game produced, the
probe with the report showing, and anything the decision rules made you skip.
