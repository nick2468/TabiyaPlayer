# Chip: phase 4 - the bar, the hint and the promotion picker

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`. Your
context may have been compacted since phase 3; Nick decides that each time. **Do not
rely on what you remember of phases 0 to 3.** Read fresh, in this order, before
touching a file: `CLAUDE.md`; `docs/simple-chess-spec.md` sections 3, 4.1, 5.2, 5.3,
6.3, 7, 8, 13 and 14; the plan `docs/simple-chess-build-plan.md` "Rules for the
builder", "Standing discipline", phase 4, and the phase 3 notes with the gate 3
findings at the end; then `docs/testing.md`. Everything below is compressed from
those; where this chip and the spec disagree, the spec wins and you say so in the
phase notes.

**Goal: the bar shows the engine's number and follows every move; Hint draws the
engine's move and says it; a pawn reaching the last rank asks which piece.** Version
stays 0.1.0.

## Where things stand

Phases 0 to 3 are committed (`4c01e5a`, `17c8321`, `35584e1`, `110de96`, `09cbac6`)
and passed review. A game plays on screen with the sidebar's three settings, all
remembered with the game in progress; the large board fits the screen. The provider
(`src/ui/play-context.tsx`) has `start`, `play(from, to, promotion?)`, `undo`,
`redo`, `setLevel`, an empty `evaluations` map typed `Map<string, Evaluation>`, a
`hint` field always null, and comments marking where phase 4's `evaluate` goes in
`play`. `src/play/evalbar.ts` has `Evaluation { pawns, text }`, `evaluationOf(score,
sideToMove)`, `evalText`, `evalShare`, `evalBarLayout(pawns, userColour)` and
`shownEvaluation`. `src/play/hint.ts` has the `Hint` type only. `Screen.tsx` draws
`.live-eval` as an empty box. `PlayControls` has Hint disabled with `canHint={false}`.
`src/model/position.ts` has `isPromotion(fen, orig, dest)`; `sanForMove(fen, from, to,
promotion = 'q')` takes the letter. 162 tests green. The trainer is
`C:\Users\nick2\Code\London`; you read and copy from it and never change it.

## Rulings and findings from gate 3 that bind you now

1. **`theme.ts` uses `prefs.ts`'s `read` and `write`** instead of its own try-catch.
   It is already an adapted file; spec S13 says `src/storage` is the only place that
   touches storage. One small commit of its own, or part of this phase's, your call;
   say which.
2. **`scriptedEngine` must not answer the bar's or the hint's searches from its
   script.** Phase 4 adds two more kinds of search (the bar's after every move, the
   hint's on request), and a script that answered them would play the engine's
   moves into the bar. Tell them apart by the PROFILE the provider sets before each
   search: the analysis profile is level 8 at 150 ms and no playing level is (level
   3 is 150 ms but is not level 8). See 4.1.
3. **Clear the pane's `localStorage` when the drive is done**, and say so in the
   notes. Gate 3 opened the pane on the builder's 22-move game.

## Settled decisions you build on

- **The analysis profile** (spec 6.3): level 8, one candidate, 150 ms, the trainer's
  `analysisProfile()`. Every evaluation and every hint search uses it, and the playing
  profile is put back in a `finally`, for the trainer's reason: the engine is one
  worker with a promise queue, and a search that threw without the restore would leave
  the opponent playing the rest of the game at level 8.
- **The bar** (spec 7): 24 px wide, board height, White's share `50 + 50 *
  tanh(pawns / 3)` in `--piece-white` over `--piece-black`; the user's colour at the
  bottom; holds its last value while the engine thinks (`shownEvaluation`); level
  with no number before the first evaluation; the number in the larger share at that
  share's outer end, 10 px bold tabular, in the other piece colour; accessible name
  "Evaluation: +0.4" or "Evaluation: the engine has not looked yet".
- **Hint** (spec 8): only on the user's move while the game is going; 500 ms at the
  analysis profile; a blue arrow and "The engine suggests Nf3." under the status
  line; gone when anything moves the board. Not counted.
- **The picker** (spec 5.3): a pawn move onto the last rank shows four pieces of the
  promoting colour over the board; choosing completes the move; clicking elsewhere or
  Escape cancels and the pawn goes back; the engine is not asked until a piece is
  chosen.
- **Copy per spec S3**; `user` words in adapted files; no pixel numbers or colours
  in `.ts`/`.tsx`; screenshots looked at and measured, no files, no headless browser.

## The work

### 4.1 The analysis profile has one home

- [ ] `src/play/analysis.ts`, new: `export const ANALYSIS_MOVETIME = 150` (the
  trainer's `SCAN_MOVETIME`), `export const HINT_MOVETIME = 500`, `export function
  analysisProfile(): StrengthProfile` (the trainer's, from `play-context.tsx`:
  `{ ...strengthProfile(8), multiPv: 1, movetime: ANALYSIS_MOVETIME }`), and `export
  function isAnalysisProfile(profile: StrengthProfile): boolean` (level 8 and
  movetime `ANALYSIS_MOVETIME`). Origin line naming the trainer's provider. Exported
  from `src/play/index.ts`. A string test: the analysis profile is recognised, every
  one of the eight playing profiles is not.
- [ ] `src/test/scripted-engine.ts`: records the last profile given to `setStrength`;
  while it is the analysis profile, `search` answers with the first legal move and
  `cp: 0` WITHOUT touching the script; otherwise it answers from the script as now.
  The comment says why (finding 2 above). The phase 2 checkmate test must still pass
  unchanged.

### 4.2 The bar's value

- [ ] In `play-context.tsx`: `evaluate(running, fen, playing)` from the trainer,
  adapted: sets the analysis profile, searches `ANALYSIS_MOVETIME`, stores
  `evaluationOf(best.score, sideToMove(fen))` under `positionKey(fen)` in both the
  ref and the state map, restores `strengthProfile(playing)` in a `finally`, skips a
  position already in the map. No `bestMovesRef`: there is no report. `sideToMove` is
  `position.ts`'s; do not split the FEN by hand.
- [ ] `start` evaluates the starting position (after the engine's first move when
  the user is Black, so the bar answers the position the user faces). `play`
  evaluates after the user's move and again after the reply, in the trainer's order
  and for its reason (the bar answers the move just played before the reply lands).
  Undo and redo evaluate nothing: every position they land on is in the map.
- [ ] A remembered game that is reopened (phase 3's `startMoves`) is evaluated at its
  final position only, by `start`. Phase 5 brings the full scan for loaded files.
- [ ] `src/ui/EvalBar.tsx`: the trainer's `LiveEvalBar` from `Play.tsx`, adapted per
  spec S7. Props `{ evaluation: Evaluation | undefined; userColour: Colour }`.
  Renders `div.live-eval[role=img]` with the accessible name above, the
  `div.live-eval-white` at `layout.whiteShare`% from the right end (the trainer's
  `top`/`bottom` switch on `whiteAtBottom`), and when there is an evaluation a
  `span.live-eval-number` with `evaluation.text`, placed in the larger share: when
  White's share is at least 50 the number sits at White's outer end, else at
  Black's; its colour is the piece colour of the share it is NOT in. Work the
  placement out in a small pure function beside `evalBarLayout` in `evalbar.ts`
  (`numberPlacement(layout): { edge: 'top' | 'bottom'; onWhite: boolean }`) with a
  string test for the four cases, so the component stays markup.
- [ ] `play.css`: `.live-eval-number` (position absolute, left 0, right 0, text-align
  center, 10 px bold, `font-variant-numeric: tabular-nums`, `line-height: 1`, 2 px
  from its edge), `.live-eval-number.on-white { color: var(--piece-black) }`,
  `.on-black { color: var(--piece-white) }`. Colours only through the two piece
  variables.
- [ ] `Screen.tsx` replaces the placeholder box with `<EvalBar evaluation=
  {shownEvaluation(fen, session.moves, game.evaluations)} userColour=
  {session.userColour} />`.
- [ ] DOM tests: "the bar shows the engine's number after each move" with
  `fakeEngine({ cp: 40 })`: after 1.d4 (Black to move) the bar's name is
  "Evaluation: -0.4" and its text `-0.4`; after the reply (White to move) it is
  `+0.4`. The fake's `cp` is from the side to move, which is exactly the flip the
  bar must make. "the bar says the engine has not looked yet before the first
  evaluation" (an engine whose search is held, as the phase 2 status test does).
  "playing Black, White's share is at the top" (spec S15 item 9's second half:
  `.live-eval-white` has `top: 0px` after Play as Black and New game).

### 4.3 Hint

- [ ] `src/play/hint.ts` gains `engineHint(san): Hint` returning `{ san, text: "The
  engine suggests Nf3.", source: 'engine' }`. The trainer's second sentence about
  the repertoire ending does not exist here. String test.
- [ ] `play-context.tsx`: `askHint` from the trainer, the engine half only: refuses
  unless a session exists, it is the user's move, the game is going and nothing is
  thinking; sets `thinking`, sets the analysis profile, searches `HINT_MOVETIME`,
  turns the best move into SAN with `new Chess(fen).move(splitMove(best)).san`,
  sets `hint`, restores the playing profile in a `finally`. `canHint` in the value,
  the trainer's five conditions. `hint` is cleared where the trainer clears it: a
  move, undo, redo and start (New game).
- [ ] `Screen.tsx`: `PlayControls` gets `canHint={game.canHint}` and `onHint=
  {game.askHint}`; the board gets `shapes={hintShapes(game.hint, fen)}`, the
  trainer's `hintShapes` from `Play.tsx` reduced to the engine case (always
  `brush: 'blue'`), placed beside `squaresOf`; under the status line, when there is a
  hint, `<p className="hint-said engine">{game.hint.text}</p>`. CSS `.hint-said` and
  `.hint-said.engine` from `London/src/ui/play.css` lines 153 to 162 (2026-09-11),
  identical text, into `play.css`, with the board inset margin added the way the
  status line has it.
- [ ] DOM tests: "Hint draws the engine's move and says it" (`fakeEngine({ move:
  'g1f3' })` after 1.d4 d5: the stub's `data-shapes` reads `blueg1f3`, the sentence
  reads "The engine suggests Nf3."); "the hint goes when a move is played"; "Hint is
  disabled while the engine thinks and once the game is over" (the held-search
  engine, and the scripted checkmate).

### 4.4 The promotion picker

- [ ] `src/ui/PromotionPicker.tsx`, new. Props `{ colour: Colour; onChoose: (piece:
  'q' | 'r' | 'b' | 'n') => void; onCancel: () => void }`. Renders `div.promotion`
  over the board holding four `<button>`s named "Queen", "Rook", "Bishop", "Knight"
  (`aria-label`), each containing a chessground piece element: `<piece
  className="white queen" />` and so on, which the cburnett stylesheet already
  styles through `.cg-wrap piece.queen.white` (checked 2026-09-12 in
  `node_modules/chessground/assets/chessground.cburnett.css`). So the picker sits
  INSIDE a `.cg-wrap`-classed box of its own, or the selector will not match; say
  which you did. A click outside the four buttons and the Escape key call
  `onCancel`. Centred over the board, sized to the square size (`pixels / 8` each,
  passed as a prop, so the four squares look like board squares).
- [ ] `Screen.tsx`: `pending` state `{ from: string; to: string } | null`. The
  board's `onMove` checks `isPromotion(fen, from, to)`: when true it stores the pair
  and does not call `play`; otherwise `play(from, to)`. While `pending` is set the
  board is locked (`movableColor` undefined) and the picker renders inside
  `.play-board` over the board. Choosing calls `game.play(from, to, piece)` and
  clears `pending`. Cancelling clears `pending` and bumps a `revision` counter
  passed to the `Board`, whose `api.set` effect lists it in its dependencies so the
  fen is re-applied and the pawn goes back (chessground has already drawn the pawn
  on the last rank by the time `after` fires). `Board.tsx` is adapted already; add
  the prop with a comment saying why it exists.
- [ ] `play.css`: `.play-board { position: relative }` if it is not, `.promotion`
  absolute, centred over the board, a `--surface` background with a `--line-strong`
  border and the trainer's 6 px radius, the four buttons in a row with no gap.
- [ ] DOM tests (spec S15 item 2). A helper in `src/test/dom.tsx`, `seedGame(sans,
  side = 'white', level = 4)`, writes a remembered game under `simple-chess.game`
  before `renderApp`, so a test can start from any position. The promotion position:
  `['a4', 'b5', 'axb5', 'a6', 'bxa6', 'Nc6', 'a7', 'Nb8']`, White to move, where
  `axb8=Q`, `axb8=R`, `axb8=B` and `axb8=N` are all legal (checked with chess.js
  2026-09-12). The stub lists four `move axb8=…` buttons that all call `onMove('a7',
  'b8')`. Tests: "a pawn reaching the last rank asks which piece, and plays the one
  chosen" (click `move axb8=Q`, the four picker buttons appear, no move has been
  played, click "Knight", the list ends `axb8=N`); "cancelling the picker puts the
  pawn back" (Escape; the list is unchanged and the board's fen is the position
  before); "the engine is not asked until a piece is chosen" (a recording fake:
  no search between the click and the choice).

### 4.5 Prove it in the pane

- [ ] `npm run dev` on 5185, header v0.1.0, storage cleared first. At 1280 by 1000:
  the bar shows `0.0`-ish at the start; after a few moves it moves and the number
  changes sign with the position. Read `window.__game` and the map through the
  screen: the bar's `aria-label`, the number's text and its colour class. Confirm
  the bar's `.live-eval-white` height matches `evalShare` for the shown number.
- [ ] Hint: press it on your move; a blue arrow appears (`window.__cg.state.
  drawable.autoShapes` holds one shape with brush `blue`) and the sentence is under
  the status line; play a move and both are gone.
- [ ] Promotion: reach a promotion in the pane through the move seam if clicks do
  not register (phase 3's note), or through a seeded game in `localStorage` before a
  reload; open the picker, cancel, open it again and choose a rook; the list shows
  `=R`. Screenshot the picker open.
- [ ] Play as Black, New game: White's share of the bar is at the top.
- [ ] Both sizes, both themes at 1280 by 1000: the bar, `.board` and `cg-board` still
  end on the same pixel with the number drawn. Record the probe. Clear storage.

### 4.6 Close

- [ ] `npx vitest run` both projects green under twenty seconds; counts and time.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean.
- [ ] Copies diffed and listed. No forbidden words in adapted or new files. No pixel
  number or colour in a `.ts` or `.tsx` other than `board-size.ts`.
- [ ] Reuse and duplication review, then commit.

## Decision rules

- **Chessground's `after` fires with the pawn already drawn on the last rank.** That
  is expected; the `revision` prop is the answer for cancel. Do not try to intercept
  the move before chessground makes it.
- **The picker's piece images do not appear.** The cburnett selectors need a
  `.cg-wrap` ancestor and a `piece` element with both the colour and the role
  class. Check the rendered DOM against the stylesheet before changing anything
  else.
- **The fake engine's `cp` is from the side to move.** So is the real engine's. If a
  bar test reads the wrong sign, the fault is in the sign flip, not the test.
- **Something a person would see is not specified** (the picker's exact look beyond
  spec 5.3, a wording): stop and ask Nick. Code shape: decide and say why.
- **A contradiction** between chip, plan, spec and copied code: stop that item, write
  it down, continue with the rest.

## Out of scope for this phase

Save and Load (phase 5; the buttons stay disabled), the full scan of a loaded game
(5), scenes and the probe file (6), the PWA (7), Tauri (8).

## Acceptance

Phase 4 of the plan, every box ticked as it lands: the bar shows the number and holds
its value while the engine thinks; Play as Black flips it; Hint draws and says the
move and is disabled when it should be; the picker plays the chosen piece and cancels
cleanly; the scripted checkmate test still passes with the bar evaluating; `theme.ts`
uses the storage helpers; every probe number recorded; suite green under twenty
seconds; `tsc -b` clean; `../London` and `../Conquest` untouched.

## Conventions

- Tick the plan's phase 4 boxes as you go. Append "Phase 4 - builder notes" under the
  plan's "Phase notes" after the gate 3 findings: measured, decided, asked, the reuse
  review's find, left. Update the Progress table row.
- The reuse review's likely finds this phase: a second FEN-to-side split (use
  `sideToMove`); a second "set the analysis profile, search, restore" sequence
  (`evaluate` and `askHint` share the shape; if they share more than the shape, give
  it one home); a second place that turns a UCI move into SAN.
- One commit at least, on `main`. Short imperative subject, a body that says why. End
  the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, naming the
  model you actually are. Write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours.

## Cleanup

Stop the dev server. Clear the pane's storage. Report the commit hash, the test
counts and time, the probe numbers, and anything the decision rules made you skip.
