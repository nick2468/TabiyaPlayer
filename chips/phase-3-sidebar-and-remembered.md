# Chip: phase 3 - the sidebar and what is remembered

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`. Your
context may have been compacted since phase 2; Nick decides that each time. **Do not
rely on what you remember of phases 0 to 2.** Read fresh, in this order, before
touching a file: `CLAUDE.md`; `docs/simple-chess-spec.md` sections 3, 4 (all of it,
S2 as corrected at gate 2), 5.1, 6.2, 10, 13 and 14; the plan
`docs/simple-chess-build-plan.md` "Rules for the builder", "Standing discipline",
phase 3, and the phase 2 notes with the gate 2 findings at the end; then
`docs/testing.md`. Everything below is compressed from those; where this chip and the
spec disagree, the spec wins and you say so in the phase notes.

**Goal: difficulty, Play as and board size on the sidebar, all remembered; the game
in progress remembered; the large board fitting the screen; the narrow layout for an
iPad held upright.** Version stays 0.1.0.

## Where things stand

Phases 0 to 2 are committed (`4c01e5a`, `17c8321`, `35584e1`) and passed review. A
game plays on screen at level 4 as White on the small board: `Shell` starts it in a
mount effect with the constants `FIRST_LEVEL` and `FIRST_SIDE`, and New game calls
`game.start` again with them. The provider (`src/ui/play-context.tsx`) has `start`,
`play`, `undo`, `redo`, `setLevel`, `reset` (unused) and the StrictMode-safe engine
stop. The sidebar (`aside.sidebar`, 280 px) holds only the move list. 111 tests
green. The trainer is `C:\Users\nick2\Code\London`, Conquest is
`C:\Users\nick2\Code\Conquest`; you read and copy from them and never change them.

## Rulings from gate 2 that bind you now

1. **New game is disabled while the engine thinks**, like Undo, Redo and Hint. A New
   game pressed mid-think let the old search land its reply on a discarded session.
   One `disabled={thinking}` on the button, and the "says who is thinking" DOM test
   asserts New game is disabled while the search is held and enabled after.
2. **`reset` goes** unless this phase calls it. A function kept for a caller that may
   never come is the dead code the brief forbids. Say in the notes which it was.
3. **The large board is the fit rule everywhere** (spec S2, corrected). At 1280 by
   1000 it is 808, not 832, because the chrome above and below the board measures
   190 px in total. Do not shrink the chrome to force 832; that is Nick's call and
   he has been told.

## Settled decisions you build on

- **Copy per spec S3**: identical files carry `Origin: ... identical.`; adapted files
  say what changed and use this app's words (`user`, never `trainee`).
- **Storage** (spec 10): `localStorage`, read once on mount, written on change, every
  read and write wrapped so a browser that refuses storage still runs the app. Keys:
  `simple-chess.theme` (exists), `simple-chess.level` (`1` to `8`, default `4`),
  `simple-chess.side` (`white`, `black`, default `white`), `simple-chess.board-size`
  (`small`, `large`, default `small`), `simple-chess.game` (the current game).
- **The current game** is `{ "version": 1, "sans": [...], "side": "white", "level":
  4 }`, written after every move, undo, redo and start, removed when a fresh game has
  no moves. A stored game that does not pass every check is discarded silently and a
  fresh game starts (Conquest's `recallSetup` rule).
- **Level change applies to the engine's next move** (spec S6): the provider's
  `setLevel` already does this; the sidebar calls it and the setting is written.
- **Play as** applies at the next New game (spec 5.1). Play as Black: the engine
  moves first, the board is oriented black.
- **Layout numbers** are spec 4.2's; the chrome numbers measured in phase 2 are
  the fit rule's inputs (below).
- **Screenshots**: looked at and described with measured numbers. No files. No
  headless browser.

## The work

### 3.1 The settings, remembered

- [ ] `src/storage/prefs.ts`, adapted from `London/src/ui/prefs.ts`: copy `read`,
  `write`, `readOneOf` and `useRemembered` with their comments (identical text; the
  origin line names them), and the header comment's reasoning about why settings
  live in `localStorage` and never in a file, reworded for this app. Then three
  hooks, in the trainer's `useRemembered` shape:
  - `useLevel(): { level: number; setLevel: (level: number) => void }`, default 4,
    anything stored that is not an integer 1 to 8 falls back (the trainer's
    `usePlayPrefs` level reader, same text).
  - `useSide(): { side: Colour; setSide: (side: Colour) => void }`, via `readOneOf`
    with `['white', 'black']`, default `'white'`.
  - `useBoardSize(): { boardSize: BoardSizeName; setBoardSize }` with
    `export type BoardSizeName = 'small' | 'large'`, via `readOneOf`, default
    `'small'`.
  Each hook is called ONCE, in `Shell`, and handed down, for the reason the trainer
  gives on `useDrillScope`: two calls would be two pieces of state that drift.
- [ ] `src/storage/prefs.test.ts`: `readOneOf` and the level reader against a stub
  storage (the trainer tests these through DOM tests; here a string test with
  `globalThis.localStorage` stubbed is enough: a good value, a scrambled value, a
  missing value, a storage that throws).

### 3.2 The current game, remembered

- [ ] `src/storage/current-game.ts`, new, origin line naming Conquest's
  `src/ui/remembered-setup.ts` as the pattern: `export interface RememberedGame {
  readonly version: 1; readonly sans: readonly string[]; readonly side: Colour;
  readonly level: number }`; `rememberGame(game)`, `recallGame(): RememberedGame |
  null`, `forgetGame()`. Every field checked on the way back: `version` must be 1,
  `sans` an array of strings, `side` one of the two, `level` an integer 1 to 8; any
  failure gives null. Uses `prefs.ts`'s `read` and `write` (export them) rather than
  its own storage access, so the try-catch lives once. Add `remove(key)` beside
  `write` for `forgetGame`.
- [ ] `src/storage/current-game.test.ts`: round trip; each scrambled field gives null;
  a storage that throws gives null and does not throw.
- [ ] `src/play/replay.ts`, new: `canReplayMoves(sans)` from `London/src/ui/play-on.ts`
  (lines 95 to 106 on 2026-09-11), identical text with its comment reworded to this
  app (a stored game rather than a record), origin line. A test: a legal list is true,
  an empty list false, an illegal list false.

### 3.3 The provider remembers and recalls

- [ ] In `play-context.tsx`: after `start` builds the session (and after the engine's
  first move when the user is Black), after `play` lands the user's move and again
  after the reply, and after `undo` and `redo`, call one private helper
  `rememberNow()` that writes `{ version: 1, sans: session.moves.map(m => m.san),
  side, level }` through `rememberGame`, or `forgetGame()` when the session has no
  moves. One helper, one place that knows the shape. `setLevel` calls it too, so a
  level change mid-game is remembered with the game.
- [ ] `Shell` (`App.tsx`): on mount, `recallGame()`. If it returns a game and
  `canReplayMoves(game.sans)`, start with `{ level: game.level, side: game.side,
  startMoves: game.sans }` and set the level and side hooks to the game's (the game's
  own settings win over the stored settings, because a game loaded from a file in
  phase 5 carries its own). Otherwise start a fresh game from the hooks' values.
  `FIRST_LEVEL` and `FIRST_SIDE` go. New game starts from the hooks' current values.
  The `started` ref stays.
- [ ] DOM tests (spec S15 item 7): "the game reopens after a restart" (play d4, the
  reply, `cleanup()`, `renderApp()` again, the list shows both moves and the board
  shows the position); "a scrambled stored game is discarded and a fresh game
  starts" (write junk under `simple-chess.game`, render, empty list, no error on
  screen, and the junk is gone from storage or replaced by nothing).

### 3.4 The sidebar

- [ ] `src/ui/Sidebar.tsx`, new. Three fieldsets in the trainer's Play-screen style,
  then the two file buttons, then the move list. Props: the three settings with their
  setters, `thinking`, and the move list's moves. Markup:
  - `<fieldset><legend>Difficulty</legend>` with the trainer's select (from
    `London/src/ui/Play.tsx` "How strong": `aria-label="Difficulty"`, options from
    `allProfiles()` labelled by `levelName`), then `<p className="hint">` with
    `strengthProfile(level).detail`, then the trainer's second hint sentence: "The
    numbers on levels 4 and up are the engine's own scale, not an online rating."
  - `<fieldset><legend>Play as</legend>` with two radios, "White" and "Black", and
    one `<p className="hint">Applies to the next new game.</p>`.
  - `<fieldset><legend>Board</legend>` with two radios, "Small" and "Large".
  - A row `div.sidebar-files` with two buttons "Save game" and "Load game", both
    `disabled` with a comment naming phase 5.
  - `<MoveList moves={moves} />`.
  The select's `onChange` calls the level setter AND `game.setLevel`; do that in
  `Shell`, not in `Sidebar`, so `Sidebar` knows nothing about the game.
- [ ] `Screen.tsx` renders `<Sidebar ... />` in the `aside` instead of the bare list;
  it takes the settings from `Shell` as props.
- [ ] CSS in `play.css`: the trainer's `.play fieldset`, `.play legend`, `.play
  fieldset label`, `.play input[type='radio']` and `.play select` rules
  (`London/src/ui/play.css` lines 11 to 48 on 2026-09-11), copied with the `.play`
  prefix changed to `.sidebar`, and the select's `margin: 6px 0 0 24px` changed to
  `margin: 6px 0 0` with a comment (the trainer indents it under a radio; here it is
  the fieldset's only control). `.hint` from `London/src/ui/study.css` line 177,
  identical text. `.sidebar-files { display: flex; gap: 8px }`. Every button in the
  app at least 36 px tall for a finger (spec 4.4): one rule on `button`
  (`min-height: 36px`) in `app.css`, with the comment.

### 3.5 Play as Black

- [ ] Already supported by the session and the provider. Wire it: New game reads the
  side hook. The board's `orientation` already follows `session.userColour`.
- [ ] `src/test/board-stub.tsx` gains `data-orientation={orientation}` so a test can
  see which way up the board is; its origin line becomes `adapted: data-orientation
  added`. `src/test/dom.tsx`'s `board()` returns `orientation` too.
- [ ] DOM test (spec S15 item 9, the bar half waits for phase 4): "playing Black, the
  engine moves first after New game and the board is the other way up": choose
  Black, New game, the list shows one move, the board's orientation is `black`, and
  the stub's move buttons are the user's Black moves.

### 3.6 The fit rule and the large board

- [ ] `src/ui/board-size.ts` gains `fitBoardSize(wanted: number, viewportWidth:
  number, viewportHeight: number, narrow: boolean): number`, pure, with named
  constants beside it and a comment giving the arithmetic:
  - `CHROME_ABOVE = 81` (padding 24 + the header, measured 80.67 in phase 2),
    `CHROME_BELOW = 110` (gap 12 + buttons 37.33 + gap 12 + status 24 + padding 24,
    measured 109.33), `CHROME_BESIDE_WIDE = 396` (padding 48 + bar 24 + gap 20 +
    gap 24 + sidebar 280), `CHROME_BESIDE_NARROW = 92` (padding 48 + bar 24 + gap
    20). Round the measured values UP, so the rule never claims a pixel it does not
    have.
  - The answer is the largest multiple of 8 that is at most `wanted`, at most
    `viewportWidth - beside`, and at most `viewportHeight - CHROME_ABOVE -
    CHROME_BELOW`, and never below `BOARD_SIZE`.
  - String tests (spec S15 item 11): 1280 by 1000 wide gives 808; 1180 by 820 wide
    gives 624 (820 - 191 = 629, down to 624); 820 by 1180 narrow gives 728; 1600 by
    1200 gives 832; a tiny viewport gives 416; the small size is always 416 (the
    caller passes `wanted = 416`).
- [ ] `src/ui/use-board-pixels.ts`: `useBoardPixels(size: BoardSizeName): number`.
  Reads `window.innerWidth` and `innerHeight` in state, listens to `resize` and
  `orientationchange`, and returns `fitBoardSize(size === 'large' ? BOARD_SIZE_LARGE
  : BOARD_SIZE, width, height, width < NARROW_BELOW)`. `NARROW_BELOW = 900` lives in
  `board-size.ts` beside the other numbers and is the same number as the CSS
  breakpoint; the comment says the two must move together.
- [ ] `Screen.tsx` passes the hook's pixels to the `Board`, and the `.live-eval`
  stretches with it as it does now. The move list grows with the sidebar, which is
  already `align-self: stretch`.
- [ ] Changing the size mid-game changes nothing about the game: the provider is not
  involved. Say so in the notes after checking it in the pane.

### 3.7 The narrow layout and the iPad edges

- [ ] `play.css`: `@media (max-width: 899px)` puts `.play-body` in a column
  (`flex-direction: column`), the sidebar at `width: 100%` and `align-self: auto`,
  and the move list at a fixed height of ten rows (`height: calc(10 * 1.45em)`, the
  trainer's row arithmetic, with `flex: none`). Comment: the same 900 as
  `NARROW_BELOW`.
- [ ] `app.css`: `.app` padding becomes `max(24px, env(safe-area-inset-top))
  max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom))
  max(24px, env(safe-area-inset-left))`, Conquest's `.board-page` rule (its
  `styles.css` lines 55 to 58 on 2026-09-11) with 24px in place of 1rem, and its
  comment about the rounded corners and the home indicator.

### 3.8 The controls

- [ ] `PlayControls.tsx`: New game gets `disabled={thinking}` (ruling 1).
- [ ] `play-context.tsx`: delete `reset` if nothing calls it after this phase
  (ruling 2); update `PlayGame` and any comment that named it.

### 3.9 Tests, all together

- [ ] DOM: "every setting is remembered across a restart" (spec S15 item 8): set level
  6, Black, Large; `cleanup()`; `renderApp()`; the select reads 6, Black is checked,
  Large is checked. Use the trainer's `restart` helper shape from its
  `remembered-settings.dom.test.tsx` (`cleanup()` then `renderApp()`).
- [ ] DOM: "a level change reaches the engine before its next move": a recording
  `fakeEngine` whose `setStrength` pushes each profile's `uciElo`; choose "6. Strong
  club" in the select; the last recorded profile has `uciElo` 1750 before the next
  `move` button is pressed.
- [ ] DOM: "New game is disabled while the engine thinks" (in the held-search test).
- [ ] The two remembered-game tests of 3.3, the Play as Black test of 3.5, the fit
  tests of 3.6, the storage tests of 3.1 and 3.2.
- [ ] Every DOM test that changes storage relies on `dom-setup.ts` clearing it
  between tests; do not clear by hand.

### 3.10 Prove it in the pane

- [ ] `npm run dev` on 5185, header v0.1.0. At 1280 by 1000: the sidebar shows the
  three fieldsets and the two greyed file buttons above the list. Change the level
  to 6 mid-game; `window.__game` shows the new profile before the engine's next
  move (read the private field through the dev handle, or watch the `movetime`;
  say which). Choose Black and New game: the engine opens, the board is upside
  down (`window.__cg.state.orientation` is `black`). Choose Large: the board becomes
  808 (`cg-board` 808 by 808, the bar 808 tall), the sidebar 808 + the column's extra
  height. Reload the page: the game, the level, the side and the size are back.
- [ ] At 1180 by 820: Large gives 624; no sideways scroll.
- [ ] At 820 by 1180: the sidebar is under the board column at full width, the list
  ten rows tall and scrolling, Large gives 728; no sideways scroll.
- [ ] Both themes at 1280 by 1000. Record every probe number (`.live-eval`, `.board`,
  `cg-board`, `.sidebar`, `scrollWidth` against `innerWidth`) per viewport and size.
  Clear the pane's `localStorage` afterwards.

### 3.11 Close

- [ ] `npx vitest run` both projects green under twenty seconds; counts and time in
  the notes. `tsc -b` clean, `npx oxlint` silent, `npm run build` clean.
- [ ] Copies diffed and listed. No forbidden words in adapted or new files. No pixel
  number in a `.ts` or `.tsx` other than `board-size.ts`.
- [ ] Reuse and duplication review, then commit.

## Decision rules

- **A remembered game whose level or side disagrees with the stored settings**: the
  game wins and the settings are set to it (3.3). Say so in the notes.
- **The engine is mid-search when the page is reloaded**: the stored game is whatever
  was last written, which is the position before the reply; on reload the provider's
  `start` sees the engine to move and plays it. That is correct and needs no
  special case. If you find it is not, stop and record.
- **The narrow layout at 820 wide leaves the board wider than the sidebar wants**:
  the sidebar is full width in the column layout, so nothing has to agree. If the
  page still scrolls sideways, the cause is a fixed width somewhere; find it, do not
  add `overflow: hidden`.
- **Something a person would see is not specified** (wording, an order of fieldsets
  other than the spec's, a colour): stop and ask Nick. Code shape: decide and say
  why.
- **A contradiction** between chip, plan, spec and copied code: stop that item, write
  it down, continue with the rest.

## Out of scope for this phase

The bar's value and number (phase 4), Hint (4), the promotion picker (4), Save and
Load (5; the buttons exist and are disabled), scenes and the probe file (6), the PWA
(7), Tauri (8).

## Acceptance

Phase 3 of the plan, every box ticked as it lands: the three settings and the game
survive a reload in the pane and a remount in the tests; the large board is 808 at
1280 by 1000, 624 at 1180 by 820 and 728 at 820 by 1180 with no sideways scroll at
any of them; Play as Black opens with the engine's move on a flipped board; a level
change reaches the engine's next move; New game is disabled while thinking; `reset`
is gone or used; every probe number recorded; suite green under twenty seconds;
`tsc -b` clean; `../London` and `../Conquest` untouched.

## Conventions

- Tick the plan's phase 3 boxes as you go. Append "Phase 3 - builder notes" under the
  plan's "Phase notes" after the gate 2 findings: measured, decided, asked, the reuse
  review's find, left. Update the Progress table row.
- The reuse review's likely finds this phase: a second try-catch around storage (the
  one home is `prefs.ts`'s `read` and `write`); a second place that knows the stored
  game's shape; the number 900 written twice without the comment tying them; a
  second "level 1 to 8" check.
- One commit at least, on `main`. Short imperative subject, a body that says why. End
  the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, naming the
  model you actually are. Write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours.

## Cleanup

Stop the dev server. Report the commit hash, the test counts and time, the probe
numbers per viewport and size, and anything the decision rules made you skip.
