# Chip: phase 9 - Simply Chess, and the trainer's layout

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`. Your
context may have been compacted since phase 8; Nick decides that each time. **Do not
rely on what you remember of phases 0 to 8.** Read fresh, in this order, before
touching a file: `CLAUDE.md`; `docs/simple-chess-spec.md` section 18 (all of it, it
wins over the earlier sections), then 4.2, S2, 5.6, 10, 11.1, 12.1 and 12.3; the plan
`docs/simple-chess-build-plan.md` "Rules for the builder", "Standing discipline",
phase 9, and the gate 8 findings; then `docs/testing.md`; then, in
`../London/src/ui`: `App.tsx` (the course switch row and its `switcherIdle` logic,
which you do not copy), `catalog.css` (`.course-switch`), `Play.tsx` (`PlayHead`,
`openingLine`, `MoveList` and its `MOVE_LIST_ROWS`), and `play.css` (`.play-head`,
`.play-opening`, `.play-status`, `.play-body`, `.play-column`, `.move-list`,
`.play-side`). Everything below is compressed from those; where this chip and the
spec disagree, the spec wins and you say so in the phase notes.

**Goal: the app is called Simply Chess everywhere a person sees it, and the screen is
laid out as the trainer's Play screen: a selector row under the header for the
difficulty, the board size toggle beside Light/Dark, a head row with the opening line
and the status, the move list in its own column, the side panel with Play as and the
file buttons.** No new behaviour; the same 257 tests plus the ones the layout needs.
Version stays 1.0.0 until phase 12.

## Where things stand

Version 1 is complete: phases 0 to 8 passed their gates and 1.0.0 is built (Nick's
installer run and iPad publish are his open boxes, 7.8 and 8.6). Nick then ruled, on
2026-09-13, that the app becomes a sibling of the trainer's Play screen (spec section
18, Q15 to Q22). This phase is the rename and the layout; phases 10 and 11 bring the
review and the report; phase 12 ships 1.1.0.

Today the screen is: header (name, version, Light/Dark), then `.play-body` with the
board column (bar, board, four buttons, status line, hint sentence, notices) and one
`.sidebar` (280 px) holding Difficulty, Play as, Board, Save/Load and the move list.
The fit rule in `src/ui/board-size.ts` has four chrome constants measured against
that layout. The scenes in `src/dev/` and the probe in `scripts/probes/layout.js`
name today's selectors. The trainer is `C:\Users\nick2\Code\London`; you read and
copy from it and never change it.

## Settled decisions you build on

- **The name** (Q15, spec 18.2): Simply Chess. Everything a person sees, the data
  folder `Simply Chess Data` in its three files and their test, the identifier
  `com.nick.simply-chess`, the package name `simply-chess`, the storage keys
  `simply-chess.*`, the PGN `Event` tag, the manifest, the icon script's comment, the
  README and CLAUDE.md. The repository folder, git history and the plan's phase notes
  keep the old name. **`%LOCALAPPDATA%\Simple Chess Data` exists on this machine from
  phase 8's drive**; do not delete it (Nick's files are not yours). The new folder is
  made by the next packaged run in phase 12.
- **The layout** (Q16, spec 18.1): the diagram there is the contract. Selector row,
  head row, board column, move list column at 167 px and board height, side panel as
  the trainer's `.play-side`. The window opens at 1400 by 980, minimum 960 by 720
  (spec 18.1 "Sizes"), which is phase 12's Tauri change; this phase measures the
  layout at 1400 by 980 in the pane and the fit rule's constants come from it.
- **The header's size toggle** reads the OTHER size ("Large" when small), in the
  `theme-toggle` style, placed before the theme toggle.
- **The selector row** is the trainer's `.course-switch`: `label` "Difficulty", the
  select, centred, dim text; the level's `detail` and the engine-scale sentence go
  into the select's `title` (both sentences, one blank line between) and leave the
  screen.
- **The head row** is the trainer's `.play-head` without the `h2`: `.play-opening`
  "Playing White against 4. Club" from the RUNNING game (its side and level, which
  can differ from the sidebar's after a mid-game level change), then `.play-status`
  with section 5.6's words. Engine errors and file notices stay under the buttons.
- **The fit rule** (S2, spec 18.1 "Sizes"): the constants are re-measured, and the
  height below the board counts BOTH button rows even though row two arrives in phase
  11, so the board does not change size then. Measure row two's height from the
  trainer's `.play-review-row` (a row of the same buttons: 37.33 plus the 12 gap, less
  the 4 negative margin).
- **Copy per spec S3**; `user` words; no pixel numbers or colours in `.ts`/`.tsx`
  outside `board-size.ts`; screenshots looked at and measured, no files, no headless
  browser; clear the pane's storage at the end.

## The work

### 9.1 The rename

- [ ] `package.json` name `simply-chess`; `src-tauri/tauri.conf.json` `productName`
  "Simply Chess", `identifier` `com.nick.simply-chess`; `Cargo.toml` package
  `simply-chess`, lib `simply_chess_lib` (and `main.rs` and `tauri.conf.json`'s
  `mainBinaryName` if it names one); `src-tauri/src/lib.rs` `LOCAL_FOLDER` and its
  messages; `installer-hooks.nsh`; `src/storage/paths.ts`; `local-folder.test.ts`.
- [ ] `src/storage/prefs.ts`, `current-game.ts`, `theme.ts`: the key prefix
  `simply-chess.`; every test that names a key.
- [ ] `src/play/game-pgn.ts`: `Event` "Simply Chess", the file name
  `simply-chess-YYYY-MM-DD-HHMM.pgn`; `load-pgn.ts` reads the `You` tags, not the
  event, so nothing changes there; the spec 9.1 example test updated.
- [ ] `index.html` title and `apple-mobile-web-app-title`; `vite.config.ts` manifest
  `name`, `short_name`, `description`; `public/icon.svg`'s comment;
  `tools/make-icons.mjs`'s comment; `src/ui/App.tsx` header; `README.md`; `CLAUDE.md`
  (the first line and the state line); `docs/simple-chess-deploy.md` (the project
  and domain names stay as written until Q22 is decided, the app name changes);
  `docs/testing.md` where it names the app; the DOM tests that read the heading.
- [ ] `src-tauri/icons/` are unchanged (the knight is the knight). The Tauri
  `Cargo.lock` package name line follows `Cargo.toml`; let `cargo` rewrite it
  (`npx tauri build` in phase 12 will; this phase runs `cargo metadata` with
  `.cargo/bin` on PATH, or edits the one `name =` line, and says which).
- [ ] `git grep -i 'simple chess' -- ':!docs/simple-chess-build-plan.md'
  ':!chips' ':!docs/acceptance.md'` finds nothing but the spec's history sections
  and the repository name in Q14. Record the grep in the notes.

### 9.2 The header

- [ ] `App.tsx`: a second `nav-link theme-toggle` button before the theme one, reading
  "Large" when `boardSize` is `small` and "Small" otherwise, with `title` and
  `aria-label` "Switch to the large board" / "Switch to the small board", calling
  `setBoardSize`. The Board fieldset and `BOARD_SIZES`' radios leave `Sidebar.tsx`.
- [ ] DOM test (S15 item 18, half): the toggle flips the size and the label, and the
  size survives a restart (the existing remembered test changes from the radio to the
  button).

### 9.3 The selector row

- [ ] `src/ui/DifficultyRow.tsx`, new: `div.course-switch` (keep the trainer's class
  name, with a comment that it is the trainer's course selector row and this app puts
  its difficulty there, spec Q16) holding `<label htmlFor="difficulty">Difficulty
  </label>` and the select (id `difficulty`, the options from `allProfiles()` by
  `levelName`, `title` the two sentences). No `idle` state. Rendered by `Shell`
  between the header and `<main>`, centred: the trainer centres it (`App.tsx`,
  phase 17 of the trainer: "Centre the Course dropdown in its row").
- [ ] CSS: the trainer's `.course-switch`, `.course-switch label` and `.course-switch
  select` from `London/src/ui/catalog.css` (lines 148 to 174 on 2026-09-11, without
  the two `.idle` rules) into `app.css` with an origin line, plus `justify-content:
  center`. The select keeps the trainer's `.play select` look already in `play.css`
  as `.sidebar select`; move that rule to `.course-switch select` and delete the
  sidebar copy.
- [ ] DOM test (S15 item 18, other half): the select is in the row, changing it
  reaches the engine before the next move (the existing test, re-pointed at the new
  select), and the level survives a restart.

### 9.4 The head row

- [ ] `src/ui/PlayHead.tsx`, adapted from the trainer's `PlayHead` in `Play.tsx`: a
  `header.play-head` with `p.play-opening` and `p.play-status`, no `h2`. The opening
  line from a function `openingLine(side, level)` beside it: `Playing
  ${colourName(side)} against ${levelName(level)}`, from the provider's `side` and
  `level` (the running game's). `StatusLine.tsx`'s wording moves into it;
  `StatusLine` keeps only the `Notice` and is renamed `Notices.tsx`, or the
  component moves and the file goes; say which.
- [ ] CSS: the trainer's `.play-head`, `.play-opening`, `.play-status` (its `play.css`
  lines 54 to 75) replace this app's `.play-status` rule; the board inset margin on
  the status goes with it.
- [ ] String test on `openingLine`; the DOM tests that read `.play-status` still pass.

### 9.5 The three columns

- [ ] `Screen.tsx`: `.play-body` holds `.play-column` (bar, board, `PlayControls`, the
  notices), then `MoveList` as its own column, then `aside.play-side` holding
  `Sidebar` (now: the Play as fieldset, the file buttons, the hint sentence when
  there is one). `Sidebar.tsx` loses the move list, the difficulty and the board
  fieldset; rename it `SidePanel.tsx` if that reads better, and say so.
- [ ] `MoveList.tsx`: the trainer's column: `height: calc(${rows} * 1.45em)` is NOT
  used; the list is board height. Give the `ol` `style={{ height: pixels }}` from the
  board's pixels (passed down), as the trainer's phase 26 did with `BOARD_SIZE`, and
  `width: 167px` in `play.css` with the trainer's comment on why 167. `contain: size`
  and the ten-row floor from phase 3 go; the narrow layout keeps a ten-row height.
  `keep-in-view.ts` stays.
- [ ] CSS: the trainer's `.play-side` (`play.css` line 133 on 2026-09-11: `flex: 1;
  min-width: 300px; max-width: 52ch`) replaces `.sidebar`; the fieldset rules become
  `.play-side fieldset` and friends; `.sidebar-files` stays as the row of two
  buttons; `.hint-said` moves into the side panel, without the board inset margin,
  as the trainer's is.

### 9.6 The window and the fit rule

- [ ] `src-tauri/tauri.conf.json`: `width` 1400, `height` 980, `minWidth` 960,
  `minHeight` 720. Spec 11.1's text is superseded by 18.1; say so in the notes and
  correct 11.1's numbers in the spec with a bracketed note, as earlier corrections
  were made.
- [ ] `board-size.ts`: re-measure in the pane at 1400 by 980 with the new layout, then
  set `CHROME_ABOVE` (header + selector row + head row + page padding),
  `CHROME_BELOW` (gap + row one + gap + row two + page padding, row two counted
  though absent), `CHROME_BESIDE_WIDE` (padding both sides + bar + gap + gap + list
  column 167 + gap + side panel minimum 300), `CHROME_BESIDE_NARROW` unchanged.
  Round up. Write the arithmetic in the comment. Update `board-size.test.ts`'s
  expected numbers with the arithmetic shown for each (1400 by 980 at scale 1, 1180
  by 820, 820 by 1180, 1600 by 1200, and the 1.5 and 1.25 rows).
- [ ] The narrow layout (`@media (max-width: 899px)`): three columns stacked, the list
  ten rows, the selector row and the head row wrap. The 900 stays one number in
  `NARROW_BELOW`.

### 9.7 Scenes, probe, layout pass

- [ ] `scripts/probes/layout.js` adds `head` (`.play-head`), `selector`
  (`.course-switch`) and `side` (`.play-side`) and drops `sidebar`. `src/dev/`
  unchanged unless a selector it relies on moved.
- [ ] The layout pass: `?scene=midgame` at 1400 by 980 (the new window), 1180 by 820
  and 820 by 1180, both sizes, both themes: the twelve rows in the notes, S16's two
  numbers holding. Then `?scene=hint` and `?scene=mate` at 1400 by 980 looked at.
  The pane caps its viewport width; if 1400 is refused, use 1280 and say so, and
  work the 1400 numbers out on paper from the constants.
- [ ] Look at the screen against the spec 18.1 diagram and say what differs, if
  anything, rather than adjusting the diagram.

### 9.8 Close

- [ ] `npx vitest run` both projects green under twenty seconds; counts and time.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean, the scene greps at 0.
- [ ] Copies diffed and listed. No forbidden words in adapted or new files. No pixel
  number or colour in a `.ts` or `.tsx` other than `board-size.ts` and
  `vite.config.ts`'s manifest colours.
- [ ] Reuse review, then commit. Two commits read better: the rename, then the layout.

## Decision rules

- **The head row and the selector row leave less height for the board.** That is what
  the fit rule is for; the large board gets smaller at 980 tall and that is right.
  Do not shrink padding or rows to win pixels back.
- **The move list column plus the side panel's minimum do not fit beside the large
  board at 1400.** The fit rule shrinks the board first; the side panel's minimum
  holds. If the page scrolls sideways at 1400 by 980 with the small board, that is a
  fault to fix, not a number to move.
- **A test names the old key or the old app name.** Change the test; the names are
  the spec's.
- **Something a person would see is not specified** (the exact `title` wording, a gap
  the trainer does not have): stop and ask Nick. Code shape: decide and say why.
- **A contradiction** between chip, plan, spec (18 wins over 1 to 17) and copied code:
  stop that item, write it down, continue with the rest.

## Out of scope for this phase

Stop and review, Stop and discard, the report, the review viewer, Keep playing, Play
from here, Copy game, the hint count (phases 10 and 11); the version bump and the
Tauri build (12); the deploy choice (Q22).

## Acceptance

Phase 9 of the plan, every box ticked as it lands: the grep finds no old name outside
history; the header, selector row, head row, three columns and side panel match spec
18.1 at both sizes and both themes at the three viewports with S16 holding; the fit
constants re-measured with their arithmetic; suite green under twenty seconds;
`tsc -b` clean; `../London` and `../Conquest` untouched.

## Conventions

- Tick the plan's phase 9 boxes as you go. Append "Phase 9 - builder notes" under the
  plan's "Phase notes" after the gate 8 findings: measured (the twelve rows), decided,
  asked, the reuse review's find, left. Update the Progress table row.
- The reuse review's likely finds this phase: the level's description sentences
  written twice (the `title` is the one place now); a second select style; the
  board's pixels passed two ways; the old `.sidebar` rules left behind.
- One commit at least, on `main`. Short imperative subject, a body that says why. End
  the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, naming the
  model you actually are. Write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours.

## Cleanup

Stop the dev server. Clear the pane's storage. Report the commit hashes, the test
counts and time, the twelve-row probe table, the new chrome constants with their
arithmetic, and anything the decision rules made you skip.
