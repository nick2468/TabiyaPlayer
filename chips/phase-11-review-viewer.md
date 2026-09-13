# Chip: phase 11 - the review viewer, Keep playing, Play from here

You are the builder session for Simply Chess, in `C:\Users\nick2\Code\SimpleChess`, on
`main`, no worktree, no remote (never push, never create one). Your context was
compacted after phase 10: rely on nothing you remember about this code. Read, in this
order, before the first edit:

1. `CLAUDE.md` in this folder, all of it (the single-home list and the hazards).
2. `docs/simple-chess-spec.md` section 18, which wins over sections 1 to 17. Section
   18.4 is this phase, word for word. Then 5.4 (undo and redo), 7 (the bar), 14 (the
   layout).
3. `docs/simple-chess-build-plan.md`: "Rules for the builder", "Standing discipline",
   phase 11's boxes, and the phase 10 notes with the gate 10 findings under them.
4. `docs/testing.md`.
5. The trainer's files this phase copies, in `C:\Users\nick2\Code\London` (read and
   copy only, never change): `src/play/replay.ts` and `src/play/replay.test.ts`;
   `src/ui/play-from-replay.ts` and `src/ui/play-from-replay.test.ts`; in
   `src/ui/Play.tsx` the `MoveList` with `activePly` (from "The moves of the game, and
   once it has been reviewed"), `PlayControls`' second row (`play-review-row`), the
   `preferredShapes` function, the `highlight` rule beside `positionAtPly` ("Standing
   on the position a slip was played from"), the arrow-key `useEffect` ("The arrows
   only listen while a report is showing"), and the `.jump` buttons in the slips list;
   in `src/ui/play-context.tsx` `replayPly`, `setReplayPly`, `resume` and `canResume`;
   in `src/ui/play.css` `.play-review-row`, `.play-steps`, `.step-arrow`,
   `.move-step`, `.move-step.here`, `.jump` and `.slips li .jump`; the DOM tests
   `src/ui/replay.dom.test.tsx` and `src/ui/play-from-replay.dom.test.tsx`.

## Where things stand

Phase 10 landed as `fe794fd` and passed gate 10 as `445e175`: 305 tests green in 14.8
seconds, nothing skipped. A game can be stopped and reviewed; the report in the side
panel names each slip with its tag and the engine's preferred move. Left for this
phase, on purpose:

- `src/play/replay.ts` holds only `canReplayMoves`.
- `src/ui/MoveList.tsx` is a record: `MoveList({ moves, pixels })`, spans only, no
  `activePly`. Its scrolling is `scrollToShow` from `keep-in-view.ts`, applied to the
  list's own `scrollTop`, with the board's height arriving as `--board-pixels`.
- `src/ui/Report.tsx` renders each slip as `<li key={slip.ply} className={slip.tag}>`
  with the sentence inside, and a comment naming this phase. Not buttons yet.
- `src/ui/PlayControls.tsx` is row one only: New game, Undo, Redo, Hint. Undo, Redo
  and Hint are already disabled while `reviewing`.
- `src/ui/Screen.tsx` composes the board from `session.fen`, the bar from
  `shownEvaluation(fen, session.moves, game.evaluations)`, the last-move highlight
  from `session.moves.at(-1)`, the shapes from `hintShapes`, and locks the board when
  `game.report !== null`.
- `src/ui/play-context.tsx` (`PlayGame`) has `report`, `finish`, `discard` and
  `start(options: StartOptions)` where `StartOptions` is `{ level, side, startMoves? }`.
  `start` puts the report away and replays `startMoves` through `PlaySession`. There is
  no `replayPly`, `resume` or `canResume`.
- `src/test/board-stub.tsx` already exposes `data-fen`, `data-last-move` and
  `data-shapes` (each shape as `brush + orig + dest`), so a DOM test can read the
  board's position, highlight and arrow without chessground.
- `--mark` is already in `src/index.css` for both themes.

## Settled decisions

- **Spec 18.4 is the specification.** Build what it says and nothing beside it.
- **Play from here is `start` with a prefix.** The new game is
  `start({ level, side, startMoves: sans.slice(0, ply) })`, the path a loaded game
  already takes. That is what the trainer does too (`requestFromReplay` carries the
  SAN prefix, not a FEN), and it is why the PGN needs no `SetUp` or `FEN` tag and why
  Save, Load and Undo work on the new game for free. `start` already puts the report
  away and starts fresh maps; the old game is forgotten because nothing keeps it (the
  remembered game in storage becomes the new one when `rememberNow` runs). Play from
  here is offered only where it is the user's move and the game is not over there,
  with the trainer's `whyNotPlayable` sentences in the tooltip, so the engine never
  has to move first.
- **Keep playing** is the trainer's `resume`: `setReport(null)` and
  `setReplayPly(null)`, only when the session has no outcome. The board is at the
  session's own `fen`, which is the final position. The evaluation map stays.
- **The bar during the review reads the viewed position.** `shownEvaluation(shown,
  session.moves, game.evaluations)` where `shown` is `positionAtPly(moves, ply) ??
  session.fen`. Every position has an entry because the scan filled them; if one is
  missing the scan is wrong, not the bar.
- **`replayPly` lives in the provider, cleared wherever `setReport(null)` is called**
  (start, discard, resume), so no path can leave the viewer pointing into a game that
  is gone. The screen derives `ply` as the trainer does: `report !== null && replayPly
  !== null ? clampPly(moves, replayPly) : moves.length`.
- **The list scrolls itself.** The trainer's `MoveList` calls
  `node.scrollIntoView({ block: 'nearest' })` on the marked button. Do not copy that
  line: it is the phase 6 fault (it scrolled the whole screen and cut off the top of the
  board). Bring the marked button into view with `scrollToShow` on the list's own
  `scrollTop`, the same call `MoveList` already makes for the newest move. That is the
  one adaptation the `Origin:` line names.
- **The arrow keys** listen on `window` only while a report is showing, ignore events
  whose target is an `INPUT`, `TEXTAREA` or `SELECT`, and `preventDefault` when they
  step. This app has one screen, so the effect goes where the report is composed
  (`Screen.tsx`), not in a second component.
- **The highlight rule** is the trainer's: standing on the position a slip was played
  from, the highlight is the slip itself (`moves[ply]`) and the arrow is the better
  move; anywhere else the highlight is `moveAtPly(moves, ply)`. Slips carry `better`
  from phase 10's `scanForSlips`.
- **The board must not change size.** Phase 9's `CHROME_BELOW = 120` in
  `ui/board-size.ts` already counts row two. Do not touch the chrome constants. The
  probe with the report and row two showing must still put the bar, `.board` and
  `cg-board` on one pixel and keep `scrollWidth` equal to `innerWidth`.
- **Copy rule S3.** `positionAtPly`, `moveAtPly`, `clampPly`, `plyBeforeMove`,
  `plyAfterMove` are byte-identical to the trainer's plus one `Origin:` line.
  `canPlayFromPly` and `whyNotPlayable` are adapted: the `ReplayedGame` interface
  shrinks to `{ moves }` (no course, chapter, level or date here), the parameter is the
  user's colour, and the sentences stay exactly as written except "trainee", which this
  app never says: "It is the engine's move here. Step one move on or back." and "The
  game is over here." are unchanged, and any comment saying trainee says user.
  `moveAtPlyLabel`, `requestFromReplay` and `playedDay` are not copied; nothing here
  needs them. Say every adaptation in the file's `Origin:` line.
- **Words.** Spec section 3's: the user, the engine, level, side, the bar, evaluation,
  move, game, outcome. Never "trainee". The buttons say exactly **Keep playing** and
  **Play from here**; the arrows carry `aria-label` and `title` "Back one move" and
  "Forward one move".
- **No headless browser on this machine, ever.** Screenshots are not required. Clear
  the pane's `localStorage` after every drive.

## The work

- [ ] 11.1 `src/play/replay.ts` gains `positionAtPly`, `moveAtPly`, `clampPly`,
      `plyBeforeMove`, `plyAfterMove` (identical text, the trainer's file comment kept);
      `src/play/replay.test.ts` gains the trainer's tests for them beside the
      `canReplayMoves` ones. The `PlayedMove` type is this app's (`play/session.ts`),
      which has the same `fen` and `after` fields.
- [ ] 11.2 `src/ui/play-from-replay.ts`: `ReplayedGame { moves }`, `canPlayFromPly`,
      `whyNotPlayable`, with the trainer's tests that apply (the four `whyNotPlayable`
      cases and the colour case) in `play-from-replay.test.ts`. The provider gains
      `replayPly: number | null`, `setReplayPly`, `resume` and
      `canResume: session !== null && report !== null && !session.outcome` (use
      whatever the session calls its outcome; `stoppedAt` in `report.ts` already reads
      it). Every `setReport(null)` is paired with `setReplayPly(null)`.
- [ ] 11.3 `MoveList` takes `activePly: number | null` and `onSelect`. Null during a
      game: spans, as now. Otherwise each move is a `button.move-step`, the one at
      `activePly === entry.ply + 1` also `here` with `aria-current="true"`, and the
      list scrolls itself to show it with `scrollToShow`. `Report` turns each slip into
      `button.jump` inside its `li`, calling `onJump(slip.ply)`, which sets the replay
      ply to `plyBeforeMove(slip.ply)` (the position the slip was played from).
- [ ] 11.4 `PlayControls` gains the trainer's row two, rendered only while a report
      is showing: Keep playing when `canResume`, Play from here with `whyNotPlayable`
      as its `disabled` reason and the two tooltips the trainer uses, and the
      `play-steps` group with the two `step-arrow` buttons, Back disabled at ply 0 and
      Forward at the end. The CSS classes copied from `play.css` with their comments.
      The arrow-key effect in `Screen.tsx`.
- [ ] 11.5 `preferredShapes(report, ply, fen)` copied, and the highlight rule.
      `Screen.tsx` gives the board `fen={shown}`, `lastMove` from the rule, `shapes`
      from `preferredShapes` while reviewing and `hintShapes` otherwise, and the bar
      `shownEvaluation(shown, ...)`.
- [ ] 11.6 Tests in `review.dom.test.tsx` or a new `viewer.dom.test.tsx`, the fewer
      full-app mounts the better (the suite is at 14.8 seconds; if it crosses twenty
      the answer is fewer mounts, not a longer ceiling). S15 item 14: after a review,
      clicking a move puts that move's `after` on the board (`data-fen`), marks the
      button (`aria-current`), and ArrowLeft and ArrowRight step, while a keydown with
      an `<input>` as target does not; the board is still locked. Item 15: Keep playing
      on a stopped game clears the report and the board reads the final `fen`; Keep
      playing is absent for a game that ended by itself. Item 16: Play from here at a
      user-to-move ply starts a game whose `session.moves` are the prefix, with no
      report and no old moves; the button is disabled with the engine's-move sentence
      at an engine-to-move ply and with "The game is over here." at a mate. One test
      that standing on a slip's ply shows a `blue` shape for the better move and
      highlights the slip (`data-shapes`, `data-last-move`). One test that clicking a
      slip's sentence moves the board to the position it was played from.
- [ ] 11.7 Drive in the pane at 1280 by 980 (`npm run dev`, port 5185, confirm the
      served page is this app): seed a short game with a known blunder (the gate 10
      one: `['e4','e5','Qh5','Nc6','Qxe5+','Nxe5','Nf3','d6']` at level 1 as White,
      reopened so the scan has work), Stop and review, click moves in the list, watch
      the mark and the bar change, step with the keys with the page focused, focus a
      text field and confirm the keys do nothing there, click the blunder's sentence
      and see the blue arrow and the highlight together, Keep playing and see the
      final position with row one live again, review again and Play from here at a
      user-to-move ply. Run the layout probe with the report and row two showing:
      board 416, one ending pixel, `scrollWidth` = `innerWidth`. Both themes. The
      engine's first start in a hidden pane can miss its timeout: reload once, do not
      change the timeout. Poll the DOM; a hidden pane throttles React. Clear
      `localStorage` afterwards and stop the server.
- [ ] 11.8 Reuse review before the commit. Likely finds: a second "position at a ply"
      loop (the home is `positionAtPly`), a second "squares of a move" (the home is
      `squaresOf` in `Screen.tsx`, or move it beside `squaresForSan` if two files need
      it), a second `.jump`-style button reset in CSS. Then the phase notes in the plan
      (measurements, adaptations, what was not copied and why), the boxes ticked,
      `CLAUDE.md`'s "Current state" paragraph moved on one phase, and the commit.

## Decision rules

- A test that needs layout (scrolling, pixels) cannot exist in jsdom: prove it in the
  pane and say so in the notes, as phase 6 did.
- If `PlaySession` has no way to tell "stopped" from "ended" that `canResume` can
  read, use the same field `stoppedAt` reads; do not add a second flag.
- If something in spec 18.4 contradicts the trainer's code, the spec wins; record the
  difference in the notes. If the spec and the plan contradict each other, stop and
  say so in the notes, then carry on with everything else.
- Anything a person would see or feel that neither the spec nor the trainer settles:
  ask Nick, do not guess.

## Out of scope

The version bump, `npx tauri build`, the acceptance walk and the deploy document
(phase 12). Any change to `../London` or `../Conquest`. The chrome constants.
Anything about openings.

## Acceptance

`npx vitest run` green under twenty seconds with nothing skipped; `tsc -b` clean;
`npx oxlint` silent; `npm run build` clean with no `midgame` in the assets; the pane
drive of 11.7 done and written up with the probe's numbers; every spec 18.4 sentence
true on screen; the boxes ticked; `../London` untouched (`git -C ../London status`
shows nothing new from you).

## Conventions

Commits on `main`, short imperative subject, a body that says why, ending with
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` (name the model you actually
are). Write the message to a scratch file and `git commit -F` it. Stage explicit
paths, never `git add -A`, never `git clean`. No em dashes under `src/`. Australian
English. Nick's own files are not listed or reported. Never push.
