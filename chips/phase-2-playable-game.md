# Chip: phase 2 - the board, the session and a playable game

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`. Your
context may have been compacted since phase 1; Nick decides that each time. **Do not
rely on what you remember of phases 0 and 1.** Read fresh, in this order, before
touching a file: `CLAUDE.md`; `docs/simple-chess-spec.md` sections 3, 4, 5, 6, 13
and 14; the plan `docs/simple-chess-build-plan.md` "Rules for the builder", "Standing
discipline", phase 2, and the phase 1 notes with the gate 1 findings at the end; then
`docs/testing.md`. Everything below is compressed from those; where this chip and the
spec disagree, the spec wins and you say so in the phase notes.

**Goal: a game against the engine can be played on screen, with the four buttons, the
status line and the move list. No sidebar yet: level 4, White, the small board.**
This is the phase that puts chess on the screen. Version stays 0.1.0.

## Where things stand

Phases 0 and 1 are committed (`4c01e5a`, `17c8321`) and passed review. The repo has
the header with the theme toggle, and every pure module: `src/engine/` (the
Stockfish adapter, UCI parsing, the eight levels), `src/model/` (`position.ts` with
`legalDests`, `sideToMove`, `isPromotion`, `positionKey`; `moves.ts` with
`squaresForSan` and `sanForMove`; `pgn.ts`; `types.ts` with `Colour`, `Brush`,
`Shape`, `colourName`), `src/play/` (`outcome.ts`, `evalbar.ts` with the
`{ pawns, text }` evaluation), and `src/test/fake-engine.ts`. 90 tests green. The
trainer is `C:\Users\nick2\Code\London`; you read and copy from it and never change
it.

## Settled decisions you build on

- **Copy per spec S3.** Identical files carry `Origin: London <path>, identical.`;
  adapted files carry `Origin: London <path>, adapted: <what changed>` and their
  comments describe this app. In an adapted file the words are this app's: `user`,
  never `trainee` or `student` (spec section 3). So the session's `studentColour`
  becomes `userColour`, `studentToMove` becomes `userToMove`, `playStudent` becomes
  `playUser`, and `playOpponent` becomes `playEngine`. `engineColour` stays.
- **One worker for the life of the app (spec S5).** The provider stops the worker only
  when it unmounts. New game calls the engine's `newGame()` and keeps the worker.
- **Undo works in pairs (spec 5.4)**, exactly as the trainer's session: back to the
  last position where it was the user's move; redo puts it back up to the user's next
  turn; a new move clears the redo stack; the outcome is cleared and worked out again
  after every undo and redo.
- **The board locks** (`movableColor` undefined) while the engine thinks and once the
  game has ended. Only the user's colour is ever movable.
- **Layout numbers (spec 4.2):** board 416 (`BOARD_SIZE`), bar 24 px wide, gap bar to
  board 20 px, so the button row's left margin is 44 px; gap board column to sidebar
  24 px; sidebar 280 px wide, as tall as the board column; page padding 24 px. This
  phase draws the bar as an EMPTY placeholder box of those sizes; phase 4 fills it.
- **Screenshots:** the pane's screenshot is looked at and described with measured
  numbers in the notes. **No screenshot files. No headless browser on this machine**
  (plan rule 7, CLAUDE.md hazards).
- **The DOM tests never start a worker.** `PlayProvider` takes `createEngine`, the
  tests hand it `fakeEngine`, and one test installs a throwing `Worker` to prove it.

## The work

### 2.1 The board

- [ ] `src/ui/Board.tsx` and `src/ui/board.css`: identical to the trainer's, origin
  lines. `Board.tsx` imports chessground's three CSS files and `board.css`; it keeps
  `trustAllEvents: import.meta.env.DEV` and the dev-only `window.__cg` handle, both
  of which the pane drive uses.
- [ ] `src/ui/board-size.ts`, adapted: `BOARD_SIZE = 416` with the trainer's comment
  (why 416: chessground floors squares to whole pixels, and 416 divides by eight so
  the bar ends where the board does), plus `BOARD_SIZE_LARGE = 832` with one sentence
  saying phase 3 brings the fit rule for iPad. Nothing else.

### 2.2 The session

- [ ] `src/play/session.ts`, adapted from `London/src/play/session.ts`. Keep the shape
  and the comments' reasoning; remove everything about the book, the course side, the
  length cap and hints. Exactly:

  - `PlayedMove` moves here from the trainer's `report.ts` (with an origin note):
    `{ ply, san, colour, fen, after }`. No `fromBook`, no `alternative`.
  - `fullMove(ply)` from `report.ts` beside it, identical text:
    `Math.floor(ply / 2) + 1`.
  - `SessionOptions`: `{ engine: Engine; profile: StrengthProfile; side?: Colour;
    startMoves?: string[]; random?: () => number }`. `side` defaults to `'white'`
    and is the user's colour. No `book`, no `length`, no `startFen`, no
    `courseMoves`.
  - Fields: `chess`, `moves`, `floor` (the plies replayed by the constructor, which
    undo may not go below), `undone`, `outcome?`. No `bookReplies`, no `hints`, no
    `cap`.
  - `profile` is a private field set from the options and changed by
    `setProfile(profile: StrengthProfile): void`. `engineMove` reads the field at
    the moment it searches, so a change reaches the engine's next move (spec S6).
    Telling the engine itself (`engine.setStrength`) is the provider's job, below.
  - Getters `fen`, `sideToMove`, `userColour`, `engineColour`, `userToMove`,
    `status` (`'finished'` when `outcome` is set or `chess.isGameOver()`, else
    `'playing'`), `isFinished()`.
  - `playUser(san)`, `canUndo()`, `canRedo()`, `undo()`, `redo()`, `undoTarget()`,
    `reoutcome()`, `noteOutcome()` as the trainer's, renamed as above.
  - `playEngine()`: the engine half of the trainer's `playOpponent` only (no book
    lookup): returns null unless it is the engine's move and the game is playing;
    searches with the current profile's `movetime`; `chooseCandidate` picks; the move
    is recorded and the outcome noted. Returns the SAN or null.
  - `engineMove(fen)` as the trainer's.
  - The constructor replays `startMoves` as the trainer's does, sets `floor`, and
    calls `noteOutcome()`, for the trainer's reason (a replayed mate is still a mate).

- [ ] `src/play/scan.ts` is NOT this phase (phase 5). `src/play/replay.ts` is NOT this
  phase (phase 3 brings `canReplayMoves`).
- [ ] `src/play/session.test.ts`, new, with a recording fake engine where needed
  (`fakeEngine({ search })` or a wrapper that records the `movetime` it was given).
  Tests, each with the name in quotes as its `it` name:
  1. "plays the user's move and refuses an illegal one"
  2. "the engine replies with what the fake engine chose"
  3. "undo goes back a pair, to the user's move" (after 1.d4 and a reply, undo leaves
     zero moves; `canUndo` false)
  4. "redo puts the pair back, and a new move clears the redo stack"
  5. "undo out of a checkmate clears the outcome" (replay fool's mate through
     `startMoves`, undo, `outcome` undefined and `isFinished()` false)
  6. "undo cannot go below the moves the game started from" (startMoves of two plies,
     undo returns false)
  7. "a game started with Black has the engine to move first" (`side: 'black'`,
     `userToMove` false, `playEngine()` returns a SAN)
  8. "setProfile changes the movetime the next search is given" (spec S15 item 3)
  9. "a replayed checkmate is finished on arrival" (startMoves ending in mate)
  10. "a level 1 profile picks among candidates by the injected random" (three
      candidates from the fake, `random: () => 0.99` picks the last)

### 2.3 The provider

- [ ] `src/ui/play-context.tsx`, adapted from `London/src/ui/play-context.tsx`. Keep:
  the comment on why the value is NOT memoised (word for word, it records a real
  bug); `createEngine` injected with the real `StockfishEngine` as the default;
  `engineRef`, `sessionRef`, `setupRef`, the `refresh` tick; `thinking`,
  `engineError`, `evaluations` (typed `Map<string, Evaluation>` from `evalbar.ts`,
  empty this phase), `hint` (typed `Hint | null`, always null this phase; phase 4
  fills it); `start`, `play`, `undo`, `redo`, `reset`; `asMessage`; the dev-only
  `window.__game` handle.
  Remove: the book, the course titles, `recordedAt`, `report`, `replayPly`,
  `scanning`, `extend`, `finish`, `resume`, `discard`, `canResume`, `askHint`,
  `canHint`, the progress store, `evaluate` (phase 4 adds it back; leave a comment
  where `evaluate` will go, in `play`, saying phase 4).
  - `StartOptions`: `{ level: number; side: Colour; startMoves?: string[] }`.
  - `PlayGame` (the context value): `session`, `level`, `side`, `thinking`,
    `engineError`, `evaluations`, `hint`, `start`, `play`, `undo`, `redo`, `reset`,
    `setLevel`, `inProgress` (a session exists and is not finished).
  - `start`: `setEngineError(null)`, `setThinking(true)`, get the engine (`start()`
    on it is idempotent in the adapter), `newGame()`, `setStrength(profile)`, build
    the session, `remember` nothing, refresh; if `!fresh.userToMove && !fresh.
    isFinished()` await `fresh.playEngine()`; refresh; errors to `engineError`;
    `finally` `setThinking(false)`.
  - `play(from, to, promotion?)`: the trainer's `play`, with `sanForMove(fen, from,
    to, promotion)` from `src/model/moves.ts` and `playUser`; then `playEngine()`;
    no `evaluate` yet. The `promotion` parameter exists now so phase 4 does not
    change the signature; this phase never passes it.
  - `setLevel(level)`: stores the level in state and the setup ref, calls the
    session's `setProfile(strengthProfile(level))`, and awaits
    `engine.setStrength(profile)` through the engine's own queue. A change while the
    engine is thinking lands after the running search, which is spec S6's "the move
    after that one".
  - `reset()`: clears the session, the error, the hint and the evaluations, calls
    `engineRef.current?.newGame()` and does NOT stop the worker (spec S5). The worker
    stops in the unmount effect only.
  - Export `PlayContext`, `PlayProvider`, `usePlay`, `type CreateEngine`, `type
    StartOptions`, `type PlayGame`.

### 2.4 The components

- [ ] `src/ui/PlayControls.tsx`: the trainer's `PlayControls`, row one only: New game,
  Undo, Redo, Hint, in that order, real `<button>`s, `className="play-controls"`.
  Undo and Redo disabled when `thinking` or the session says no; Hint disabled
  always this phase (`canHint` false), with a comment that phase 4 wires it. New game
  always enabled. Origin line adapted.
- [ ] `src/ui/MoveList.tsx`: the trainer's `MoveList` from `Play.tsx`, with the
  `activePly` and button branches removed: every cell is a `<span>`. The `ol` keeps
  `className="move-list"`. Height: not the trainer's `rows` prop; the list fills its
  column (`flex: 1; min-height: 0; overflow-y: auto`), and the last row gets a `ref`
  that calls `scrollIntoView({ block: 'nearest' })` so the newest move stays in view.
  `dom-setup.ts` already stubs `scrollIntoView`.
- [ ] `src/ui/StatusLine.tsx`: one `<p className="play-status">` with the trainer's
  `PlayHead` wording (spec 5.6): the outcome when finished; else "White is
  thinking..." or "Black is thinking..." (`colourName(engineColour)`) when thinking;
  else "Your move". An `engineError` renders as a second `<p className="notice
  bad">` under it. Copy `.notice` from `London/src/ui/study.css` (line 517 on
  2026-09-11) and `.notice.bad` from `London/src/ui/progress.css` (line 68) into
  `play.css`, text unchanged; the origin line names both.
- [ ] `src/ui/Screen.tsx`: `div.play-body` holding `div.play-column` (`div.play-board`
  with the placeholder `div.live-eval` and the `Board`, then `PlayControls`, then
  `StatusLine`) and `aside.sidebar` holding the `MoveList` only. The `Board` gets
  `fen={session.fen}`, `orientation={session.userColour}`, `turnColor=
  {sideToMove(fen)}`, `movableColor` and `dests` only when the user may move,
  `lastMove` from `squaresForSan` on the last played move (the trainer's `squaresOf`,
  copied into this file), `onMove={(from, to) => void game.play(from, to)}`,
  `size={BOARD_SIZE}`. While there is no session yet, render the header's `<main>`
  empty.
- [ ] `src/ui/play.css`, adapted from the trainer's: keep `.play-body`,
  `.play-column`, `.play-board` (gap 20 px), `.play-controls` (margin-left 44 px),
  `.play-status`, `.live-eval` (width 24 px, the piece colours, the border, the
  box-sizing comment), `.live-eval-white`, `.move-list` and its scrollbar rules,
  `.move-list li`, `.move-number`, plus `.notice` and `.notice.bad`. Add `.sidebar`:
  `width: 280px; flex: none; display: flex; flex-direction: column; align-self:
  stretch; gap: 12px`. Drop everything about fieldsets, the report, hints, replay,
  copy-game. Every number that changed from the trainer's carries a comment saying
  why (spec 4.2 gives the reasons).
- [ ] `src/ui/App.tsx`: split as the trainer's into `App` (builds `PlayProvider`
  around `Shell`) and `Shell` (the header from phase 0, then `<main><Screen /></main>`).
  `Shell` starts a game on mount: `useEffect(() => { if (!started.current) {
  started.current = true; void game.start({ level: 4, side: 'white' }) } }, [])` with
  the comment that StrictMode runs effects twice in development and a second start
  would throw the first game away. Level 4 and White are constants here until phase 3
  reads the settings; name them `FIRST_LEVEL` and `FIRST_SIDE` with a comment saying
  phase 3 replaces them.

### 2.5 The test rig

- [ ] `src/test/board-stub.tsx` identical (it reads `BoardProps` from `../ui/Board`).
- [ ] `src/test/dom.tsx`: `renderApp` now renders `<PlayProvider createEngine={() =>
  fakeEngine()}><Shell /></PlayProvider>` and accepts an optional `createEngine` so a
  test can hand in a scripted engine; grows `board()` and `movesOnScreen()` from the
  trainer, identical text.
- [ ] `src/test/scripted-engine.ts`, new: `scriptedEngine(moves: string[])` returns a
  `fakeEngine` whose `search` answers the queued UCI moves in order (`e7e5`, then
  `b8c6`, ...) and falls back to the first legal move when the queue is empty. Its
  comment says why it exists: a DOM test that wants a checkmate needs the engine to
  cooperate, and `fakeEngine`'s single `move` override cannot vary by position.
- [ ] `src/ui/rig.dom.test.tsx` identical: it pins the `ResizeObserver` throw that
  makes the stub necessary.
- [ ] `src/ui/play-game.dom.test.tsx`, adapted from the trainer's: no course, no
  "Start the game" button (the game starts on mount; `await screen.findByTestId(
  'board')` is the wait). Tests: "shows the move that was played, and the one that
  answered it"; "takes the moves off the screen when Undo takes them off the game";
  "puts them back when Redo puts them back"; "never starts a Stockfish worker" (the
  throwing `Worker` guard, identical text); "New game empties the list and the redo
  stack" (play, undo, New game, Redo is disabled); "says who is thinking and then
  Your move" (the status line text before and after the reply, with `vi.waitFor`);
  "ends in the outcome sentence when the engine is mated" (scripted engine
  answering `e7e5`, `b8c6`, `g8f6` to 1.e4 2.Qh5 3.Bc4 4.Qxf7#; the status line
  reads "You won by checkmate" and the board is locked: no `move` buttons).

### 2.6 Prove it in the pane

- [ ] `npm run dev` on 5185 (the launch configuration `simple-chess-dev`). Confirm the
  header reads v0.1.0. At 1280 by 1000, dark theme: the board is on screen, White at
  the bottom, coordinates in their corners. Play 1.d4 by clicking the pawn and its
  square (chessground accepts clicks; `trustAllEvents` is on in dev). The status line
  says "Black is thinking..." then "Your move"; the move list shows both moves; the
  engine's reply is a legal move. Play three more moves. Undo, Redo, New game.
- [ ] Measure with the JavaScript tool and put the numbers in the notes: the
  bounding boxes of `.live-eval`, `.board` and `cg-board` (all 416 tall, the same
  top and bottom), `.play-controls` left edge equal to `.board` left edge, `.sidebar`
  width 280, `document.documentElement.scrollWidth` equal to `innerWidth`. Read
  `window.__game.moves.length` and `window.__cg.state.movable.color` after the
  engine's reply (`'white'`) and while it thinks (`undefined`).
- [ ] Both themes. Describe what was seen. No files.
- [ ] Clear the pane's `localStorage` afterwards (nothing writes to it yet, but the
  theme does).

### 2.7 Close

- [ ] `npx vitest run` both projects green under twenty seconds; record counts and
  time. `tsc -b` clean, `npx oxlint` silent, `npm run build` clean.
- [ ] Every copy diffed against its origin, listed. `grep -rn "trainee\|student\|
  repertoire\|course\|book" src/` finds nothing in an adapted or new file.
- [ ] Reuse and duplication review, then commit.

## Decision rules

- **Chessground's click-to-move does not register in the pane.** Try a drag
  (`left_click_drag`) before concluding; then use `window.__cg` to confirm what the
  board holds. If nothing moves a piece from the pane, play through
  `window.__game`'s provider is not possible (the provider is not on `window`), so
  say so in the notes and rely on the DOM tests for the move path; the layout
  measurements still stand. Do not add a test hook to production code for this.
- **The engine does not start in the pane** (no reply within a few seconds): check the
  console for the worker URL, check `public/engine/` is filled, and record what you
  found. A real engine fault is a phase finding, not a reason to fake it.
- **A copied file does not compile here**: fix the copy in the smallest way and record
  the fault for carrying back.
- **Something a person would see is not specified** (a wording, a colour, a size the
  spec does not give): stop and ask Nick. Code shape: decide and say why.
- **A contradiction** between chip, plan, spec and copied code: stop that item, write
  it down, continue with the rest.

## Out of scope for this phase

The sidebar's settings and their persistence (phase 3), the remembered game (3), the
fit rule and the large board (3), the narrow layout (3), the bar's value and number
(4), Hint (4), the promotion picker (4; a promoting pawn move auto-queens through
`sanForMove`'s default this phase and the notes say so), save and load (5), scenes and
the probe file (6).

## Acceptance

Phase 2 of the plan, every box ticked as it lands: a game plays in the pane against
the real engine and in the DOM tests against the fake; the ten session tests and the
seven DOM tests named above exist and pass; the worker guard passes; the measured
numbers in the notes match spec 4.2; `tsc -b` clean; suite under twenty seconds; origin
lines on every copy; no forbidden words in adapted files; `../London` and
`../Conquest` untouched.

## Conventions

- Tick the plan's phase 2 boxes as you go. Append "Phase 2 - builder notes" under the
  plan's "Phase notes" after the gate 1 findings: measured, decided, asked, the reuse
  review's find, left. Update the Progress table row.
- The reuse review's likely finds this phase: a second "is it the user's move and the
  game is playing" test written in the provider that the session already answers; a
  second `squaresOf`; a colour or a pixel number written outside `index.css`,
  `board-size.ts` and `play.css`.
- One commit at least, on `main`. Short imperative subject, a body that says why. End
  the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, naming the
  model you actually are. Write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours.

## Cleanup

Stop the dev server. Report the commit hash, the test counts and time, the measured
layout numbers, and anything the decision rules made you skip.
