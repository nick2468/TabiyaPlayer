# Chip: phase 5 - save game and load game

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`. Your
context may have been compacted since phase 4; Nick decides that each time. **Do not
rely on what you remember of phases 0 to 4.** Read fresh, in this order, before
touching a file: `CLAUDE.md`; `docs/simple-chess-spec.md` sections 3, 5.4, 8, 9 (all
of it, 9.2 as amended at gate 4), 10, 13 and 14; the plan
`docs/simple-chess-build-plan.md` "Rules for the builder", "Standing discipline",
phase 5, and the phase 4 notes with the gate 4 findings at the end; then
`docs/testing.md`. Everything below is compressed from those; where this chip and
the spec disagree, the spec wins and you say so in the phase notes.

**Goal: a game leaves the app as a PGN file and comes back the same, on both
platforms.** Version stays 0.1.0.

## Where things stand

Phases 0 to 4 are committed and passed review (phase 4 is `76e73fa` and `6762176`).
The game plays with the bar's number, the hint and the promotion picker. The sidebar
has "Save game" and "Load game" buttons, both disabled with a comment naming this
phase. The provider (`src/ui/play-context.tsx`) has `start(options)` with
`startMoves`, which replays a move list, evaluates the final position, and lets the
engine move when it is its turn; `Shell` (`src/ui/App.tsx`) uses exactly that to
reopen the remembered game and sets the level and side hooks to the game's own.
`src/model/pgn.ts` (identical to the trainer's) has `parsePgn`, `Movetext`,
`pgnTag` and `escapeTag`. `src/play/replay.ts` has `canReplayMoves`. `src/play/
session.ts` has `fullMove`. `src/storage/prefs.ts` has `levelOrNull` and `SIDES`.
183 tests green. The trainer is `C:\Users\nick2\Code\London`; you read and copy from
it and never change it.

## Rulings from gate 4 that bind you now

1. **No full scan on load.** Spec 9.2 is amended: a loaded game is evaluated at its
   final position, like a reopened one, and **undo and redo evaluate the position
   they land on when it has no number yet**. That covers the builder's phase 4 "left"
   item about reopened games too. The evaluation runs through the engine's queue
   without setting `thinking`: undo stays instant, and the number arrives a moment
   later. `scanGame` is NOT copied.
2. **The hint goes on Load game.** `start` already clears it, and Load goes through
   `start`, so nothing new is needed; say in the notes that you checked.
3. **Nick briefly saw the bar as solid black after phase 4** and then saw it right;
   it was a page served from before phase 4. Nothing to do, but if the bar ever
   shows no number and no white share, a stale page is the first suspect.

## Settled decisions you build on

- **The file** (spec 9.1), exactly:

  ```
  [Event "Simple Chess"]
  [Site "-"]
  [Date "2026.09.11"]
  [Round "-"]
  [White "You"]
  [Black "Stockfish level 4"]
  [Result "*"]

  1. d4 d5 2. Bf4 Nf6 3. e3 e6 {Stopped after move 3. White was played by you at
  level 4.} *
  ```

  `Event` the app name; `Site` and `Round` the standard's "-"; `Date` from the
  trainer's `pgnDate`; `White` and `Black` are "You" and "Stockfish level N"; `Result`
  from the trainer's `pgnResult`; one closing comment (the outcome sentence when the
  game ended, else "Stopped after move N", then "White was played by you at level N."
  with full stops between, as the trainer joins them); the result token last; the
  movetext written by the trainer's `Movetext`. Default file name
  `simple-chess-YYYY-MM-DD-HHMM.pgn`.
- **Loading** (spec 9.2): the trainer's `parsePgn`; the first game's main line;
  variations and comments ignored; a file whose moves do not make a legal game is
  refused with a message and the current game is untouched; the side is Black when
  the `Black` tag is "You", else White; the level is the N in "Stockfish level N"
  when it is 1 to 8, else the current level stays; the loaded game replaces the
  current one with no confirmation and its side and level become the settings; the
  engine moves at once if it is to move.
- **Where the file goes** (spec 9.3): the trainer's `backup.ts` pattern. Desktop: the
  Tauri save and open dialogs with a `.pgn` filter, `writeTextFile` and
  `readTextFile`. Browser and iPad: a blob download, and a hidden `<input
  type="file" accept=".pgn">`. Both buttons disabled while the engine thinks.
- **Copy per spec S3**; `user` words in adapted files; Tauri imported lazily behind
  `isDesktop()` (spec S14); screenshots looked at and measured, no files, no
  headless browser; clear the pane's storage at the end.

## The work

### 5.1 Writing the file

- [ ] `src/play/game-pgn.ts`, adapted from `London/src/play/game-pgn.ts`:
  `export interface GameForPgn { moves: PlayedMove[]; side: Colour; level: number;
  outcome?: string; at: string }` and `gameToPgn(game): string` producing spec 9.1's
  text. `pgnDate(at)` and `pgnResult(outcome, side)` identical text (the trainer's
  `pgnResult` reads the outcome sentences this app also uses, unchanged). The
  closing comment is built the trainer's way: an array of sentences joined with
  ". " and a final full stop; the sentences are `outcome ?? \`Stopped after move
  ${fullMove(moves.length - 1)}\`` and `\`${colourName(side)} was played by you at
  level ${level}\``. No hint comment, no slips, no deviation. Origin line says what
  was cut.
- [ ] `saveFileName(at: string): string` beside it: `simple-chess-` plus the local
  date and time as `YYYY-MM-DD-HHMM` plus `.pgn`. Pad with zeros. A test with a
  fixed `at`.
- [ ] `src/play/game-pgn.test.ts`: the spec 9.1 example reproduced exactly from six
  moves at level 4 with no outcome (build `PlayedMove`s through a `PlaySession` with
  `startMoves`, or by hand); a mated game gives `1-0` and the outcome sentence in
  the comment; a game as Black gives `[White "Stockfish level 4"]` and `[Black
  "You"]`; the trainer's `pgnDate` and `pgnResult` tests copied from its
  `game-pgn.test.ts` where they apply.

### 5.2 Reading the file

- [ ] `src/play/load-pgn.ts`, new: `loadPgn(text): { sans: string[]; side: Colour;
  level: number | null } | { error: string }`. Steps, in order: `parsePgn(text)`; if
  `errors.length > 0`, the error is the first one's message (it already reads as a
  sentence); if `games.length === 0`, "That file has no game in it"; the main line
  is `games[0].moves.map((move) => move.san)`; if it is empty, "That file has no
  moves in it"; if `!canReplayMoves(sans)`, "That file's moves do not make a legal
  game"; side from the `Black` tag being exactly "You"; level from the other
  player's tag matching `/^Stockfish level (\d+)$/` through `levelOrNull`, else
  null. Origin line naming the trainer's parser as the reader.
- [ ] `src/play/load-pgn.test.ts` (spec S15 items 5 and 6): the round trip (a game
  through `gameToPgn` then `loadPgn` gives the same SANs, side and level, for a
  White game and a Black game); a foreign PGN with a variation and comments loads
  its main line as White with level null; an illegal move list is refused with the
  message; text that is not PGN is refused with the parser's message; an empty
  string is refused; a file with tags and no moves is refused.

### 5.3 Where the file goes

- [ ] `src/storage/paths.ts`: `isDesktop()` only, identical text from the trainer's
  `paths.ts` (the `__TAURI_INTERNALS__` check) with an origin line. `LOCAL_FOLDER`
  waits for phase 8, which needs it.
- [ ] `src/storage/files.ts`, adapted from `London/src/ui/backup.ts`: `savePgn(text:
  string, name: string): Promise<{ message: string | null }>` (desktop: the save
  dialog with `defaultPath: name` and the `.pgn` filter, `writeTextFile`, message
  `Saved to ${path}`; cancelled: null; browser: the blob download with
  `application/x-chess-pgn` as the trainer's `saveBundle` uses, message "Saved to
  your downloads folder"), and `openPgn(): Promise<{ name: string; text: string } |
  null>` (desktop: the open dialog and `readTextFile`; browser: a hidden `<input
  type="file" accept=".pgn">` appended to the body, clicked, resolved on `change`
  with `file.text()`, resolved null on `cancel`, and removed afterwards). One
  `fileName(path)` helper from the trainer's `bundles.ts`. Every Tauri import is
  `await import(...)` behind `isDesktop()`.
- [ ] No unit test can drive a dialog or a download; the DOM tests below mock this
  module. Say so in the notes.

### 5.4 The provider

- [ ] Undo and redo evaluate the position they land on when it is not in the map
  (ruling 1): after `running.undo()` succeeds, `void evaluate(engineRef.current,
  running.fen, setup.level).then(refresh)` guarded on the engine existing; likewise
  redo. No `thinking`. `evaluate` already skips a known position, so a game played
  forward costs nothing extra. Test in `play-game.dom.test.tsx` or a new file: with
  a seeded game of four plies and an engine that counts its analysis searches, Undo
  triggers exactly one more evaluation and the bar's number changes to that
  position's.
- [ ] No `load` method. `Shell` loads through `start` with `startMoves`, exactly as it
  reopens the remembered game (a shared local function in `Shell`, `startFrom(sans,
  side, level)`, used by both, so the two cannot drift).

### 5.5 The screen

- [ ] `Sidebar.tsx`: the two buttons take `onSave`, `onLoad` and `thinking`
  (`disabled={thinking}`), the comments naming phase 5 go.
- [ ] `Shell` (`App.tsx`): `save` builds `gameToPgn({ moves: session.moves, side,
  level, outcome: session.outcome, at: new Date().toISOString() })` and calls
  `savePgn(text, saveFileName(at))`; `load` calls `openPgn()`, then `loadPgn(text)`;
  on success `startFrom(sans, side, level ?? current level)`; on `{ error }` or a
  save message, a notice is shown for three seconds (the trainer's `CopyGame`
  timing). One `notice` state `{ text: string; bad: boolean } | null` in `Shell`,
  cleared by a timer; rendered under the status line through the existing
  `EngineError` component, renamed `Notice` with a `bad` prop (one component for
  every message under the board; the engine error passes `bad`). Say in the notes
  that `EngineError` was renamed, and update its uses.
- [ ] A game with no moves can still be saved (the file has no moves and "Stopped
  after move 1" is wrong for it): say "Stopped before the first move" in that case,
  and test it. It is the one case the trainer never meets.

### 5.6 Tests

- [ ] `src/ui/files.dom.test.tsx`, new, with `vi.mock('../storage/files')` providing
  `savePgn` and `openPgn` as `vi.fn()`: "Save game hands the game's PGN to the file
  writer" (play 1.d4 and the reply, click Save game, the mock received text
  starting `[Event "Simple Chess"]` and containing `1. d4`, and a name matching
  `/^simple-chess-\d{4}-\d{2}-\d{2}-\d{4}\.pgn$/`); "Load game replaces the game with
  the file's moves, side and level" (the mock resolves a Black game at level 6;
  after the click the list shows the moves, the Black radio is checked, the select
  reads 6, the board orientation is black, and the remembered game in storage is the
  loaded one); "a bad file is refused and the current game is untouched" (the mock
  resolves junk; the notice reads the message; the list is unchanged); "cancelling
  the dialog changes nothing" (the mock resolves null); "Save and Load are disabled
  while the engine thinks" (the held engine).
- [ ] The phase 4 checkmate and status tests keep passing.

### 5.7 Prove it in the pane

- [ ] `npm run dev` on 5185, header v0.1.0, storage cleared first. Play a few moves.
  Press Save game: the pane may refuse the download; if it does, read the text
  another way (a `console.log` is not acceptable in shipped code; instead check the
  `savePgn` call by watching the network or the console for the blob URL, or trust
  the DOM test and say so). The notice "Saved to your downloads folder" shows for
  three seconds and goes.
- [ ] Load game needs a real file chooser, which the pane cannot drive. Confirm the
  button opens the chooser (the hidden input receives a click: watch it with a
  `MutationObserver` or by checking the input exists during the call) and rely on
  the DOM test for the rest. Say so in the notes. The desktop path is proved in
  phase 8 with the real dialogs.
- [ ] Undo into a position that had no number: the bar's number changes within a
  moment of the undo, with no "thinking" state. Record what the status line and
  the buttons did during it.
- [ ] Both themes at 1280 by 1000: the two file buttons enabled and looking like the
  other buttons; the notice under the status line in the trainer's notice style.
  Record the probe. Clear storage.

### 5.8 Close

- [ ] `npx vitest run` both projects green under twenty seconds; counts and time.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean (the browser bundle
  must not contain the Tauri plugins: check `dist/assets/*.js` for `plugin-dialog`
  and say what you found).
- [ ] Copies diffed and listed. No forbidden words in adapted or new files. No pixel
  number or colour in a `.ts` or `.tsx` other than `board-size.ts`.
- [ ] Reuse and duplication review, then commit.

## Decision rules

- **The browser refuses the file input's `cancel` event** (older browsers do not fire
  it): the promise then never resolves, which leaves nothing hanging but a closure.
  Acceptable; note it. Do not add a timeout.
- **A foreign PGN has a `FEN` tag** (a game from a set position): refuse it with "That
  file starts from a position this app cannot load", because the session always
  starts from the initial position. Test it.
- **A PGN with several games**: the first is loaded and the rest ignored, per spec
  S8. No message.
- **Something a person would see is not specified** (a wording, the notice's
  timing): stop and ask Nick. Code shape: decide and say why.
- **A contradiction** between chip, plan, spec and copied code: stop that item, write
  it down, continue with the rest.

## Out of scope for this phase

Scenes and the probe file (phase 6), the PWA (7), Tauri and the capabilities that
let the desktop dialogs run (8; the code paths exist behind `isDesktop()` and are
driven then).

## Acceptance

Phase 5 of the plan, every box ticked as it lands: the saved file reads as spec 9.1;
the round trip holds for both sides; a foreign file loads its main line; a bad file
is refused with the game untouched; undo into an unevaluated position gets a number
without a thinking state; the two buttons are live and disabled while thinking; the
browser bundle carries no Tauri plugin; suite green under twenty seconds; `tsc -b`
clean; `../London` and `../Conquest` untouched.

## Conventions

- Tick the plan's phase 5 boxes as you go. Append "Phase 5 - builder notes" under the
  plan's "Phase notes" after the gate 4 findings: measured, decided, asked, the reuse
  review's find, left. Update the Progress table row.
- The reuse review's likely finds this phase: a second "start a game from a move
  list" path beside the remembered game's (`startFrom` is the one home); a second
  notice component; a second date formatter (`pgnDate` and `saveFileName` share the
  padding; give it one helper if the same lines appear twice).
- One commit at least, on `main`. Short imperative subject, a body that says why. End
  the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, naming the
  model you actually are. Write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours.

## Cleanup

Stop the dev server. Clear the pane's storage. Report the commit hash, the test
counts and time, the probe numbers, and anything the decision rules made you skip.
