# Simple Chess - specification

Version 1. Written 2026-09-11 by the orchestrator session from Nick's brief
(`SimpleChess-brief.txt`) and his rulings of the same day (section 2). Status:
**agreed, awaiting build.**

This document says what the app does and how it is built. The
[build plan](simple-chess-build-plan.md) says in what order. Where the two disagree,
this document wins. Where this document and the copied trainer code disagree, this
document wins and the code is changed.

Decisions carry a number, S1 upward. A numbered decision has a reason attached. Do
not change one without reading the reason. Every ruling Nick made is in section 2
and is folded into the body, so a build from this document alone gives the app he
asked for.

---

## 1. Purpose

A no-frills chess game. One person plays against the Stockfish engine on one screen:
a board, an evaluation bar beside it, four buttons under it, and a sidebar with the
settings. Nothing else. The user knows chess and the screen is obvious, so there is
no help page.

It runs in two places from one code base:

- **Windows**, as an installed desktop app in its own window, exactly the way the
  Repertoire Trainer in `../London` does (Tauri 2 over WebView2, NSIS installer).
- **iPad**, as a Home Screen app, exactly the way Conquest in `../Conquest` does (a
  PWA served from Cloudflare Pages).

The code is copied from the trainer wherever the trainer already does the job, and
kept in the trainer's shape, so that the two can share a library later (S3).

---

## 2. Rulings (Nick, 2026-09-11)

Fourteen questions were put to Nick before this document was written. His answers,
each folded into the body where it belongs:

| # | Question | Ruling |
|---|---|---|
| Q1 | Product name and identifiers | **Simple Chess.** Tauri identifier `com.nick.simple-chess`. Browser profile folder `%LOCALAPPDATA%\Simple Chess Data`. |
| Q2 | iPad delivery | As Conquest: Cloudflare Pages from a private GitHub repository, at **`simplechess.datacrafter.net`**. Nick does the GitHub, Cloudflare and DNS steps. The GPL point (S22) is accepted. |
| Q3 | What double size means | Small is 416 px, as the trainer. Large is 832 px on Windows. On iPad, large is as big as fits. **Superseded 2026-09-12** (Nick: "the double size doesn't need to be taken literally"): large is the largest board that fits and draws whole squares, up to 832, on every platform. See S2. |
| Q4 | The evaluator | The trainer's vertical bar beside the board, **with the number on it and no words.** |
| Q5 | Buttons under the board | All four of the trainer's: New game, Undo, Redo, Hint. |
| Q6 | Which colour you play | A "Play as" setting, White or Black, remembered, applied at the next New game. No random option. |
| Q7 | Changing difficulty mid-game | Applies to the engine's next move. |
| Q8 | Save and load format | PGN files in the trainer's tag layout, with the level and the colour in the tags. |
| Q9 | Remembering the current game | Yes. The game in progress is stored after every move and the app reopens on it. |
| Q10 | Promotion and game end | **A promotion picker.** Games end by checkmate, stalemate or the draw rules, in the trainer's words. No resign, no draw offer, no move cap. |
| Q11 | Screenshot and layout verification | **The trainer's method, not a new tool.** The build session drives the browser pane and reads the installed app over the WebView2 debug port. See section 15. |
| Q12 | Move list | Included. |
| Q13 | Copying the trainer's code | Identical files where the code is unchanged, each with one origin line. Comments describe this app where behaviour differs. |
| Q14 | The repository | `git init` here. A private GitHub repository `nick2468/SimpleChess` as the Cloudflare source. Builders commit on main and never push. Nick pushes. |

Nick also confirmed the things the orchestrator proposed to decide alone: docs in
`docs/`, ports 5185 and 5186, dark theme by default, version 0.1.0 during the build
and 1.0.0 at acceptance, the trainer's eight levels with Club as the default, the
trainer's fixed analysis profile for the bar and the hint, and nothing else from the
trainer (no courses, drills, report, progress or help).

---

## 3. Words

One name for one thing. Code, comments, docs and the screen use these exact words.

| Word | Meaning |
|---|---|
| **The user** | The person playing. Never "trainee" (the trainer's word) and never "student". The copied code may keep `studentColour` as an identifier where renaming would break the identical-copy rule (S3); new code says `user`. |
| **The engine** | Stockfish, running in a web worker. It is the opponent, the evaluator and the hint. |
| **Level** | One of the eight strengths, 1 to 8. Its name on screen is "4. Club", from `levelName`. |
| **Side** | The colour the user plays: `white` or `black`. |
| **Board size** | `small` (416 px) or `large` (832 px, or as big as fits on iPad). |
| **The bar** | The vertical evaluation bar to the left of the board. |
| **Evaluation** | The engine's score for a position in pawns from White's point of view, from the analysis profile. |
| **The analysis profile** | Level 8, one candidate, 150 ms. Every evaluation is made with it and nothing else. |
| **Move** | One move by one side. Half-move and ply are the same thing in code (`ply`), as in the trainer. |
| **Game** | The moves played so far, plus the side and the level. |
| **Outcome** | How a game ended, in the trainer's sentences: "You won by checkmate", "Drawn by stalemate" and so on. A game that has not ended has no outcome. |
| **PGN** | Portable Game Notation, the standard text form of a chess game. FEN is the one-line text form of a position. SAN is the notation for one move, like `Nf3`. UCI is the text protocol the engine speaks. |
| **Desktop** | The app running inside the Tauri window on Windows. `isDesktop()` says so at runtime. |
| **The pane** | The Claude Code browser pane the build session drives. |

---

## 4. The screen

There is one screen. It never navigates anywhere.

### 4.1 Layout

```
+----------------------------------------------------------------------+
| Simple Chess  v0.1.0                                     [ Light ]   |   header
+----------------------------------------------------------------------+
|  ||  +-----------------------+   +------------------------------+    |
|  ||  |                       |   | DIFFICULTY   [4. Club     v] |    |
|  ||  |                       |   | (one line about the level)   |    |
|  ||  |        board          |   | PLAY AS   (o) White ( ) Black|    |
|  ||  |                       |   | BOARD     (o) Small ( ) Large|    |
|  ||  |                       |   | [Save game] [Load game]      |    |
|  ||  |                       |   |------------------------------|    |
|  ||  +-----------------------+   |  1. d4    d5                 |    |
|      [New game][Undo][Redo][Hint]|  2. Bf4   Nf6   (move list)  |    |
|      Your move                   |  ...                         |    |
|      The engine suggests Nf3.    +------------------------------+    |
+----------------------------------------------------------------------+
```

- **Header**: the app name with the version beside it in the trainer's faint style,
  and the theme toggle at the right, styled as the trainer's `theme-toggle` nav link.
  Nothing else in the header.
- **Board column** (`.play-column`): the bar and the board side by side in
  `.play-board`, then the button row, then the status line, then the hint sentence
  when there is one. Copied from the trainer's Play screen with the report removed.
- **Sidebar** (`.sidebar`): the three settings, the two file buttons, and the move
  list under them, filling the rest of the column. The sidebar is as tall as the
  board column, so the move list grows when the board does.

**S1. One screen, no navigation, no modes.** The brief says everything lives on the
landing page. A second screen is a place for a control to hide.

### 4.2 Sizes

All in CSS pixels. The numbers come from the trainer and the reasons travel with them.

| Thing | Small | Large | Why |
|---|---|---|---|
| Board | 416 | up to 832 | 416 divides by eight, so chessground's squares fill the box and the bar ends where the board does (the trainer's `board-size.ts`). 832 is double, and is a ceiling rather than a promise: the large board is whatever fits and draws whole squares at the display scale in use (S2). |
| Bar width | 24 | 24 | The trainer's bar is 16 px and carries no number. This one carries "+0.4" at 10 px, which needs 24. |
| Gap, bar to board | 20 | 20 | 24 + 20 = 44, so the button row's left margin (44 px, the trainer's number) still starts under the board's left edge. |
| Gap, board column to sidebar | 24 | 24 | The trainer's `.play-body` gap. |
| Sidebar width | 280 | 280 | Wide enough for "8. Unpleasant" in the select and two buttons side by side. |
| Page padding | 24 | 24 | The trainer's `.app`. |

The page is therefore about 1230 px wide with the large board, and the Windows window
opens at 1280 by 1000 (section 11.1).

**S2. The large board is the largest board that fits and draws whole squares, up to
832.** Landscape iPad screens are 768 or 820 px tall in CSS pixels, so 832 cannot fit
there. The size is worked out from the viewport: the smaller of 832, the width left
beside the bar, the padding and the sidebar, and the height left under the header and
above the button row and the status line. It is then stepped down in eights until the
squares come out whole, and never below 416. The same code runs on both platforms and
needs no platform check. The board is re-measured when the window, the orientation or
the display scale changes.

Whole squares is TWO conditions. A multiple of 8 in CSS pixels, and a whole number of
DEVICE pixels per square. The second was missed until phase 3 drew a large board on a
screen at 150%: chessground floors each square to whole device pixels, so 808 wanted
squares of 151.5, got 151, and drew a 805.33 board inside an 808 box. The bar is
stretched to the box, so it ended 2.67 px below the board, which is what S16 forbids
and exactly the overrun 416 was chosen to avoid in the first place. 416 never showed
it because 416 is a multiple of 32, so every scale this app meets divides it whole.

**The numbers therefore depend on the display scale**, and one rule still covers every
case. At 100% and 200%: 808 in the 1280 by 1000 window, 624 on a landscape iPad, 728
upright. At 150%: 800, 624 and 720. At 125%: 800, 608 and 704.

(Corrected twice. Gate 2 struck the first text, which said the Windows window "is big
enough and the answer is 832": measured in phase 2, the header and the padding take
80.67 px above the board and the buttons, the status line and the padding 109.33 px
below it, so a 1000 px window leaves 810. Nick then ruled on 2026-09-12, on the
device-pixel finding above, that "the double size doesn't need to be taken literally",
which supersedes Q3's "832 px on Windows": the point of the number was always a board
the bar ends level with, and 832 remains the ceiling rather than a promise.)

### 4.3 The narrow layout

Below 900 px of viewport width (an iPad held upright, or a narrow window), the
sidebar moves under the board column and takes the full width. The move list then
shows ten rows and scrolls. This is the same breakpoint the trainer and Conquest use.
Nothing is hidden; it only moves.

The page must never scroll sideways at any viewport this app is used at (section 15
measures this). It may scroll down.

### 4.4 iPad specifics

- Safe-area padding on the page, as Conquest's `.board-page` does, so the board keeps
  clear of the rounded corners and the home indicator.
- `viewport-fit=cover` and the two `mobile-web-app-capable` meta tags in
  `index.html`, and the `theme-color` meta, copied from Conquest.
- Chessground already handles touch and mouse through pointer events and sets
  `touch-action: none` on the board. Nothing extra is needed for dragging pieces.
- Buttons are at least 36 px tall so a finger can hit them.

### 4.5 Theme

Dark by default, light on the toggle, remembered. The trainer's `index.css` palette
and `theme.ts` are copied unchanged, with the storage key renamed (section 10). The
board keeps its own brown colours in both themes, as the trainer's does, and the bar
uses the two piece colours (`--piece-white`, `--piece-black`), never theme colours.

---

## 5. The game

### 5.1 Starting

On open, the app shows the remembered game if there is one (section 10), otherwise a
fresh game. A fresh game starts from the initial position with the user on the
remembered side at the remembered level. If the side is Black, the engine moves first
at once.

**New game** throws the current game away with no confirmation and starts a fresh one
from the current settings. The trainer has no confirmation on New game either, and the
brief asks for no frills.

### 5.2 Playing a move

The user drags or clicks a piece. Chessground is given only the legal destinations
(`legalDests`), so an illegal move snaps back. The board is locked while the engine
thinks and once the game has ended: `movableColor` is undefined then, exactly as the
trainer's Play screen does it.

After the user's move: the bar is brought up to date for the new position, then the
engine replies at the current level, then the bar is brought up to date again. This
is the trainer's `play` in `play-context.tsx`, kept in that order for the reason it
gives there: the bar answers the move that was just played before the reply lands.

### 5.3 Promotion

When a pawn move reaches the last rank, a picker appears over the board offering
queen, rook, bishop and knight, drawn with the board's own piece set, in the promoting
colour. Choosing one completes the move. Clicking anywhere else cancels the move and
the pawn goes back. Nothing is played and the engine is not asked until a piece is
chosen.

**S4. A picker, not an automatic queen.** The trainer auto-queens because its
repertoires never need anything else. A game player does. Nick ruled it (Q10).

### 5.4 Undo and redo

Copied from the trainer's `PlaySession`, unchanged in meaning apart from the floor:

- Undo takes the game back to the last position where it was the user's move. In the
  ordinary case that is the engine's reply and the user's move before it. When the
  game has just ended on the user's own move, it is that one move.
- Redo puts back what undo took off, up to the user's next turn.
- Undo goes back through every move, including the moves a game arrived with. A
  game from storage or from a file is the game, not a floor under it, which is the
  one way this differs from the trainer: there the moves a session is given are an
  authored line an exercise is set up on. (Corrected in phase 5. The floor was
  copied in phase 2 and made Undo do nothing at all on a reopened game, which
  contradicts 9.2's "undo along it".)
- Neither waits for the engine. A position played through has already been
  evaluated, so the bar follows for free; a position from a game that arrived
  whole has not, and undo and redo fetch its number behind them without a
  thinking state (9.2, ruled at gate 4).
- A new move after an undo clears the redo stack.
- Both are disabled while the engine thinks, and when there is nothing to do.
- Undo clears any outcome and works it out again, so a game undone out of a
  checkmate is a game again.

### 5.5 How a game ends

The game ends by itself on checkmate, stalemate, insufficient material, threefold
repetition or the fifty-move rule. The status line says the outcome in the trainer's
words, from the copied `outcome.ts`, judged from the user's side:

- "You won by checkmate" / "You were checkmated"
- "Drawn by stalemate"
- "Drawn: neither side has enough to mate"
- "Drawn by repetition"
- "Drawn by the fifty move rule"

The board locks. Undo still works, so the user can take the last move back and try
again. New game starts over. There is no resignation, no draw offer and no move cap.

### 5.6 The status line

One line under the button row, from the trainer's `PlayHead` wording:

- "Your move" while the user is to move.
- "White is thinking..." or "Black is thinking..." while the engine is.
- The outcome once the game has ended.
- An engine error, in the trainer's `notice bad` style, if the engine fails to
  start or answer. The app stays usable; New game tries again.

### 5.7 The move list

The trainer's `MoveList`, copied: numbered rows, White and Black in two columns,
tabular figures, the thin scrollbar rules for WebView2. It is a record only. Moves are
not buttons and clicking one does nothing, because the trainer only makes them buttons
inside a review, which this app does not have. The list scrolls to keep the last move
in view.

---

## 6. The engine and the levels

### 6.1 The engine

Stockfish 18, the single-threaded lite WASM build from the `stockfish` npm package,
copied into `public/engine/` at build time by the trainer's `scripts/copy-engine.mjs`.
It runs in a web worker and speaks UCI. `src/engine/` is copied from the trainer
unchanged: `stockfish.ts` (the worker with a promise queue), `uci.ts` (the protocol
parsing), `strength.ts` (the levels), `index.ts`.

One worker lives as long as the app does. New game sends `ucinewgame` rather than
stopping and restarting the worker.

**S5. One worker for the life of the app.** The trainer stops the worker on New game
and starts a fresh one for the next game, which costs a second of "Starting the
engine..." each time. A simple player starts games often. The engine's `newGame()`
exists for exactly this, and the trainer's provider already calls it.

### 6.2 The levels

The trainer's eight, from `strength.ts`, with the same names, the same one-line
descriptions and the same engine settings:

| Level | Name | How it plays |
|---|---|---|
| 1 | Very casual | Full strength, 50 ms, picks at random from five candidates |
| 2 | Casual | 80 ms, from four |
| 3 | Improving | 150 ms, from three |
| 4 | **Club** (default) | The engine's own limiter at 1320, 200 ms |
| 5 | Club, stronger | Limiter at 1500, 250 ms |
| 6 | Strong club | Limiter at 1750, 300 ms |
| 7 | Tough | Limiter at 2100, 400 ms |
| 8 | Unpleasant | Limiter at 2500, 600 ms |

The sidebar shows the level in a select, exactly as the trainer's "How strong"
fieldset does, with the level's one-line description under it. The trainer's second
line, that the numbers are the engine's own scale, stays too.

**S6. A level change applies to the engine's next move.** The trainer fixes the level
when a game starts because its record and report name one level per game. This app
records nothing, and "make it easier from here" is the obvious thing a player wants.
The session gets a `setProfile` method; the engine is told the new strength before
its next search. A change made while the engine is already thinking takes effect on
the move after that one.

### 6.3 The analysis profile

Level 8, one candidate, 150 ms: the trainer's `analysisProfile()`. Every evaluation
for the bar and every hint is made with it, and the playing profile is put back
afterwards in a `finally`, for the reason the trainer gives: the engine is one worker
with a promise queue, and a search that threw without restoring the profile would
leave the opponent playing the rest of the game at level 8.

---

## 7. The bar

The trainer's live evaluation bar (`evalbar.ts`, `LiveEvalBar`, `.live-eval`),
copied, with the number added.

- Vertical, to the left of the board, exactly the board's height, 24 px wide.
- White's share of the bar is `50 + 50 * tanh(pawns / 3)` percent, the trainer's
  squash, drawn in `--piece-white` against `--piece-black`.
- It follows the board's orientation: the user's colour is at the bottom, so a bar
  growing towards the user always means the same thing.
- It holds its last value while the engine thinks, per the trainer's
  `shownEvaluation`: a bar that blanks itself twice a move is harder to read than one
  a moment behind.
- Before the first evaluation arrives it shows a level bar and no number.

**S7. The number, and no words.** Nick ruled it (Q4). The number is the evaluation in
pawns from White's point of view, one decimal, with a sign: `+0.4`, `-1.2`, `0.0`.
A forced mate is `M5` when White mates and `-M5` when Black does. The number sits
inside the larger share, at that share's outer end, in the other piece colour, 10 px
bold with tabular figures. A screen reader gets the same text as the bar's accessible
name ("Evaluation: +0.4").

To show a mate count the evaluation has to keep more than the pawns. The evaluation
map holds `{ pawns, text }` per position, both worked out once from the engine's
`Score` and the side to move at the moment the search answers: `pawns` drives the
share as it always did and `text` is the string the bar prints. `whitePovPawns` is
unchanged and still turns a mate into plus or minus 100 for the share. (Written as
`{ pawns, score }` until gate 0; a `Score` alone cannot give the sign, because the
engine reports mate from the side to move, so the text is made where the side is
known.)

---

## 8. Hint

The trainer's engine hint, without the book half:

- Only while it is the user's move and the game has not ended. The button is disabled
  otherwise, and while the engine thinks.
- The engine searches the position with the analysis profile for 500 ms (the
  trainer's `HINT_MOVETIME`).
- The suggested move is drawn as a blue arrow on the board and said under the status
  line: "The engine suggests Nf3." The trainer's `engineHint` text has a second
  sentence about the repertoire ending; that sentence goes, because there is no
  repertoire.
- The arrow and the sentence go away when anything moves the board: a move, undo,
  redo, New game or Load game.

Hints are not counted. The trainer counts them for its report, and there is no
report.

---

## 9. Save game and load game

### 9.1 The file

A PGN file, written by the trainer's `Movetext` writer and `pgnTag`, in the trainer's
tag layout:

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

- `Event` is the app name. `Site` and `Round` are the standard's "-" for not
  applicable; nothing is invented to fill a slot. `Date` is today in the standard's
  form, from the trainer's `pgnDate`.
- `White` and `Black` are "You" and "Stockfish level N", the trainer's exact strings.
  They are how Load game learns the side and the level.
- `Result` is `1-0`, `0-1`, `1/2-1/2` or `*`, from the trainer's `pgnResult`, judged
  from the outcome and the user's colour.
- One closing comment: the outcome sentence when the game ended, otherwise "Stopped
  after move N", then "White was played by you at level N." with full stops between,
  as the trainer writes it. No other comments: the trainer's others describe its
  report.
- The result token ends the file.

The default file name is `simple-chess-YYYY-MM-DD-HHMM.pgn`, stamped from the clock,
so repeated saves do not collide in a downloads folder.

### 9.2 Loading

Load game reads a PGN file with the trainer's `parsePgn` (`src/model/pgn.ts`), which
keeps variations and reports every fault in a file. This app takes the first game's
main line and ignores variations and comments.

- The moves are replayed with chess.js. A file whose moves do not make a legal game is
  refused with the parser's message, or "That file's moves do not make a legal game",
  in the status line. The current game is untouched.
- The side is Black when the `Black` tag is "You", otherwise White. So a file from
  another program loads with the user as White.
- The level is the number in "Stockfish level N" when the other player's tag has it
  and N is 1 to 8. Otherwise the current level stays.
- The loaded game replaces the current one with no confirmation, and the side and
  level it carries become the current settings. If the loaded position is the
  engine's move, the engine moves at once.
- The loaded game is evaluated at its final position, like a game reopened from
  storage. Undo along it has a bar to show because undo and redo evaluate the position
  they land on when it has no number yet (ruled at gate 4). The first text here said
  every position would be scanned on load, as the trainer does for its report; a
  scan of eighty positions holds the engine's queue for twelve seconds before the
  user's next move can be answered, and an evaluation made when a position is looked
  at costs 150 ms once and is never wasted.

**S8. Load takes the main line and nothing else.** The trainer's parser exists to keep
a repertoire's tree. A saved game is a line. Variations in a foreign file are not an
error and are not a second game either; they are simply not this app's business.

### 9.3 Where the file goes

The trainer's `backup.ts` pattern, one pair of functions behind which the screen does
not care where it is running:

- **Desktop**: Save opens the Tauri save dialog with the default name and a `.pgn`
  filter, and writes the file with the fs plugin. Load opens the open dialog with the
  same filter and reads the file. The capabilities allow `dialog:allow-open`,
  `dialog:allow-save`, and text read and write under `$HOME/**`, as the trainer's do.
- **Browser and iPad**: Save makes a blob download with the default name; Safari on
  iPad puts it in Files under Downloads. Load is a hidden `<input type="file"
  accept=".pgn">` that the button clicks.

Both buttons are disabled while the engine thinks.

---

## 10. What is remembered

Every setting is remembered between sessions, the way the trainer's `prefs.ts` and
`theme.ts` remember theirs: in `localStorage`, read once when the app starts, written
on every change, and every read and write wrapped so a browser that refuses storage
still runs the app.

| Key | Values | Default |
|---|---|---|
| `simple-chess.theme` | `dark`, `light` | `dark` |
| `simple-chess.level` | `1` to `8` | `4` |
| `simple-chess.side` | `white`, `black` | `white` |
| `simple-chess.board-size` | `small`, `large` | `small` |
| `simple-chess.game` | the current game as JSON | none |

The current game is `{ "version": 1, "sans": [...], "side": "white", "level": 4 }`,
written after every move, undo, redo and load, and removed by New game when the fresh
game has no moves yet. On start the app replays the stored moves; a stored game that
does not replay is discarded silently and a fresh game starts, the same rule
Conquest's `recallSetup` applies to anything read back from storage. The stored game
carries its own side and level so that a game loaded from a file and closed reopens
as it was.

**S9. The game is remembered, and nothing else about it is kept.** No list of past
games, no history, no progress file. Save game is how a game leaves the app. The
trainer's progress file, its marker and its backup copy, its data folder and its
migration are all absent, because there is nothing to protect: the only durable thing
the app holds is one game, and the user can save it.

On Windows `localStorage` lives in the WebView2 profile under `%LOCALAPPDATA%\Simple
Chess Data\WebView2`, which survives an upgrade and goes on a ticked uninstall
(section 11.3). The trainer's `prefs.ts` explains why that is the right life for a
preference.

---

## 11. Windows: the installed app

Copied from `../London/src-tauri` with the names changed. Nothing about the approach
changes.

### 11.1 The window

- Title "Simple Chess". Opens at 1280 by 1000, minimum 960 by 720, centred,
  resizable. 1280 fits the large board with the sidebar (section 4.2). 1000 is the
  most a 1080-line display leaves under its taskbar and title bar; at that height the
  large board fits at 808 by the rule in S2, and a taller window gets the full 832.
- Declared in `tauri.conf.json` with `"create": false` and built in `lib.rs` from that
  same declaration, so that the WebView2 profile can be pointed at
  `%LOCALAPPDATA%\Simple Chess Data\WebView2`. The trainer's `lib.rs` says why: the
  default is a folder named after the identifier, and a person reads folder names.
- Release builds open no console window (`main.rs`).

### 11.2 The installer

- Tauri's NSIS bundler, `installMode: currentUser`, as the trainer. Unsigned, so
  SmartScreen warns on first run; the trainer's register records this and it is
  accepted here.
- The version is one number in three files (`package.json`, `tauri.conf.json`,
  `Cargo.toml`), shown in the header as `__APP_VERSION__` from Vite's `define`, and
  held together by the trainer's `version.test.ts`, copied.
- The icon set in `src-tauri/icons/` is generated with `npx tauri icon` from the same
  source image the PWA icons come from (section 12.3).

### 11.3 The uninstaller

The trainer's `installer-hooks.nsh` and `scripts/check-uninstall-hook.mjs`, copied,
with one folder: `$LOCALAPPDATA\Simple Chess Data`. There is no roaming data folder in
this app, so the hook names one folder rather than two.

**S10. The hook stays, with one folder.** Tauri's own uninstall block offers to remove
the app's data and removes the identifier-named folders, which this app does not use.
The trainer's reason stands: an offer that does not do what it says is worse than no
offer at all. The guard (`$DeleteAppDataCheckboxState = 1` and `$UpdateMode <> 1`) is
not optional, and the check script proves all four cases against scratch folders as
the trainer's does.

### 11.4 Capabilities

`src-tauri/capabilities/default.json` grants `core:default`, `dialog:allow-open`,
`dialog:allow-save`, `fs:allow-read-text-file` and `fs:allow-write-text-file` under
`$HOME/**`, and nothing else. The trainer's many data-folder grants do not apply. The
`fs` plugin's `requireLiteralLeadingDot: false` is kept so a file in a dot-folder can
be chosen.

---

## 12. iPad: the Home Screen app

Copied from Conquest with the names changed.

### 12.1 The PWA

- `vite-plugin-pwa` with `registerType: 'prompt'` and `injectRegister: null`, and
  Conquest's `useUpdate` hook and `UpdateBanner`, so a new version is offered rather
  than forced. The banner's wording changes: because this app remembers the game
  (section 10), loading a new version costs nothing, and the banner says so with one
  sentence and a "Load it" button. Conquest's mid-game warning does not apply.
- The manifest: name and short name "Simple Chess", `display: standalone`,
  `orientation: any`, `background_color` and `theme_color` the dark ground
  `#16181c`, icons at 192 and 512 plus a maskable 512.
- The service worker precaches `**/*.{js,css,html,png,svg,webmanifest,wasm}`.

**S11. The engine must be in the precache, and it is bigger than the default limit.**
The Stockfish WASM file is about 7 MB and Workbox refuses to precache any file over
2 MiB unless told otherwise. `maximumFileSizeToCacheInBytes` is set to 12 MiB. Without
it the game opens offline and the engine never answers, which is the failure that
looks most like "the app is broken". The offline proof in the plan plays a full move
against the engine with the server stopped, for exactly this reason.

**S12. The service worker is not registered inside the Tauri window.** `useUpdate` is
called only when `!isDesktop()`. A WebView2 app updates by installer, and a service
worker holding an old bundle inside it would make "new code reaches the window after
a reinstall" untrue.

### 12.2 Hosting

Cloudflare Pages, project `simplechess`, built from the private GitHub repository
`nick2468/SimpleChess` on `main` with `npm run build` into `dist`, Node 22.12.0 from
`.node-version` and a `NODE_VERSION` build variable, custom domain
`simplechess.datacrafter.net`. Every push to `main` rebuilds and republishes.

These are Nick's steps, with his accounts. `docs/simple-chess-deploy.md`, adapted from
Conquest's deploy document, walks him through them and through adding the app to the
Home Screen and proving it offline.

### 12.3 Icons

`tools/make-icons.mjs`, adapted from Conquest's, draws the icon with `sharp` from an
SVG in `public/icon.svg` (a single knight in the piece-white colour on the dark
ground) and writes `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` and
`favicon-32.png` into `public/`. The output is committed, as Conquest's is. The same
SVG is the source for `npx tauri icon` (section 11.2), so both platforms show one
icon.

---

## 13. Architecture and folder layout

### 13.1 The stack

React 19, TypeScript, Vite 8, vitest 4, chessground 9, chess.js 1.4, `stockfish` 18,
Tauri 2 with the `dialog` and `fs` plugins, `vite-plugin-pwa`, `oxlint`. The versions
are the trainer's `package.json` as of 2026-09-11 plus Conquest's `vite-plugin-pwa`
and `sharp`. `ts-fsrs` and `react-markdown` are not needed and not installed.

### 13.2 Folder layout

```
SimpleChess/
  CLAUDE.md                       house rules for sessions in this folder
  README.md
  SimpleChess-brief.txt           Nick's brief, kept for history
  docs/
    simple-chess-spec.md          this file
    simple-chess-build-plan.md    the phases and their boxes
    simple-chess-deploy.md        Nick's Cloudflare and iPad steps (phase 7)
    testing.md                    the two kinds of test and the rules (phase 0)
  chips/                          one prompt per build phase, written by the orchestrator
  public/
    icon.svg, icon-*.png, apple-touch-icon.png, favicon-32.png
    engine/                       gitignored; copy-engine.mjs fills it
  scripts/
    copy-engine.mjs               London, identical
    packaged-eval.mjs             London, identical
    check-uninstall-hook.mjs      London, one folder
    probes/layout.js              the layout probe (section 15)
  tools/
    make-icons.mjs                Conquest, adapted
  src/
    main.tsx
    index.css                     London, identical
    globals.d.ts                  London, identical
    version.test.ts               London, identical
    engine/                       London, identical: stockfish.ts, uci.ts, strength.ts, index.ts, engine.test.ts
    model/
      position.ts                 London, identical
      pgn.ts                      London, identical (the parser and the writer)
      types.ts                    London, cut to Colour, Brush, Shape and colourName
    play/
      session.ts                  London, adapted: no book, setProfile, promotion, and replayed moves are not a floor
      evalbar.ts                  London, adapted: an evaluation is { pawns, text }, and the number has a place
      outcome.ts                  London, identical
      analysis.ts                 London's analysis profile and movetimes, plus atAnalysisProfile
      game-pgn.ts                 London, adapted: seven tags, one closing comment, and saveFileName is new
      load-pgn.ts                 new: main line, side and level from a parsed file
      level.ts                    a level arriving from a setting, a record or a file
      replay.ts                   London's canReplayMoves, cut to the check
      hint.ts                     London, cut to the engine hint and its one sentence
      index.ts
    storage/
      prefs.ts                    London's shape, this app's keys
      current-game.ts             new: the remembered game
      files.ts                    London's backup.ts pattern: save and open a .pgn
      paths.ts                    London, cut to isDesktop; LOCAL_FOLDER arrives with the window in phase 8
    ui/
      App.tsx                     the shell: header, theme, the one screen
      Board.tsx                   London, adapted: a size effect (phase 3; the board changes size while mounted)
      board.css                   London, identical
      board-size.ts               London, plus the large size and the fit rule
      use-board-pixels.ts         new: measures the viewport and the display scale for the fit rule
      theme.ts                    London, adapted: the key, and the storage goes through prefs.ts
      play-context.tsx            London, adapted: no book, no report, no record
      Screen.tsx                  the board column and the sidebar
      PlayControls.tsx            London's PlayControls, row one only
      MoveList.tsx                London's MoveList, record only
      EvalBar.tsx                 London's LiveEvalBar, with the number
      PromotionPicker.tsx         new: the four pieces, drawn by the board's own stylesheet
      chessground-piece.d.ts      new: the <piece> element, for TypeScript
      Sidebar.tsx                 new: the settings, the file buttons
      StatusLine.tsx              London's PlayHead, cut to the line and the Notice under it
      message.ts                  new: something thrown, as a sentence for the screen
      UpdateBanner.tsx, useUpdate.ts, updates.ts   Conquest, adapted wording
      app.css, play.css           London, cut to what this screen uses
    dev/
      scenes.ts                   the dev-only scene setup (section 15)
    test/
      fake-engine.ts, dom-setup.ts   London, identical
      board-stub.tsx, dom.tsx        London, adapted (the stub reports its orientation; dom.tsx can seed a game)
      scripted-engine.ts             new: an engine that plays a script, for a mate in a test
      by-profile.ts                  new: a fake that answers moves and analysis differently
      held-engine.ts                 new: a fake whose move waits, for reading the screen mid-move
      played-moves.ts                London's game-pgn.test.ts playedMoves: SANs as the session played them
  src-tauri/                      London, names changed, capabilities cut
  .claude/launch.json             simple-chess-dev on 5185, simple-chess-preview on 5186
```

**S3. Identical where unchanged, one origin line everywhere.** Nick prefers copied
code and may share a library with the trainer later (Q13). So a file whose behaviour
this app does not change is copied byte for byte, and the only addition is one line
at the top of its header comment: `Origin: London src/engine/uci.ts, identical.` A
file this app adapts says `Origin: London src/play/session.ts, adapted: ...` with
the change in a few words, and its comments describe this app rather than the
trainer's phases. When the shared library comes, the identical files move and the
adapted ones are the diff.

**S13. The trainer's module boundaries are kept.** `src/engine`, `src/model` and
`src/play` import no React and touch no browser global except the worker in
`stockfish.ts`; `src/ui` holds every component; `src/storage` is the only place that
reads or writes storage or files. The reason is the trainer's: the pure modules are
tested in milliseconds without a browser, and the two platform wrappers touch only
`src/storage` and the build config.

**S14. Tauri and PWA APIs are imported lazily.** `@tauri-apps/*` is imported with
`await import(...)` behind `isDesktop()`, as the trainer does, so the browser bundle
never pulls in an API that is not there; `virtual:pwa-register/react` is used only
from `useUpdate`, which is called only off the desktop.

### 13.3 Code quality

These bind from the first line. They are the brief's rules, made specific:

- One implementation per algorithm. The shared homes are the copied ones: `legalDests`
  and `sideToMove` in `position.ts`; `squaresForSan`, `sanForMove` and `isPromotion`
  for turning board moves into chess moves; `Movetext` and `pgnTag` for writing PGN;
  `parsePgn` for reading it; `outcomeOf` for every outcome sentence; `evalShare` for
  the bar's arithmetic; `levelName` for naming a level; the read and write helpers in
  `prefs.ts` for every stored setting. Never write a second copy of any of these.
- A snippet that appears twice gets a home the moment it appears twice.
- `main.tsx` stays free of harness code. The dev scenes live in `src/dev/` and are
  reached through one dev-only hook (section 15).
- Every phase closes with a reuse and duplication review of the new code, refactored
  on the spot before the phase commit.
- No em dashes under `src/`. Australian English on screen and in docs. Plain hyphens.
- `tsc -b` clean and the whole suite green before every commit.

---

## 14. Testing

The trainer's two kinds of test, in two vitest projects declared in `vite.config.ts`,
under one `npx vitest run`. `docs/testing.md` is the trainer's, adapted, and its rules
bind here:

- **String tests** (`src/**/*.test.ts`) run in node. The engine parsing, the levels,
  the session, the outcome sentences, the bar arithmetic, the PGN writer and reader,
  the stored-game and preference helpers are all covered here, with the engine faked.
- **DOM tests** (`src/**/*.dom.test.tsx`) run in jsdom, mount the real app with the
  real providers, and drive it with `user-event`. The board is the trainer's stub
  (one button per legal move, the position and the arrows as data attributes) and the
  engine is the trainer's `fakeEngine`. One DOM test installs a throwing `Worker` and
  asserts it was never constructed, so a real engine can never creep into the suite.
- No snapshots. No fake timers. No worker. The whole suite under twenty seconds.
- A regression test is shown red first, against the bug, before the fix lands.
- `version.test.ts` holds the version in its three files.

**S15. The tests the app must have before it is done.** Listed here so the plan can
tick them and a review can look for them:

1. Undo goes back in pairs, redo puts them back, and an undo out of checkmate clears
   the outcome (session, string test).
2. A promotion move is not played until a piece is chosen, and cancelling puts the
   pawn back (DOM test).
3. A level change reaches the engine before its next search (session, string test with
   a recording fake engine).
4. The bar's number: `+0.4`, `-1.2`, `0.0`, `M5`, `-M5`, and the share for each
   (string test).
5. A saved game round-trips: save, load, same moves, same side, same level (string
   test on the writer and reader together).
6. A foreign PGN with variations loads its main line with the user as White; an
   illegal file is refused and the current game is untouched (string test).
7. The remembered game reopens after a reload; a scrambled stored game is discarded
   silently (DOM test).
8. Every setting is remembered across a remount (DOM test).
9. Play as Black: the engine moves first after New game; the board is flipped and
   the bar's White share is at the top (DOM test).
10. New game clears the hint, the outcome and the redo stack (DOM test).
11. The large board size on a small viewport is a multiple of 8 that fits (string test
    on the fit function with given viewport numbers).

---

## 15. Verification by screenshot

A change a person can see is checked by looking at it, in the same phase, the way
the trainer's phases did: the build session drives the app in the pane, screenshots
it, measures it, and records the numbers in the plan. Nick ruled that the method is
the trainer's (Q11): no new tool. The brief keeps one rule about it, that demos and
captures live in a dev harness and never in the entry point. What the trainer did,
made a practice with names:

### 15.1 Scenes

In development builds only, the app reads the address bar for a scene:

```
http://localhost:5185/?scene=midgame&size=large&theme=light&side=black
```

- `scene`: `fresh` (the start position), `midgame` (a fixed 20-move game, played
  through the session so the move list and the bar are real), `mate` (a fixed game
  ending in checkmate, so the outcome shows), `promotion` (a position with a pawn
  one step from promoting, so the picker can be opened), `hint` (`midgame` with a
  hint already asked).
- `size`, `theme`, `side`: the three settings, overriding storage for that load.

The scenes live in `src/dev/scenes.ts` and are applied by one hook, `useDevScene`,
that does nothing unless `import.meta.env.DEV` is true and a `scene` is present. The
production bundle carries none of it, which Vite's dead-code removal guarantees when
the check is on `import.meta.env.DEV`. This is the trainer's dev-only `Diagnostics`
view and `trustAllEvents` in `Board.tsx`, applied to scenes instead of a screen.

### 15.2 Screenshots

The build session opens each scene in the pane and screenshots it. The set a
UI-affecting phase captures, and records in the plan's phase notes:

| Viewport | Why |
|---|---|
| 1280 by 1000 | The Windows window as it opens |
| 1180 by 820 | An iPad in landscape |
| 820 by 1180 | An iPad held upright: the narrow layout |

Each at both board sizes and both themes where the phase touched either. The pane
caps its viewport at 1280 wide, which is why the window is 1280 and not wider.

### 15.3 The layout probe

`scripts/probes/layout.js` is one JavaScript expression that returns, as JSON, the
bounding boxes of `.board`, `cg-board`, `.live-eval`, `.play-controls`, `.sidebar`
and `.move-list`, and `document.documentElement.scrollWidth` beside
`window.innerWidth`. It is evaluated two ways:

- in the pane, through the JavaScript tool, during development;
- against the installed app, through `node scripts/packaged-eval.mjs
  @scripts/probes/layout.js` with the window started under
  `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"`, as the
  trainer's script documents. `--shot file.png` captures the installed window.

**S16. The two numbers that must hold.** The bar, the board box and `cg-board` are
the same height and end on the same pixel (the trainer's phase 26 finding), and
`scrollWidth` never exceeds `innerWidth` at any of the three viewports (no sideways
scroll). Every UI-affecting phase records the probe's output for its viewports in the
plan, and a review re-runs it.

---

## 16. Left out on purpose

Each of these exists in the trainer or Conquest and is deliberately not here, so that
"we chose not to" never gets confused with "we forgot".

| Left out | Why |
|---|---|
| Courses, Study, Drill, the book that steers the opponent | The brief: a plain chess player. |
| The post-game report, the blunder scan, verdicts in words | No report. The bar with its number is the whole evaluator. |
| Recorded games, Progress, replay, "play from here" | S9: the app keeps one game, and Save game is how a game leaves it. |
| Help screen | The brief: the user knows chess and the screen is obvious. |
| A move cap ("to move 10") | The trainer caps games to train openings. |
| Resign, draw offer, clocks | Not asked for. A game ends by the rules or by New game. |
| Random side | Nick did not take it up (Q6). |
| Sounds and animations beyond chessground's own | Conquest's are for a board game with dice. |
| Auto-update on Windows, code signing | The trainer's register defers both; unchanged here. |
| Copy game to the clipboard | Save game covers it. Cheap to add later from the trainer's `CopyGame`. |
| Several games on separate devices | Conquest's phase 6 needs a server. Not this app. |

---

## 17. Acceptance

The app is done when every line below is true, checked and recorded in the plan.

1. **The screen**: one screen with the header, the bar, the board, the four buttons,
   the status line, the sidebar's three settings and two file buttons, and the move
   list, laid out as section 4 says, at both board sizes and both themes, at the
   three viewports of section 15, with the probe's two numbers holding (S16).
2. **A game**: the user plays White to checkmate at level 4 and sees "You won by
   checkmate"; plays Black and the engine opens; undo and redo behave as section 5.4;
   a promotion offers the picker and plays the chosen piece.
3. **Levels**: all eight are offered, Club is the default on a fresh install, and a
   change mid-game is heard by the engine's next move.
4. **The bar**: follows every move, holds its value while the engine thinks, shows the
   number with the right sign and orientation, and shows `M` for a mate.
5. **Hint**: draws the arrow and says the move; is disabled when it should be.
6. **Save and load**: a saved file reads as section 9.1; loading it restores the
   moves, side and level on both platforms; a foreign PGN loads its main line; a bad
   file is refused and the game is untouched.
7. **Remembered**: every setting and the game in progress survive closing and
   reopening the app on both platforms.
8. **Windows**: the installer builds, installs for the current user, opens a 1280 by
   1000 window titled Simple Chess with the version in the header, and the
   uninstaller's ticked box removes `Simple Chess Data` and nothing else, proved by the
   check script's four cases.
9. **iPad**: the site is live at `simplechess.datacrafter.net`, adds to the Home
   Screen with the icon, and plays a full move against the engine in aeroplane mode
   after one online visit. The update banner offers a new version and loads it on
   request.
10. **Tests**: the suite is green under twenty seconds, both projects, with the
    eleven tests of S15 present; `tsc -b` clean; no em dashes under `src/`; the
    version held in three files.
11. **Docs**: this document, the plan with every box ticked or its gap recorded, the
    deploy document, `testing.md`, and `CLAUDE.md` all current.
