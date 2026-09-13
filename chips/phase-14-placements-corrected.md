# Chip: phase 14 - the three placements, corrected

You are the builder session for Simply Chess, in `C:\Users\nick2\Code\SimpleChess`, on
`main`, no worktree, no remote (never push, never create one). Your context may have
been compacted: rely on nothing you remember about this code. Read, in this order,
before the first edit:

1. `CLAUDE.md` in this folder.
2. `docs/simple-chess-spec.md` **section 19**, all of it. **Q27 corrects Q23 and S19 is
   already written as Q27 leaves it**, so S19 and the 19.1 diagram are what you build
   to. Then 18.1, whose header this phase brings back.
3. `docs/simple-chess-build-plan.md`: "Rules for the builder", phase 14's boxes, the
   phase 13 notes and the gate 13 findings under them.
4. `src/ui/App.tsx`, `src/ui/SettingsRow.tsx`, `src/ui/PlayControls.tsx`,
   `src/ui/Screen.tsx`, `src/ui/app.css`, `src/ui/play.css`.
5. **The same files one commit before phase 13**, which is `fccab21`: `git show
   fccab21:src/ui/app.css` and `git show fccab21:src/ui/App.tsx`. That is the header
   this phase restores, and restoring is what 14.1 asks for rather than rewriting.

## Why this phase exists

Nick used 1.2.0 and corrected three placements. His words:

> I didn't mean for you to move the Large/Small and Light/Dark toggles, I liked them
> where they were. The "New Game" button should be next to the Play As White/Black
> toggles since they are associated. Move the left/right stepping arrow button one row
> up to the Undo/Redo/Hint line, right justified to the bottom right of the board.

Phase 13 read "all the button controls and toggles" as including the two view toggles.
It did not. Everything else about 1.2.0 stands: the report keeps the side panel, it
keeps the head row's colour, and the selector row stays left aligned.

## Where things stand

1.2.0 is built, gated (`6d43dfa`) and its installer made. 324 tests green in 9.2
seconds. Today's four rows under the board are:

1. New game, Undo, Redo, Hint
2. Stop and review and Stop and discard, or Keep playing, Play from here and the two
   arrows once a report is showing
3. Save game, Load game
4. Play as and its radios, then the board size and theme toggles at the right-hand end

and the header is the name and the version alone.

**After this phase** (spec S19, as Q27 leaves it):

1. Undo, Redo, Hint, then the two arrows at the right-hand end
2. Stop and review and Stop and discard, or Keep playing and Play from here
3. Save game, Load game
4. New game, then Play as and its radios

with the two toggles back at the right of the header.

**The row count does not change, so the board does not change size.** Four rows before,
four rows after: `CHROME_BELOW` stays 224 and the large board stays 584 at 1400 by 980,
576 at a display scale of 1.25 or 1.5. If a measurement says otherwise, something has
gone wrong in the rows and you should stop and say so. **Do not touch `board-size.ts`.**

**Widths, measured at the small board, which is the 416 px one every row must fit:**
New game 102, Undo 65, Redo 62, Hint 56, Stop and review 142, Stop and discard 144, Save
game 103, Load game 105, Play as with its two radios 184 laid out inline, each arrow 38.
So row one becomes about 199 plus the arrows at the far end, and row four about 294.
Both fit with room to spare.

## Settled decisions

- **The header is restored, not rebuilt.** `.app-nav`, `.nav-link`, `.nav-link:hover`
  and `.theme-toggle` come back to `app.css` exactly as `fccab21` has them, and the nav
  markup comes back to `App.tsx` the same way. Nick liked what was there; the way to
  give him that is the bytes that were there. Their `Origin:` and comment lines come
  back with them. `--surface-hover` in `index.css` has a user again as a result, which
  phase 13's notes recorded as newly unused.
- **The toggles' behaviour and wording do not change**: each reads the size or the theme
  it would switch TO, the size one first, with the same `title` and `aria-label`
  sentences. Those sentences live in one place; they moved to `SettingsRow` in phase 13
  and they move back with the buttons, still written once.
- **`SettingsRow` keeps its file and its name** and becomes New game and Play as. It is
  still the row that says what the NEXT game will be, which is what its name means.
  Its comment says so rather than describing settings in general.
- **The arrows keep `.play-steps` and its shared `margin-left: auto` rule.** That rule
  now has one user again rather than two; leave the rule as it is and let the selector
  list shrink. Do not rename it.
- **New game keeps everything else about itself**: the same text, the same disabled rule
  while the engine thinks (ruled at gate 2), the same handler.
- **Nothing else on the screen moves.** The report, its colour, the selector row's
  alignment, the move list, the head row and the panel are 1.2.0's and stay.
- **No headless browser on this machine, ever.** Clear the pane's `localStorage` after
  every drive.

## The work

- [ ] 14.1 The two toggles back in the header, restored from `fccab21` (14.1's boxes in
      the plan name the four CSS rules and the markup).
- [ ] 14.2 New game from row one to row four, at the row's left edge, before Play as.
- [ ] 14.3 The two arrows from row two to row one, right justified with the existing
      rule, so they end at the board's bottom right corner. They still show only while a
      report is showing.
- [ ] 14.4 Tests: **S15 item 23** (the arrows are in the first row under the board and
      the two toggles are in the header), and items 20 and 22 updated to say "every
      control except the two view toggles". `remembered.dom.test.tsx` and
      `viewer.dom.test.tsx` hold items 20 and 22 today; `shell.dom.test.tsx` presses the
      theme toggle and will find it in the header again, which may put back the line
      phase 13 added to it.
- [ ] 14.5 Driven in the pane at 1400 by 980, both board sizes, both themes, both states
      of row two, with the probe: S16's two numbers hold, no row is wider than the
      board, the arrows sit at the board's right edge in the first row, and **the board
      measures the same as 1.2.0's** (584 large, 416 small at this viewport). Record the
      rows in the notes as phase 13 did.
- [ ] 14.6 **Version 1.2.1** in `package.json`, `src-tauri/tauri.conf.json` and
      `src-tauri/Cargo.toml`. Docs swept: spec 19.1's diagram is already right, so check
      it rather than change it; `docs/acceptance.md` item 1 and its screen description;
      `README.md`; `CLAUDE.md`'s current state; the plan's phase 14 notes and boxes.
      Reuse review, commit, then **build the installer**: `export
      PATH="$HOME/.cargo/bin:$PATH"` and `npx tauri build`, and record the path and size
      of `Simply Chess_1.2.1_x64-setup.exe` and of `simply-chess.exe` in the notes.

## Decision rules

- **If a row will not fit at 416**, say so in the notes with the measurement rather than
  shrinking anything. It should: the widths are above and both new rows are well under.
- **If the board changes size**, stop: the row count has not changed, so the only way
  that happens is a row that is taller than the three beside it, which is a fault in the
  new markup rather than a reason to touch `board-size.ts`.
- A test that finds a control by its name keeps working wherever the control sits. A
  test that reaches through an ancestor is the one to update, and updating it means
  naming the new home, not deleting the assertion.
- Anything a person would see or feel that neither section 19 nor this chip settles:
  ask Nick, do not guess.

## Out of scope

What any control does. The report, its colour and its place. The selector row. The
chrome constants. The move list, the head row, the board.

## Acceptance

`npx vitest run` green under twenty seconds with nothing skipped; `tsc -b` clean;
`npx oxlint` silent; `npm run build` clean. The two toggles are in the header and look
exactly as they did in 1.1.0; New game is beside Play as; the arrows end the first row
under the board at its bottom right corner; the board is the same size as 1.2.0's.
1.2.1 in the three files and in the header. The installer built and its size recorded.
Every box ticked or its gap written down.

## Conventions

Commits on `main`, short imperative subject, a body that says why, ending with
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` (name the model you actually
are). Write the message to a scratch file and `git commit -F` it. Stage explicit paths,
never `git add -A`, never `git clean`. No em dashes under `src/`. Australian English.
Spec section 3's words. Nick's own files are not listed or reported. Never push.
