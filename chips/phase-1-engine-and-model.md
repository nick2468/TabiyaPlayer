# Chip: phase 1 - the engine and the model, copied

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`, and your
context has been compacted since phase 0. **Do not rely on what you remember of phase
0.** Read fresh, in this order, before touching a file: `CLAUDE.md`;
`docs/simple-chess-spec.md` sections 3, 5.4, 5.5, 6, 7, 9.1, 13 and 14; the plan
`docs/simple-chess-build-plan.md` "Rules for the builder", "Standing discipline",
phase 1, and the phase 0 notes with the gate 0 findings at the end. Everything below is
compressed from those; where this chip and the spec disagree, the spec wins and you
say so in the phase notes.

**Goal: every pure module the app needs is in place and tested, with no screen yet.**
After this phase `npx vitest run` covers the engine protocol, the levels, the position
helpers, the PGN reader and writer, the outcome sentences and the bar arithmetic. No
pixel changes. No screenshot. No version bump.

## Where things stand

Phase 0 is committed as `4c01e5a` and passed review (gate 0 findings in the plan). The
repo has the header with the theme toggle, two vitest projects (`string` in node for
`src/**/*.test.ts`, `dom` in jsdom for `src/**/*.dom.test.tsx`), `tsc -b` clean, and
the engine files in `public/engine/` (gitignored). The trainer is
`C:\Users\nick2\Code\London`; you read and copy from it and never change it.

Three things gate 0 ruled that bind you now:

- **No screenshot files, ever, and no headless browser on this machine.** Phase 1 has
  no screen anyway. The rule is in plan rule 7 and CLAUDE.md's hazards.
- **The evaluation entry is `{ pawns, text }`, not `{ pawns, score }`** (spec section
  7, corrected at gate 0): the engine reports a mate from the side to move, so the
  printed text has to be made where the side is known.
- **A copied test may need `/// <reference types="node" />`** at its top when it
  imports `node:fs`. `version.test.ts` needed it; the trainer's compiled only by
  accident. Say so in the origin line when you add it.

## The copy rule, restated (spec S3)

A file this app does not change is byte-identical to the trainer's plus one line at
the top of its header comment: `Origin: London src/engine/uci.ts, identical.` A file
this app adapts says `Origin: London src/play/evalbar.ts, adapted: <what changed>` and
its comments describe this app, never the trainer's phases, courses or "trainee". A
file with no header comment gets `// Origin: ...` and a blank line. Diff every copy
against its origin with the origin line removed before you commit, and list the result
in the phase notes as phase 0 did.

## The work

### 1.1 The engine, identical

- [ ] `src/engine/stockfish.ts`, `uci.ts`, `strength.ts`, `index.ts`, and
  `engine.test.ts`: identical, each with its origin line. `index.ts` re-exports what
  the trainer's does; nothing here is unused yet, because phase 2 imports all of it.
- [ ] Confirm `engine.test.ts` runs in the `string` project (it is `*.test.ts` and
  starts no worker).

### 1.2 The position and PGN modules, identical

- [ ] `src/model/position.ts` and `position.test.ts` identical.
- [ ] `src/model/chessjs.test.ts` identical: it pins what chess.js does, and this app
  leans on the same behaviour.
- [ ] `src/model/pgn.ts` and `pgn.test.ts` identical. Both halves are needed: the
  writer (`Movetext`, `pgnTag`, `escapeTag`) for Save game, the reader (`parsePgn`)
  for Load game, both in phase 5.

### 1.3 Types and board moves

- [ ] `src/model/types.ts`, adapted: keep ONLY `Colour`, `Brush`, `Shape` and
  `colourName` from the trainer's file, with their comments. Everything about
  chapters, nodes, courses and mistakes goes. The origin line says "cut to the
  four the board and the bar use".
- [ ] `src/model/moves.ts`, new file, origin line `London src/model/grade.ts, the two
  board-move helpers only`: `squaresForSan` and `sanForMove`, identical text
  (including `promotion = 'q'` as the default; phase 4 passes the picker's letter
  through it). The rest of `grade.ts` is drill grading and is not copied.
- [ ] `src/model/moves.test.ts`: the `sanForMove` and `squaresForSan` describes from
  `London/src/model/grade.test.ts` (lines 105 to 131 on 2026-09-11), text kept, with
  the one test name "promotes to a queen, which is all this repertoire needs" renamed
  to "promotes to a queen when no piece is given", because the reason changed.

### 1.4 The outcome sentences, identical

- [ ] `src/play/outcome.ts` identical: `outcomeOf`, `endingFromMoves` and
  `isCheckmateOutcome`. Keep all three even though nothing calls the third yet: an
  identical copy is worth more than a trimmed one, and it is four lines.
- [ ] `src/play/outcome.test.ts`, new (the trainer tests these through its session
  tests, which are not being copied): one test per sentence in spec 5.5 from a
  position that produces it, for both `studentColour` values where the sentence
  depends on it ("You won by checkmate" against "You were checkmated"); one for a
  game that has not ended returning `undefined`; two for `endingFromMoves` (a mated
  move list gives the sentence, an illegal list gives `undefined`). Build the
  positions with SAN move lists or FENs, and say in each test's name what the
  position is.

### 1.5 The bar arithmetic, adapted

- [ ] `src/play/evalbar.ts`, adapted per spec section 7 as corrected at gate 0:

  ```ts
  /** What the bar shows for one position. */
  export interface Evaluation {
    /** Pawns from White's point of view; a mate is plus or minus MATE_PAWNS. */
    pawns: number
    /** The string the bar prints: "+0.4", "-1.2", "0.0", "M5", "-M5". */
    text: string
  }
  ```

  - `evaluationOf(score: Score, sideToMove: Colour): Evaluation` builds one entry.
    `pawns` is `whitePovPawns(score, sideToMove)` from `src/engine`, unchanged.
    `text` is `evalText(score, sideToMove)`.
  - `evalText`: for a `cp` score, the pawns from White's point of view with one
    decimal and a sign: `+0.4`, `-1.2`. When the rounded value is zero print `0.0`,
    never `-0.0` (test it). For a `mate` score the engine's `moves` is from the side
    to move: positive means the side to move mates. White mates when `moves > 0` and
    White is to move, or `moves < 0` and Black is to move; print `M` and the absolute
    count, with a leading `-` when Black mates. `moves` of 0 means the side to move
    is already mated: the other side has the mate, print `M0` with that sign.
  - `evalShare(pawns)` and `evalBarLayout(pawns, userColour)` identical text. Rename
    the parameter `studentColour` to `userColour` here and nowhere else: this file
    is adapted, so its words are this app's (spec section 3).
  - `shownEvaluation(fen, moves, evaluations)` identical logic, but `evaluations` is
    `Map<string, Evaluation>` and it returns `Evaluation | undefined`.
  - `PlayedMove` does not exist yet (phase 2 puts it in `session.ts`). For this phase
    `shownEvaluation` takes `moves: { fen: string }[]`, which is all it reads, and
    phase 2's `PlayedMove` satisfies it without a change here. Say so in a comment.
- [ ] `src/play/evalbar.test.ts`: the trainer's tests adapted to the new shape, plus
  spec S15 item 4: `+0.4`, `-1.2`, `0.0` (from `cp: 3` and from `cp: -3`), `M5` and
  `-M5` from both sides to move, and the share for each (`evalShare(100)` is above
  99, `evalShare(-100)` below 1, `evalShare(0)` is 50).

### 1.6 Support

- [ ] `src/test/fake-engine.ts` identical.
- [ ] `src/play/index.ts` exporting `outcome.ts` and `evalbar.ts` in the trainer's
  style (named exports, types with `type`). Phase 2 adds the session.

### 1.7 Prove it

- [ ] `npx vitest run`: both projects green; record the file and test counts and the
  time. `tsc -b` clean. `npx oxlint` silent. `npm run build` still works.
- [ ] Every copy diffed against its origin with the origin line removed; the list in
  the notes, as phase 0's.
- [ ] `grep -rn "trainee\|repertoire\|course" src/` finds nothing in an adapted file.
  Identical copies may still say those words in their comments; list which do.
- [ ] Nothing under `src/engine`, `src/model` or `src/play` imports React or names
  `window` or `document`; the worker in `stockfish.ts` is the one exception. Confirm
  with a grep and say so.

## Decision rules

- **A copied file does not compile here.** Fix the copy in the smallest way and record
  the fault in the notes so the orchestrator carries it back. The likely case is the
  node types line above.
- **A copied test depends on a module you are not copying** (a course, a book, the
  report). Drop that test, name it in the notes, and say what still covers the
  behaviour. Do not copy the module to satisfy the test.
- **Something a person would see is not specified.** Nothing in this phase is
  visible; if you find yourself deciding such a thing, stop and ask Nick.
- **A contradiction** between this chip, the plan, the spec and the copied code: stop
  that item, write it under the phase notes, continue with what does not depend on
  it.

## Out of scope for this phase

The session (`session.ts`), the provider, the board, any component, the hint, the
scan, PGN writing for a game (`game-pgn.ts`), loading a game (`load-pgn.ts`), storage,
scenes. Phase 2 brings the session and the board; phase 4 the bar on screen; phase 5
the files.

## Acceptance

Phase 1 of the plan, every box ticked in the same sitting each item lands: the ten
source files and their tests present with origin lines; `npx vitest run` green in both
projects with the counts in the notes; `tsc -b` clean; every identical copy diffs
clean; no React or browser global in the three pure folders; no em dashes under
`src/`; `../London` and `../Conquest` unchanged by you.

## Conventions

- Tick the plan's phase 1 boxes as you go. Append "Phase 1 - builder notes" under the
  plan's "Phase notes" after the gate 0 findings: measured, decided, asked, the reuse
  review's find (say "nothing" if nothing), left. Update the Progress table row.
- Close with the reuse and duplication review before the commit. The likely find in
  this phase is a second FEN-to-side helper (`sideToMove` in `position.ts` is the one
  home; `fen.split(' ')[1] === 'b'` written anywhere else is a copy) or a second way
  of writing a score in pawns.
- One commit at least, on `main`. Short imperative subject, a body that says why. End
  the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, naming the
  model you actually are. Write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours: list, read and report nothing under his profile
  beyond what a step names.

## Cleanup

No server to stop. Report the commit hash, the test counts and time, the list of
identical and adapted files, and anything dropped under the decision rules.
