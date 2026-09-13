# Acceptance, checked

Spec section 17, item by item, with 18.7's and 19.2's additions folded in, and with what
was actually done to check each one and when. Written 2026-09-12 in phase 8 for version
1.0.0; **rewritten 2026-09-13 in phase 12 for version 1.1.0**, because phases 9 to 11
changed the name, the screen and what the app does, and a record that says what the app
used to be is not a record of what was checked. **Brought to 1.2.0 in phase 13**, which
moved every control under the board: items 1, 3 and 11 say what changed and the rest
stand, because nothing else about what the app DOES moved with them.

Where something was checked by driving the app, it was driven: the development build in
the browser pane, the production bundle from `npm run preview`, and the packaged window
over the WebView2 debugging port. Where a check cannot be made from a build session at
all, it says so and names the person who makes it. Three things are of that kind, and
all are Nick's: the iPad, because this machine is not one; the first run of the
installer, because it writes to his machine; and a real move on the packaged board,
because the shipped build ignores synthetic events on purpose.

Every number below was either measured in phase 12 or is quoted from the phase note or
gate finding that measured it, and says which. Nothing here is an estimate.

## 1. The screen

**Green.** One screen, laid out as spec 19.1: the header with the name and the version;
the left-aligned selector row with the difficulty, its label starting on the same pixel
as the heading; the head row with the opening line and the status; and under them three
columns, the board with its bar and its four rows of buttons (the game; this game,
which is the two ways to stop it or what a report offers instead; the file; the
settings, with the board size and theme toggles at the row's right-hand end), the move
list in its own 167 px column at the board's height, and the side panel, which holds
the hint sentence and the report and nothing else.

Phase 13 is where the controls moved. Until then the side panel stacked Play as, the
file buttons and the two stop buttons above the report, so the report started 195.8 px
down a 552 px column; it now starts at the top of it, which was measured at y 167 in
the pane with the panel's own top at y 167. The report also reads in the head row's
colour from that phase (spec S20): `rgb(200, 204, 210)` at 16 px and weight 400 in the
dark theme, and `rgb(61, 65, 71)` in the light one, both measured equal to
`.play-opening`'s in the same load.

The layout probe (`scripts/probes/layout.js`, spec 15.3) has been run at every viewport
of spec 15.2, at both board sizes and both themes, in every phase that moved the screen,
and S16's two numbers held in every row: the bar, `.board` and `cg-board` end on the same
pixel, and `scrollWidth` never exceeds `innerWidth`.

| When | What was measured | Result |
|---|---|---|
| Phase 6 notes | The version 1 screen, twelve rows (three viewports x two sizes x two themes) | S16 held in all twelve |
| Phase 9 notes | The version 2 layout, twelve rows | S16 held in all twelve; large board 688 at 1400x980, 528 landscape, 728 upright |
| Gate 9 findings | The same, driven by the orchestrator at 1280x980 | Large 672, all three ending on 836 |
| Phase 10 notes | With the report showing | Small 416 and large 672 at 1280x980, unchanged by the report; the side panel grows instead |
| Gate 11 findings | With the report AND row two showing | Small 416 ending at 583, large 672 ending at 836, row two spanning the board exactly; 94.7 px used of `CHROME_BELOW`'s 120 |
| Phase 12 notes | Row two at the start of a game, after 12.1 | Board 416, Back disabled at ply 0, Play from here off with its own sentence |
| Phase 13 notes | The version 1.2.0 layout, twelve rows, and the review state beside them | S16 held in all twelve; large board 584 at 1400x980, 424 landscape, 728 upright; no row wider than the board |

**The board does not change size when row two appears**, which is what phase 9's
re-measured chrome was for: it counted a second button row that did not exist until phase
11. 416 and 672 at 1280 by 980 are gate 10's own numbers with only row one showing.
Phase 13 kept that rule with four rows: the review state of row two is the same 38 px
with a -4 px top margin, so a report showing takes four pixels LESS than a game in
progress, and the board was measured at 584 in both states of the same load.

**What the room for the report cost the board**, recorded because it is a real trade
rather than a detail: `CHROME_BELOW` went from 120 to 224, so at 1400 by 980 the large
board is 584 where phase 9 measured 688 (576 at a display scale of 1.25 or 1.5), and on
a landscape iPad it is 424 against the small board's 416. Nick ruled the trade when he
asked for the room (spec 19.1).

Phase 6 is also where this item earned its instrument. The move list's "keep the newest
move in view" called `scrollIntoView`, which scrolls every scrollable ancestor, so at
1180 by 820 the board's top rank was off the screen from the moment the app opened. Five
phases of green tests never saw it, because jsdom has no layout. The scroll arithmetic is
now one pure function with its own test (`scrollToShow` in `ui/keep-in-view.ts`), and the
probe is how the rest is watched. Phase 11 kept that rule when the viewer arrived: the
trainer's own viewer still calls `scrollIntoView` on its marked move and this app does
not.

## 2. A game

**Green.** Checkmate was reached in the pane with the scripted engine and in the suite;
against the real engine at level 4 a scholar's mate is defended, which is the engine
working. Phase 2 played a real game in the pane against the real Stockfish; the outcome
sentences are `outcomeOf`'s, with a string test per ending.

Playing Black: New game hands the engine the first move, the board is flipped and the
bar's White share is at the top (DOM test, phase 3). Undo and redo behave as spec 5.4,
including out of checkmate, which clears the outcome (string test on the session, phase
2). A promotion offers the picker, locks the board while it is open, plays the chosen
piece, and puts the pawn back on Escape: driven in the pane in phase 4 from a seeded
position (`axb8=R`, answered by `Rxa1`, the bar moving +4.9 to +3.8) and held by a DOM
test.

## 3. Levels

**Green.** All eight are in the select, Club (level 4) is the default on a fresh install,
and a change mid-game is heard by the engine's next search: phase 3 chose level 6 in the
pane mid-game and the session's profile became level 6, 300 ms, Elo 1750, with the
setting and the remembered game both written as 6. A string test with a recording fake
engine pins the order: the level reaches the engine before the next search.

The select moved in phase 9 from the sidebar to the selector row under the header (spec
18.1), and the level's two sentences moved with it into the select's `title`, so they
are a hover and nowhere else. Phase 13 left it where it is and moved the row to the left
of the page (spec Q26), so the label starts under the heading: both were measured at
x 24 in the same load. A DOM test holds where the select lives. It is the one control
NOT under the board, which is the spec's own exception: a row under the header is where
the trainer's course selector sits and the two screens are siblings (spec S17).

## 4. The bar

**Green.** The bar follows every move, holds its value while the engine thinks, and
carries the number with the right sign and orientation. Driven in the pane in phase 4:
the start position read "Evaluation: +0.5" with White's share 58.09 percent drawn from
the bottom. `evalShare` and `evalText` have string tests for `+0.4`, `-1.2`, `0.0`, `M5`
and `-M5` and the share of each. Undo's missing number is fetched for the position it
lands on, at the analysis profile, with nothing greyed (phase 5).

During a review it shows the evaluation of the position being LOOKED AT rather than the
game's last one (spec 18.4), which costs nothing because the scan filled every position.
Driven in phase 11: clicking back through the blunder took the bar from -5.8 to -0.3, and
the orchestrator's own walk at gate 11 read +0.8, +0.3 and +0.4 stepping back through a
twenty-move game.

## 5. Hint

**Green.** Phase 4 asked for a hint in the pane: "The engine suggests e4." with one
auto-shape `bluee2e4` on the board, the button greyed while the engine thought. Phase 6
re-checked it from the `hint` scene at 1180 by 820. It is disabled when the game is over,
while the engine is thinking, and now while a report is showing, which DOM tests hold.

From phase 10 the session counts hints, because the report says how a game was played.
The count is taken where the hint is GIVEN rather than where it is asked for, so a search
that answered nothing does not claim the user had help.

## 6. Save and load

**Green in the browser and on the iPad's side; the packaged window's dialogs are item 9.**
A saved file is the PGN of spec 9.1: seven tags, the movetext, and one closing comment,
with a string test on the writer and the reader together that round-trips the moves, the
side and the level. A foreign PGN with variations loads its main line with the user as
White, and an illegal file is refused with the current game untouched (string tests,
phase 5).

Driven in the pane in phase 5: Save game made one blob of 225 bytes typed
`application/x-chess-pgn` and said "Saved to your downloads folder"; Load game put a
hidden `.pgn` input in the page, took a Black game at level 6 through it, and the board
came back the other way up with the select on 6, the Black radio ticked and White's reply
already played.

**From phase 10 a reviewed game's file carries the report's comments** (spec 18.6): the
hint count before the first move, the slip's own words beside the move that was it, and
the verdict at the end. A game saved before it is reviewed is byte for byte what phase 5
wrote, which its own test still holds unchanged. Copy game and Save game write the same
text because one function builds it (`pgnNow` in `Shell`); a DOM test compares the two.
The real file, read out of the save blob in the pane in phase 10:

```
[Event "Simply Chess"]
[Site "-"]
[Date "2026.09.13"]
[Round "-"]
[White "You"]
[Black "Stockfish level 1"]
[Result "*"]

1. e4 e5 2. Qh5
{mistake: slightly better for white to slightly better for black; the engine preferred 2.Nf3}
2... Nc6 3. Qxe5+ {blunder: level to winning for black; the engine preferred 3.Bc4}
3... Nxe5 4. Nf3 c6
{Winning for Black. Stopped after move 4. White was played by you at level 1.} *
```

A reviewed file still loads back to the same moves, side and level, because the reader has
always ignored comments (S8), and a string test walks that round trip.

## 7. Remembered

**Green.** Every setting and the game in progress survive closing and reopening: DOM
tests across a remount for the settings, and a stored game that replays on start with its
own side and level. A scrambled stored game is discarded silently and a fresh game
starts. Driven in the pane in phase 3 (a reload brought back the game, the level 6
select, Large ticked) and again in phase 7 offline, where the page reloaded with the
server stopped and opened on the game it was closed on.

The storage keys became `simply-chess.*` in phase 9, with the name. Nobody had data under
the old keys, so nothing is migrated, and the spec's section 10 carries a bracketed note
saying so.

On Windows the same storage is the WebView2 profile's, in `%LOCALAPPDATA%\Simply Chess
Data`, which is the folder the window is pointed at in `src-tauri/src/lib.rs`. That it
survives closing the window is Nick's step in item 9.

## 8. Stopping, reviewing and walking a game

**Green.** This item is new for version 2 and covers spec 18.3, 18.4 and 18.5. It is its
own item rather than folded into item 2, because it is the largest thing version 2 added
and item 2 is about playing rather than reading.

**Stop and review** scans every position of the game at the analysis profile, handed
everything the live bar already worked out, so the report cannot disagree with the numbers
the user watched. A game played move by move therefore scans nothing, because the bar has
already been everywhere; the scan does real work on a game reopened from storage or
loaded from a file, which is what both the drives and the progress test use. Driven in
phase 10 against the real Stockfish on a seeded game that hung the queen: the button went
"Scanning 0 of 0..." to "Scanning 3 of 6..." to the report, and the orchestrator's own
run at gate 10 saw "Scanning 4 of 8...". Undo, Redo, Hint, Save game, Load game and Stop
and discard are all greyed while it runs.

**The report** named the blunder with its move number, its tag and the engine's preferred
move, most recent first: "A blunder on move 3: Qxe5+ turned "level" into "winning for
black". The engine preferred 3.Bc4." above the inaccuracy. The final position got a
verdict in words with the horizontal bar under it. **The report's numbers are the bar's,
demonstrated rather than asserted**: in phase 10 the report bar's 2.78322 percent inverts
to -5.33 pawns while the live bar beside the board read -5.3; at gate 10 the same check
gave -6.0 against -6.0.

**Stop and discard** left no report, no stored game, an empty move list, the two buttons
back and "Your move" (phase 10 and gate 10, both in the pane; a DOM test holds it).

**The viewer** (spec 18.4) was driven in phase 11 and again by the orchestrator at gate
11, both themes. Clicking a move moves the board and the mark; the arrow keys step one
move a press and do nothing with the difficulty select focused; the board stays locked
and Undo and Redo stay greyed. Standing where a slip was played from, the move that was
played is the highlight and the engine's better move is a blue arrow, both at once:
`lastMove` h5-e5 with one blue f1-c4, and one step on the arrow is gone. The mark computes
to `--mark` in both themes (#c9e2cc light, #3a5b3f dark).

**The list scrolls itself and nothing above it**, which is the one thing no test can hold,
because jsdom has no layout. Measured twice, in opposite directions: phase 11 clicked move
1 from the bottom of a twenty-move list and the list's `scrollTop` went 304 to 0; gate 11
clicked the last move from the top and it went 0 to 304. Both times the board's y stayed
167, `main`'s `scrollTop` stayed 0 and the window's `scrollY` stayed 0.

**Keep playing** hands the board back at the game's OWN final position rather than
wherever the reader has walked to: pressed from a board standing at the slip, the board
read the session's own fen, the report and row two went, and Undo and Hint came live. It
is offered only for a game that was stopped, never for one that ended by itself.

**Play from here** starts a new game from the position being looked at, with the old
game's side and level, as `start` with a prefix of its moves. It is off where the engine
is to move ("It is the engine's move here. Step one move on or back."), at a finished
position ("The game is over here."), and **at the start of the game ("This is the start of
the game. Use New game.")**, which phase 12 added: gate 11 found it live at ply 0, where
it is New game under another name that also throws the reviewed game away. Driven in phase
12 stepping back through a six-move game: the sentence changed at every ply and the last
one is the start's, with Back disabled beside it.

## 9. Windows

**Green as far as a session can take it, at 1.1.0. The installer run is Nick's.**

Everything below was built and measured in phase 12, at version 1.1.0. **Phase 13 did
not build a window**: 1.2.0 is a source version and the Windows build is the next phase
or Nick's call (spec 19, out of scope). What phase 13 changed that this item will show
when it is next built is the board size, 584 rather than 688 at 1400 by 980 and 576 at
the 1.5 display scale this machine runs, and four rows of buttons under it instead of
two. Nothing else here depends on the layout.

Built in phase 12 with `npx tauri build`:

- The installer is `src-tauri/target/release/bundle/nsis/Simply Chess_1.1.0_x64-setup.exe`,
  **6,898,142 bytes (6.6 MB)**. `installMode: currentUser`, so it asks for no administrator rights and
  installs into `%LOCALAPPDATA%\Simply Chess`. It is unsigned, so SmartScreen warns once
  (spec 11.2, accepted).
- The executable is `src-tauri/target/release/simply-chess.exe`, **9,150,976 bytes (8.7 MB)**.
- The window was started with WebView2's debugging port on and read through
  `scripts/packaged-eval.mjs`. Its title is "Simply Chess" and its inner size is
  **1400 by 980**, which is spec 18.1 and unchanged by 19.1. The header says "Simply Chess v1.1.0", the version
  in `package.json`, `tauri.conf.json` and `Cargo.toml` (four tests hold them together),
  and `__TAURI_INTERNALS__` is present, which is what `isDesktop()` reads.
- **The layout probe, run against that real window** (the same file the pane runs, read a
  second way): the board and `cg-board` both **688** square at x 68, the bar 24 wide at
  x 24, and all three ending on **852** together; the move list 167 wide at x 780 and 688
  tall; the side panel 405 wide at x 971; the selector row centred at y 80.67 and the head
  row at y 124; `scrollWidth` **1400** against `innerWidth` **1400**. S16's two numbers
  hold in the shipped window, at the machine's display scale of 1.5. 688 is exactly what
  phase 9's re-measured chrome predicted for a 1400 by 980 window.
- **The engine runs in it.** A game seeded into the window's own storage and reopened was
  evaluated to **-6.0** on the bar, and Stop and review then scanned every position of it
  and built the report. That is Stockfish's WASM loading and searching inside the window
  with no server anywhere. (A game that ends in checkmate shows "the engine has not looked
  yet" on reopening, which is correct rather than a fault: a mated position has no move to
  search, so there is no evaluation to give it.)
- **No service worker inside the window** (spec S12), read live rather than asserted:
  `navigator.serviceWorker.getRegistrations()` is empty and there is no update bar.
- **A game can be reviewed and walked in the shipped window.** Stop and review produced "A blunder on move 3:
  Qxe5+ turned "level" into "winning for black". The engine preferred 3.Bc4." above the
  inaccuracy, with "Winning for Black" and "Stopped after move 3" under THE FINAL
  POSITION; the status read "Game reviewed" and row two appeared with Keep playing, Play
  from here and the two arrows, Forward disabled at the end. Clicking the blunder's
  sentence moved the mark to Nc6, took the bar to -0.2, highlighted h5 and e5 (the slip
  itself) and drew the blue arrow f1-c4 beside it. The one screenshot this project makes
  was taken there and shows all of it: the report, the marked move in `--mark`, the
  highlight and the arrow together, row one greyed except New game, and row two under it.
  `window.__cg` is undefined in the window, which is right: the dev handle is
  `import.meta.env.DEV` gated and this is a production bundle.
- `%LOCALAPPDATA%\Simply Chess Data\WebView2` holds the window's profile, and no
  `com.nick.simply-chess` folder appears under `%LOCALAPPDATA%` or `%APPDATA%`, which is
  what building the window in `lib.rs` is for.
- The uninstaller's four cases were proved by `node scripts/check-uninstall-hook.mjs`
  against a scratch folder: only a ticked, non-upgrade uninstall removes it. Taking the
  `$UpdateMode <> 1` half of the guard out turns the second case red, which is a version
  bump deleting the user's game; that mutation was done in phase 8, put back, and the four
  cases re-run here.

**Nick's, once:** install 1.1.0 (over the interim 1.0.0 if it is installed, checking the
settings and the game survive), open the app, play a move on the board, save a game and
load it back through the real dialogs, close and reopen to see the game remembered, stop
and review a game in the installed app, then uninstall with the box ticked and check
`%LOCALAPPDATA%\Simply Chess Data` is gone. Plan box 12.6. Date: ______

A real move is his because the shipped build ignores synthetic events on the board, which
is what makes it safe; the dialogs are his because a save dialog is a window on the screen
that only a person can answer. What could be checked from here was: both file buttons are
on screen and live, and the window takes the desktop path (`__TAURI_INTERNALS__` is
present, which is what `isDesktop()` reads), so the halves behind those buttons are the
Tauri ones rather than the browser's download and file input. The capability file grants
exactly the five permissions spec 11.4 lists.

**One thing to know before installing.** The identifier changed with the name in phase 9,
from `com.nick.simple-chess` to `com.nick.simply-chess`, and NSIS keys an install on the
product name. An install of the old Simple Chess 1.0.0 would sit BESIDE this one rather
than be upgraded by it. Nothing is at risk: Simple Chess 1.0.0 was never installed. The
interim Simply Chess 1.0.0 built at gate 9 has the same product name as this one and is
upgraded normally.

## 10. iPad

**Green as far as a session can take it. The publishing and the aeroplane-mode game are
Nick's, and which route to publish by is still his to choose (Q22).**

Phase 7 built the manifest, the icons and the service worker and proved the offline case
against the production bundle on this machine: `npm run preview` on 5186, one move played
on the real board, the server stopped, the page reloaded on the remembered game, and a
second move answered by the engine from the precached WASM (delivered from
`cache-storage`, transfer size 0) while a fetch of an unstored path was refused. The
precache names both engine files; without `maximumFileSizeToCacheInBytes` Vite drops the
7.3 MB WASM with one line in the log and the app opens offline and hangs, which was shown
and put back (spec S11). The precache is 21 entries at 1.1.0.

The update banner was driven at `?pretendUpdate` in both themes at two viewports: it
offers the new version, says the game is remembered so loading it loses nothing, and
"Load it" calls the worker's `updateServiceWorker(true)` (DOM test). It is not registered
at all inside the Tauri window (spec S12, DOM test).

**Nick's, once:** choose a route (Cloudflare Pages or Caddy on the LAN, both written up in
[simple-chess-deploy.md](simple-chess-deploy.md)), publish, add the app to the Home Screen
from Safari, and play a move in aeroplane mode after one online visit. Plan box 7.8.
Date: ______

## 11. Tests

**Green.** 324 tests in 37 files, both projects, in 9.1 seconds warm on this machine,
which is inside the twenty-second rule. By project: 255 string tests in 25 files, 69 DOM
tests in 12. Nothing is skipped. `tsc -b` clean, `npx oxlint` silent. No em dashes under
`src/` or `src-tauri/`. The version is held in three files by four tests, and the Windows
data folder's name is held in three files by three more.

All eleven tests of spec S15 are present, all eight that spec 18.7 adds, and all three
of 19.2:

| S15 | Where |
|---|---|
| 1. Undo in pairs, redo, and an undo out of checkmate | `play/session.test.ts` |
| 2. A promotion is not played until a piece is chosen | `ui/promotion.dom.test.tsx` |
| 3. A level change reaches the engine before its next search | `ui/remembered.dom.test.tsx`, "tells the engine a new level before its next move" |
| 4. The bar's numbers and shares | `play/evalbar.test.ts` |
| 5. A saved game round-trips | `play/game-pgn.test.ts` and `play/load-pgn.test.ts` |
| 6. A foreign PGN loads its main line; a bad file is refused | `play/load-pgn.test.ts` |
| 7. The remembered game reopens; a scrambled one is discarded | `ui/remembered.dom.test.tsx` |
| 8. Every setting survives a restart | `ui/remembered.dom.test.tsx` |
| 9. Play as Black: the engine opens, the board is flipped, White's share is at the top | `ui/remembered.dom.test.tsx` and `ui/bar-and-hint.dom.test.tsx` |
| 10. New game clears the hint, the outcome and the redo stack | `ui/bar-and-hint.dom.test.tsx` and `ui/play-game.dom.test.tsx` |
| 11. The large board fits and divides by 8 | `ui/board-size.test.ts` |
| 12. Stop and review reports a scripted blunder | `ui/review.dom.test.tsx`, "names a blunder with its move number, its tag and the better move" |
| 13. Stop and discard forgets the game | `ui/review.dom.test.tsx`, "leaves no report, no remembered game and a fresh board" |
| 14. The viewer marks the clicked move, the keys step, the board is locked | `ui/viewer.dom.test.tsx`, "clicks, steps and marks, with the board still locked" |
| 15. Keep playing returns to the final position with the report gone | `ui/viewer.dom.test.tsx`, "keeps playing from the final position, then plays from a viewed one" |
| 16. Play from here starts a new game from the viewed position | the same test, plus `ui/play-from-replay.test.ts` for which plies allow it |
| 17. Copy game and Save game produce the same text, with the comments | `ui/review.dom.test.tsx`, "write the same text for a reviewed game, with the report in it" |
| 18. The size toggle and the selector row's select work and are remembered | `ui/remembered.dom.test.tsx`, "remembers the level, the side, the board size and the theme" and "puts every control under the board, and the select in the selector row" |
| 19. The hint count reaches the report and the file | `ui/review.dom.test.tsx`, "carries the hint count into the report", and `play/game-pgn.test.ts`, "says how many hints were used, before the first move" |
| 20. Every control is under the board and the panel holds none, in both states of row two | `ui/remembered.dom.test.tsx`, "puts every control under the board, and the select in the selector row", and `ui/viewer.dom.test.tsx`, "clicks, steps and marks, with the board still locked" for the review state |
| 21. The report's text takes the head row's colour | `ui/review.dom.test.tsx`, "names a blunder with its move number, its tag and the better move", holds that no line carries a colour of its own; the colour itself is measured in the pane, because jsdom applies no stylesheet |
| 22. The Play as radios and the two toggles work from their new home and are remembered | `ui/remembered.dom.test.tsx`, "remembers the level, the side, the board size and the theme" and "lets the engine open, and turns the board the other way up"; `ui/shell.dom.test.tsx` for the theme's own storage key |

Two items have found holes in this walk rather than confirming them, which is what the
walk is for. Item 10, in phase 8: the redo stack was held and the hint and the outcome
were not, and S15 names all three; two DOM tests were added and both were shown red first.
Item 16, at gate 11: Play from here was live at the start of the game, which spec 18.4
says it must not be; fixed in phase 12 with a string test and a DOM case, both shown red
against the unfixed rule.

## 12. Docs

**Green.** The specification, the plan with every box ticked or its gap recorded, this
document, `testing.md`, `simple-chess-deploy.md` with both of Q22's routes, the README for
both platforms, and `CLAUDE.md` for the next session. Every copied file carries its
`Origin:` line and adapted ones say what changed (spec S3).

The specification's sections 1 to 17 keep their version 1 text as history, which its own
front matter says; section 18 is the version 2 delta and wins wherever they differ. Two
bracketed corrections were added inside the earlier sections in phase 9, at 11.1 (the
window size) and section 10 (the storage keys), because those two would otherwise have
been read as current.

The only boxes still open are the three that need Nick's machine, his accounts and his
iPad: 7.8, 8.6 (superseded by 12.6, which is the same walk on 1.1.0) and 12.6. All are
named above.
