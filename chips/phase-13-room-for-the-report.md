# Chip: phase 13 - room for the report

You are the builder session for Simply Chess, in `C:\Users\nick2\Code\SimpleChess`, on
`main`, no worktree, no remote (never push, never create one). Your context may have
been compacted since phase 12: rely on nothing you remember about this code. Read, in
this order, before the first edit:

1. `CLAUDE.md` in this folder, all of it.
2. `docs/simple-chess-spec.md` **section 19**, which is this phase and wins over
   everything before it. Then 18.1 (the layout it replaces), 18.3, 18.4 and 18.5 (what
   the moved parts do, unchanged), and S2 in section 4 (the fit rule).
3. `docs/simple-chess-build-plan.md`: "Rules for the builder", "Standing discipline",
   phase 13's boxes, and the phase 9 notes, which measured the chrome constants you are
   about to change one of.
4. `docs/testing.md`, and `docs/acceptance.md` item 1, which you update.
5. The files: `src/ui/App.tsx` (the header and `.app-nav`), `src/ui/DifficultyRow.tsx`,
   `src/ui/SidePanel.tsx`, `src/ui/PlayActions.tsx`, `src/ui/PlayControls.tsx`,
   `src/ui/Screen.tsx`, `src/ui/board-size.ts`, `src/ui/app.css`, `src/ui/play.css`.

## Why this phase exists

Nick used 1.1.0 and asked for one thing: **the report should have the room.** Today the
side panel stacks Play as, the two file buttons and the two Stop buttons above it, so
the report starts **195.8 px down a 552 px column** (measured at 1400 by 980 with a
report showing: the panel's top is y 167 and the report's is y 362.8). Moving every
control out gives all of that back. His words: "Move all the button controls and toggles
to under the board in a sensible placement. Shift the game report up to occupy the
space." Section 19 is that, ruled.

## Where things stand

Version 1.1.0 shipped on 2026-09-13 (`4111938`), 324 tests green in 9.2 seconds. The
screen today is spec 18.1: the name and the two toggles in the header, a centred
Difficulty row, the head row, then the board with one button row under it and a second
row only while a report shows, the move list column, and the side panel holding Play as,
the files, the hint sentence and then the actions or the report.

**Measured in the pane at 1400 by 980, small board, which is what the new rows must fit
into.** The board is 416 wide and every row under it must be 416 or less:

| Control | Width |
|---|---|
| New game 102, Undo 65, Redo 62, Hint 56 | 309 with its gaps |
| Stop and review 142, Stop and discard 144 | 294 |
| Save game 103, Load game 105 | 216 |
| Large 64, Light 60 | 132 |
| Play as and its two radios, laid out inline | 184, measured with a shrink-to-fit probe |

So S19's four rows fit inside 416 with room to spare: 309, 294, 216, and 324 for the
settings row (184 + 8 + 132). The review
state of row 2 (Keep playing, Play from here, the two arrows) already fits, because it
is today's row two and is unchanged.

**The colours.** The report's words are `--text`, which computes to `rgb(230, 230, 230)`
in the dark theme at 16 px and weight 400. The head row's opening line is `--text-soft`,
`rgb(200, 204, 210)`, at the same 16 px and 400. S20 is that one substitution and
nothing else.

**The constants.** `src/ui/board-size.ts` holds `CHROME_ABOVE = 167`, `CHROME_BELOW =
120`, `CHROME_BESIDE_WIDE = 607` and `CHROME_BESIDE_NARROW = 92`, measured in phase 9.
They are the only pixel numbers allowed in a `.ts` or `.tsx` (CLAUDE.md). **Only
`CHROME_BELOW` changes in this phase.**

## Settled decisions

- **S19's four rows, in its order**: the game; this game (the actions, or the review
  row once a report is showing); the file; the settings. The reason for the order is in
  the spec and the comments should carry it: what you reach for most is nearest the
  board, what you set once is furthest.
- **The two view toggles end the settings row** with `margin-left: auto`, exactly as the
  stepping arrows end row 2 today. One pattern, already in `play.css`.
- **`PlayActions` moves under the board with its sentence.** "You won by checkmate.
  Review it to see what it cost." goes where the other notices already are, under the
  buttons. It belongs with the buttons it introduces.
- **The side panel keeps the hint sentence and the report and nothing else** (Q24).
  During a game with no hint it is empty, and that is allowed: the screen is left
  weighted while you play and fills when there is something to read.
- **"Applies to the next new game." becomes the Play as control's `title`** (Q23, the
  same rule that moved the level's two sentences into the select's title in phase 9).
  There is no room for a sentence under a row.
- **The selector row is `justify-content: flex-start`.** Both it and the `h1` sit inside
  `.app`'s `--pad-left`, so that one word lines them up. Nothing else is needed and
  nothing else should be added.
- **The large board will get smaller and that is accepted.** Four rows under the board
  instead of two is more chrome below it, and the fit rule of S2 takes the height from
  the board. Measure the new `CHROME_BELOW` at the **large** board with a **report
  showing**, which is the state with the most rows, and record the new large board size
  in the notes so the number is on the record rather than a surprise.
- **Nothing above or beside the board moves**, so `CHROME_ABOVE` and the two beside
  constants are not touched. If a measurement says otherwise, stop and say so.
- **No new feature, no new words on screen** beyond the `title` move. Every button keeps
  its own text, its `title` and its behaviour.
- **No headless browser on this machine, ever.** Clear the pane's `localStorage` after
  every drive.

## The work

- [ ] 13.1 **The four rows under the board** (S19). `PlayControls` grows the file row
      and the settings row, or a small component per row if that reads better - your
      call, said in the notes, but one home for each row and no row built twice.
      `PlayActions` moves under the board as row 2's other state. Every row is the
      width of the board at both sizes.
- [ ] 13.2 **The side panel is the hint sentence and the report.** `SidePanel.tsx`
      either goes or becomes what it now is; say which and why. `Screen.tsx` composes
      the panel with the report at the top.
- [ ] 13.3 "Applies to the next new game." into the Play as control's `title`.
- [ ] 13.4 **S20**: every word of the report at `--text-soft`, body size and weight -
      the headings, the slips, the verdict and the outcome. The slips' left edges, the
      tag colours and both bars are untouched.
- [ ] 13.5 The selector row left aligned (Q26).
- [ ] 13.6 **`CHROME_BELOW` re-measured** as the settled decisions say, with the number
      and the new large board size in the notes.
- [ ] 13.7 **Tests.** S15 items 20, 21 and 22 from 19.2. Four files reach the moving
      controls today and must be updated rather than deleted:
      `ui/files.dom.test.tsx` (17 references), `ui/review.dom.test.tsx` (18),
      `ui/viewer.dom.test.tsx` (3) and `ui/remembered.dom.test.tsx`. A test that finds a
      button by its name keeps working wherever the button sits, which is the point of
      finding them that way; a test that reaches through `.play-side` or `.sidebar-files`
      does not, and those are the ones to change. Keep the suite under twenty seconds
      and do not add a full-app mount you do not need.
- [ ] 13.8 **Driven in the pane**, at the three viewports of spec 15.2, both board sizes,
      both themes, with the layout probe: S16's two numbers hold, no row is wider than
      the board, the report starts at the top of the panel, and the report's computed
      colour equals the head row's. Both states of row 2. Record the probe's rows in the
      notes as phase 9, 10 and 11 did.
- [ ] 13.9 **Version 1.2.0** in `package.json`, `src-tauri/tauri.conf.json` and
      `src-tauri/Cargo.toml` (`src/version.test.ts` holds them together). Docs swept:
      `docs/acceptance.md` item 1 and its screen description, `README.md`'s layout
      sentence, `CLAUDE.md`'s current state, the plan's phase 13 notes and boxes. Reuse
      review, then commit.

## Decision rules

- **A row that does not fit is a finding, not a licence to shrink the font.** If the
  settings row is wider than 416 at the small board, say so in the notes and put the
  two toggles on their own row rather than squeezing anything; four rows becoming five
  is a measurement, not a failure.
- **If a moved control loses a test's reach**, fix the test to find it by its name, not
  by its ancestor. That is the more durable test anyway.
- If the new `CHROME_BELOW` makes the large board smaller than the small board's 416 at
  any viewport of 15.2, stop and report: that would mean the large size has stopped
  meaning anything and Nick needs to know before it ships.
- Anything a person would see or feel that neither section 19 nor this chip settles:
  ask Nick, do not guess.

## Out of scope

What any button does. The report's content, the viewer, the scan, the PGN. The chrome
constants other than `CHROME_BELOW`. The narrow layout's stacking order, which stands as
18.1 has it. `npx tauri build` and the installer: 1.2.0 is a source version this phase,
and the Windows build is the next phase or Nick's call.

## Acceptance

`npx vitest run` green under twenty seconds with nothing skipped; `tsc -b` clean;
`npx oxlint` silent; `npm run build` clean. The screen is 19.1's at both sizes and both
themes at the three viewports, driven and measured, with S16 holding and the new large
board size recorded. No button or toggle outside the board column. The report starts at
the top of the side panel and reads in the head row's colour. "Difficulty" starts on the
same pixel as "Simply Chess". 1.2.0 in the three files. Every box ticked or its gap
written down.

## Conventions

Commits on `main`, short imperative subject, a body that says why, ending with
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` (name the model you actually
are). Write the message to a scratch file and `git commit -F` it. Stage explicit paths,
never `git add -A`, never `git clean`. No em dashes under `src/`. Australian English.
Spec section 3's words. Nick's own files are not listed or reported. Never push.
