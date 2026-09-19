# Simple Chess - specification

Version 2, 2026-09-13 (version 1 shipped 2026-09-12 as 1.0.0). Written by the
orchestrator session from Nick's brief (`SimpleChess-brief.txt`) and his rulings
(section 2, then section 18). Sections 1 to 17 specify version 1 and stay true;
**section 18 specifies version 2, the sibling of the trainer's Play screen, section 19
specifies versions 1.2.0 and 1.2.1, which made room for the report, section 20 specifies
1.3.0, where the window matches the board, section 21 specifies 1.3.1 and 1.3.2, which give
that window the room the layout actually needs, section 22 specifies 1.4.0, where the
window opens at the size the remembered board needs, and section 23 specifies 1.4.1,
where the report scrolls in its own column. A later section wins over an earlier one
wherever they differ.** The product is now called **Simply Chess**; the earlier sections
keep the old name as history.

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

(**The prefix is `simply-chess.` from phase 9**, with the rename of 18.2. Nobody had
data under the old keys, so nothing is migrated and nothing is read twice.)

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

  (**Superseded by 18.1 in phase 9.** The title is "Simply Chess" and the window
  opens at **1400 by 980**, the trainer's size, minimum 960 by 720 unchanged. 1400
  fits the large board with the move list column and the side panel; 980 is the
  trainer's height. The chrome above and below the board grew with the selector row,
  the head row and the counted review row, so the large board there is 688 at a
  display scale of 1 or 1.5 and 672 at 1.25, measured in phase 9.)
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
`nick2468/SimpleChess` on `main` with `npm run build` into `dist`, Node 24.21.0 from
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
    vite-env.d.ts                 Conquest, adapted: the two references only (phase 7)
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
      prefs.ts                    London's shape, this app's keys; oneOf, and one remember function per setting
      current-game.ts             new: the remembered game
      files.ts                    London's backup.ts pattern: save and open a .pgn
      paths.ts                    London, cut to isDesktop and LOCAL_FOLDER (phase 8)
      local-folder.test.ts        new: holds the folder name across paths.ts, lib.rs and the hook (phase 8)
    ui/
      App.tsx                     the shell: header, theme, the one screen
      Board.tsx                   London, adapted: a size effect (phase 3; the board changes size while mounted)
      board.css                   London, identical
      board-size.ts               London, plus the large size and the fit rule
      use-board-pixels.ts         new: measures the viewport and the display scale for the fit rule
      theme.ts                    London, adapted: the key, the storage goes through prefs.ts, THEMES and rememberTheme
      play-context.tsx            London, adapted: no book, no report, no record
      Screen.tsx                  the board column and the sidebar
      PlayControls.tsx            London's PlayControls, row one only
      MoveList.tsx                London's MoveList, record only; it scrolls itself and nothing above it
      keep-in-view.ts             new: how far a list scrolls to show a row (phase 6 found scrollIntoView scrolling the screen)
      EvalBar.tsx                 London's LiveEvalBar, with the number
      PromotionPicker.tsx         new: the four pieces, drawn by the board's own stylesheet
      chessground-piece.d.ts      new: the <piece> element, for TypeScript
      Sidebar.tsx                 new: the settings, the file buttons
      StatusLine.tsx              London's PlayHead, cut to the line and the Notice under it
      message.ts                  new: something thrown, as a sentence for the screen
      UpdateBanner.tsx, useUpdate.ts, updates.ts   Conquest, adapted wording
      UpdateWatch.tsx             new: the banner behind the one condition a hook cannot be behind (S12)
      app.css, play.css           London, cut to what this screen uses
    dev/
      scenes.ts                   the five scenes and the address bar they come from (section 15)
      apply-scene.ts              writes a scene to storage, so the ordinary start path finds it
      use-dev-scene.ts            the one hook, behind import.meta.env.DEV; Shell calls it first
    test/
      fake-engine.ts, dom-setup.ts   London, identical
      pwa-register.ts                new: virtual:pwa-register/react, which is not a file, faked for the dom project
      board-stub.tsx, dom.tsx        London, adapted (the stub reports its orientation; dom.tsx can seed a game)
      scripted-engine.ts             new: an engine that plays a script, for a mate in a test
      by-profile.ts                  new: a fake that answers moves and analysis differently
      held-engine.ts                 new: a fake whose move waits, for reading the screen mid-move
      played-moves.ts                London's game-pgn.test.ts playedMoves: SANs as the session played them
  src-tauri/                      London, names changed, capabilities cut (phase 8)
    tauri.conf.json               the window of 11.1, nsis currentUser, the hook
    Cargo.toml, Cargo.lock        package simple-chess, lib simple_chess_lib
    build.rs                      London, identical
    src/main.rs, src/lib.rs       London, identical but for the names and LOCAL_FOLDER
    capabilities/default.json     the five grants of 11.4 and nothing else
    installer-hooks.nsh           London, one folder
    icons/                        npx tauri icon public/icon.svg
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

---

## 18. Version 2: a sibling of the trainer's Play screen (ruled 2026-09-13)

Nick's rulings after using version 1.0.0, folded into one section the way the
trainer's specification folds its version 2 into section 10. **Where this section and
sections 1 to 17 differ, this section wins.** Everything it does not mention stands.

| # | Question | Ruling |
|---|---|---|
| Q15 | The name | **Simply Chess.** "It's not a simplified version of chess, it's a to-the-point player." Everything a person sees changes: the product name, the window title, the installer, the Home Screen label, the icon script's output, the PGN `Event` tag, the data folder (`%LOCALAPPDATA%\Simply Chess Data`), the Tauri identifier (`com.nick.simply-chess`) and the storage keys (`simply-chess.*`). The repository folder stays `SimpleChess`, and the site name is not decided (Q22). |
| Q16 | Layout | **As close to the trainer's Play screen as the app allows.** The difficulty select sits where the trainer's course selector sits, in a row under the header. The board size toggle sits beside Light/Dark. The move list is its own narrow column at board height. The side panel holds Play as, the file buttons, the actions during a game and the report after it. The window opens at 1400 by 980, the trainer's size. |
| Q17 | The move list during play | **A record only.** After the game is reviewed it becomes the trainer's replay viewer: click a move to see the position, the row is marked, the arrow keys step. |
| Q18 | Stopping a game | **Stop and review** and **Stop and discard**, as the trainer's. |
| Q19 | The report | **The trainer's, chess half only.** Your moves scanned at the analysis profile with each slip named and the engine's better move; the verdict on the final position; the outcome; the hint count. Nothing about openings or repertoires. Verdicts in the report are in the trainer's words; the bar keeps its number (Q4). |
| Q20 | Game history | **No.** Save game is how a game is kept. |
| Q21 | Other trainer features | Keep playing, Play from here, Copy game and the hint count come in. The game length cap, the launch shapes and Play the other side stay out. |
| Q22 | Deployment | Not decided. Caddy on the LAN (a private root certificate trusted once on the iPad) and Cloudflare Pages are both documented as options when the choice is made. Nothing in the app depends on it. |

Nick also asked for the same number on the trainer's own bar; that is a chip for the
trainer, `../London/chips/phase-46-bar-number.md`, and not part of this app.

### 18.1 The screen, version 2

```
+------------------------------------------------------------------------------+
| Simply Chess  v1.1.0                                   [ Large ]  [ Light ]  |  header
+------------------------------------------------------------------------------+
|                         Difficulty  [4. Club        v]                       |  selector row
|                                                                              |
| Playing White against 4. Club                Your move                       |  head row
|                                                                              |
|  ||  +---------------------+   +----------+   +----------------------------+ |
|  ||  |                     |   | 1. d4 d5 |   | PLAY AS  (o) White ( ) Black| |
|  ||  |                     |   | 2. c4 e6 |   | [Save game] [Load game]    | |
|  ||  |       board         |   |   ...    |   |                            | |
|  ||  |                     |   |          |   | The engine suggests Nf3.   | |
|  ||  |                     |   |          |   |                            | |
|  ||  +---------------------+   +----------+   | [Stop and review]          | |
|      [New game][Undo][Redo][Hint]             | [Stop and discard]         | |
|      [Keep playing][Play from here]   [<][>]  |         or, after review,  | |
|                                               | THE REPORT                 | |
+------------------------------------------------------------------------------+
```

- **Header**: the name with the version, and two toggles at the right in the trainer's
  `theme-toggle` style: the board size, reading "Large" when the board is small and
  "Small" when it is large, then the theme, reading "Light" or "Dark". The size toggle
  sits first so the theme toggle keeps the end of the row it has always had.
- **Selector row**: the trainer's `.course-switch` row (its `catalog.css`), a label
  "Difficulty" and the select, centred, in the dim text colour. The level's one-line
  description and the sentence about the engine's scale move to the select's `title`
  and are no longer on the screen: the row is the trainer's shape, which is one line.
- **Head row**: the trainer's `.play-head` without its "Play" heading: the opening line
  on the left, "Playing White against 4. Club" (the side and the level of the RUNNING
  game, as the trainer names its course and level), and the status line beside it.
  The status line's words are section 5.6's; it moves up from under the buttons. An
  engine error and the file notices stay under the buttons in the notice style.
- **Board column**: the bar and the board, then row one of the buttons (New game, Undo,
  Redo, Hint), then, only while a report is showing, row two (Keep playing, Play from
  here, and the two stepping arrows at the right edge of the board), exactly the
  trainer's `PlayControls`.
- **Move list column**: the trainer's, 167 px wide, board height, thin scrollbar. A
  record during the game; the viewer after the review (18.4).
- **Side panel** (`.play-side`, the trainer's: `flex: 1; min-width: 300px; max-width:
  52ch`): the Play as fieldset, the file buttons, then the hint sentence when there is
  one, then the actions (18.3) while a game is going or the report (18.5) once it has
  been reviewed.
- **Narrow layout** (below 900 px): the three columns stack in order, board column, move
  list at ten rows, side panel. The selector row and the head row stay single lines
  that wrap.

**S17. The layout is the trainer's Play screen with the launch options replaced by the
settings.** The two are siblings and may share a library; a person who knows one
should find the other where they expect it. The only things the trainer's screen has
that this one does not are the pieces that need a repertoire.

**Sizes.** The 4.2 table stands with two changes: the sidebar of 280 becomes the move
list column of 167 plus the side panel (300 minimum, 52ch maximum, taking what is
left), and the page is about 1400 wide with the large board, which is why the window
opens at 1400 by 980 (minimum 960 by 720). The fit rule of S2 stands with re-measured
chrome: above the board sit the header, the selector row and the head row; beside it
the bar, its gap, the move list column, the side panel's minimum and the gaps; below it
BOTH button rows, so the board does not change size when the review row appears. The
constants in `board-size.ts` are re-measured in phase 9 and named as before.

### 18.2 The rename

Everything a person sees says Simply Chess. In the code, that is `productName`,
the window title, the manifest's names, the PGN `Event` tag, `LOCAL_FOLDER`
(`Simply Chess Data`, in its three files and their test), the identifier
`com.nick.simply-chess`, the package name `simply-chess`, the icon script's comment,
the header, the README and CLAUDE.md, and the storage key prefix `simply-chess.`. The
keys change because one name for one thing is the rule (section 3) and nobody has data
under the old keys yet; after version 1.1.0 they do not change again. The repository
folder, the git history and the plan's phase notes keep the old name as history.

### 18.3 Stopping a game

Under the file buttons, while a game is going, the trainer's `PlayActions` without the
length-cap buttons:

- **Stop and review** (the primary button; "Review the game" once the game has ended
  by itself) scans the game and shows the report (18.5). While it scans it reads
  "Scanning 12 of 40..." and the board is locked.
- **Stop and discard** ends the game with nothing kept: no scan, no report, and the
  remembered game is forgotten; a fresh game starts. No confirmation, for the
  trainer's reason: New game already ends a game the same way.
- Both are disabled while the engine thinks.

A game that has ended by itself (checkmate, a draw) shows the trainer's notice under
the outcome, "Review it to see what it cost.", and the same two buttons.

### 18.4 The review

After the report is built the screen is a viewer, as the trainer's is:

- Every move in the list is a button; the one the board is standing on is marked in
  `--mark`; clicking a move shows the position after it; the left and right arrow keys
  step (never when a text field has focus); the list scrolls to keep the marked move
  in view, scrolling itself and nothing above it (the phase 6 rule).
- The board is locked. The bar shows the evaluation of the position being looked at;
  every position of a reviewed game has one, because the scan filled them.
- Standing on the position a slip was played from, the move that was played is the
  last-move highlight and the engine's better move is a blue arrow, so both are on the
  board at once (the trainer's `preferredShapes`).
- Row two of the buttons: **Keep playing** (only for a game that was stopped rather
  than ended: puts the report away and hands the board back at the final position,
  not at the position being looked at), **Play from here** (a new game from the
  position being looked at, with the same side and level; disabled with the trainer's
  reasons in its tooltip when the position is the engine's move or the game is over,
  and with "This is the start of the game. Use New game." at the start, which the
  trainer has no rule for because a trainer game can begin anywhere and this one always
  begins at ply 0), and the two stepping arrows.
- New game, Load game and Play from here end the review. Undo and Redo are disabled
  during it, as the trainer's are.

### 18.5 The report

The trainer's `Report` with "The repertoire" removed. Under the heading "The report":

- **Your moves**: the hint count when hints were used ("You used 2 hints."); then
  either "Nothing the engine calls an inaccuracy or worse. Well played." or the list of
  slips, each a button that puts the board on the position it was played from, worded
  by the trainer's `describeSlip` (the move, the tag, what the position was and became
  in words, and the engine's better move). Slips are tagged by the trainer's
  `SLIP_THRESHOLDS`: a blunder loses two pawns or more, a mistake one, an inaccuracy
  half, in the user's own terms.
- **The final position**: the verdict in the trainer's words (`verdictInWords`, the
  bands of its section 5: under 0.4 level, to 1 slightly better, to 2.5 clearly better,
  beyond winning), the trainer's horizontal `EvalBar` of the final evaluation, and the
  outcome sentence when the game ended by itself.
- **Copy game** under it: the whole game to the clipboard as PGN with the report's
  comments (18.6), through the trainer's `toClipboard` with its fallback, saying
  "Copied" for a moment or why it could not.

The scan is the trainer's `scanGame` at the analysis profile, handed every evaluation
the bar already made so the report cannot disagree with the numbers the user watched.
It keeps the engine's move at each position, which is what "the better move" is.

**S18. Words in the report, a number on the bar.** Nick ruled both (Q4, Q19). The two
are not in conflict: the bar is watched during play and a number is quicker to read
in the corner of the eye; the report is read afterwards and "clearly better for
White" is what a club player can act on. The trainer's bands make the words.

### 18.6 The file and the clipboard

Section 9.1's file gains the trainer's report comments once a game has been reviewed:
`{Played with 2 hints.}` before the first move when hints were used, a comment after
each slip in the trainer's `slipComment` wording, and the closing comment carrying the
verdict as well as the outcome, as `gameToPgn` in the trainer writes them. A game saved
before it is reviewed is written as section 9.1 shows. Copy game and Save game write
the same text. Load game ignores the comments, as it always did (S8).

### 18.7 Tests and acceptance, added

To S15: (12) Stop and review builds a report whose slips match a scripted game with a
known blunder; (13) Stop and discard forgets the game; (14) the review viewer marks
the clicked move and the arrow keys step, with the board locked; (15) Keep playing
returns to the final position with the report gone; (16) Play from here starts a new
game from the viewed position with the old game gone; (17) Copy game and Save game
produce the same text for a reviewed game, with the comments; (18) the header's size
toggle and the selector row's select work and are remembered; (19) the hint count
reaches the report and the file.

To section 17: the screen is 18.1's at both sizes and both themes at the three
viewports with S16 holding; a game can be stopped, reviewed, walked, kept playing,
and played from a viewed position; the report names a scripted blunder; the name is
Simply Chess everywhere a person sees it. The version is 1.1.0 when this section is
green.

---

## 19. Versions 1.2.0 and 1.2.1: room for the report (ruled 2026-09-14)

Nick's rulings after using 1.1.0, and then Q27 after using 1.2.0. **Where this section
and sections 1 to 18 differ, this section wins**, and where Q27 and Q23 differ, Q27
wins: the diagram and S19 below are 1.2.1's and are the ones to build to. Everything it does not mention stands, and 18.4's viewer, 18.5's
report and 18.3's stopping are untouched in what they DO; only where they sit and how
they read change.

| # | Question | Ruling |
|---|---|---|
| Q23 | Where the controls go | **Every button goes under the board.** The side panel keeps no control at all. "Move all the button controls and toggles to under the board in a sensible placement." **Corrected by Q27 on the same day**: the two view toggles were not part of what he meant and go back to the header. |
| Q24 | What the side panel is for | **The report.** It starts at the top of the column, where Play as used to be. The hint sentence stays in the panel, because it is the game talking rather than a control. The panel is empty during a game with no hint showing, and that is allowed. |
| Q25 | How the report reads | **The head row's font settings**, which is `--text-soft` at the body size and weight. At full `--text` the report "pops a bit too much" in dark mode. |
| Q26 | The selector row | **Left aligned**, so the Difficulty label lines up under the "Simply Chess" heading. |
| Q27 | The three placements 1.2.0 got wrong | Ruled after using 1.2.0, and each one is a pairing rather than a preference. **The board size and theme toggles go back to the header**, at the right of the name, where they were in 1.1.0: "I liked them where they were." **New game moves down beside Play as**, "since they are associated" - the side you pick is the side the next new game is played at, so the two belong on one row. **The two stepping arrows move up** to the Undo, Redo and Hint row, right justified, so they sit at the bottom right corner of the board. |

### 19.1 The screen, as 1.2.1 leaves it

```
+------------------------------------------------------------------------------+
| Simply Chess  v1.2.1                                   [ Large ]  [ Light ]  |  header
+------------------------------------------------------------------------------+
| Difficulty  [4. Club        v]                                               |  selector row
|                                                                              |
| Playing White against 4. Club                Your move                       |  head row
|                                                                              |
|  ||  +---------------------+   +----------+   +----------------------------+ |
|  ||  |                     |   | 1. d4 d5 |   | The engine suggests Nf3.   | |
|  ||  |                     |   | 2. c4 e6 |   |                            | |
|  ||  |       board         |   |   ...    |   | THE REPORT                 | |
|  ||  |                     |   |          |   | Your moves                 | |
|  ||  |                     |   |          |   |   a blunder on move 3...   | |
|  ||  +---------------------+   +----------+   |   an inaccuracy on move 2..| |
|      [Undo][Redo][Hint]                [<][>] | THE FINAL POSITION         | |
|      [Stop and review][Stop and discard]      | Winning for Black          | |
|          or, after review,                    | ===========------          | |
|      [Keep playing][Play from here]           | Stopped after move 4       | |
|      [Save game][Load game]                   | [Copy game]                | |
|      [New game]  Play as (o) White ( ) Black  |                            | |
+------------------------------------------------------------------------------+
```

**S19. The four rows under the board, in this order, grouped by what they are for.**
Nearest the board is the position in front of you; furthest is the game you have not
started yet. As corrected by Q27.

1. **This position**: Undo, Redo, Hint, and then the two stepping arrows at the
   right-hand end, which puts them at the bottom right corner of the board. All five act
   on the position showing, and the arrows are the two that CHANGE which position that
   is, so they end the row the way the toggles used to. They are there only while a
   report is showing, as they always were.
2. **This game**: Stop and review and Stop and discard while a game is going; Keep
   playing and Play from here once a report is showing. The two states are exclusive, so
   this is one row and never two.
3. **The file**: Save game, Load game.
4. **The next game**: New game, then Play as and its two radios. They are one pairing,
   not two settings: the side chosen is the side the next new game is played at, so the
   button and the choice it reads belong on one row (Q27). New game keeps the left edge
   every other row starts on, so the buttons still line up down the column.

The reason for the order: row 1 is the position, row 2 is the game it belongs to, row 3
takes that game out of the app or brings one in, and row 4 starts the next one.

Every row is the width of the board and no wider, at both board sizes. The small board
is 416 px and the widest row is the fourth at 324 px, measured (New game 102, the Play
as group 214, one gap), so all four fit with 92 px to spare; at the large board they fit with room to
spare. "Applies to the next new game." moves to the Play as control's `title`, as the
level's two sentences did in phase 9 (18.1): there is no room for a sentence under a row
and the rule is the same one.

**The board size and the theme toggles are in the header** (Q27), at the right of the
name, in the trainer's `theme-toggle` style, the size one first so the theme toggle
keeps the end of the row it has always had. That is 18.1's header and it is restored
exactly, styling included. They are not controls of the game: they change how the page
is drawn and nothing about the position, the game or the file, which is why they sit
with the name rather than under the board.


**S20. The report reads in the head row's colour.** `--text-soft` at the body size and
weight, which is `.play-opening`'s setting, for every line of the report: the headings,
the slips, the verdict and the outcome. It was `--text`, which in the dark theme is
`#e6e6e6` against `#c8ccd2` for the head row, and against a dark ground that reads as
the report shouting. The slips' coloured left edges, the tag colours and the bar are
untouched: they carry meaning, and this is about the words.

**The selector row is left aligned** (`justify-content: flex-start`), so "Difficulty"
starts on the same pixel as "Simply Chess". Both sit inside the page's `--pad-left`, so
nothing else is needed to line them up.

**The fit rule of S2 stands with re-measured chrome.** Two rows have become four under
the board, so `CHROME_BELOW` in `board-size.ts` grows and the large board loses height
on a window that was already tight. **Q27 gives none of it back**, and that is worth
saying plainly: the toggles leaving the fourth row does not remove the row, because New
game arrives in it as they go. Four rows is four rows, and the constant counts rows. That is the cost of the change and it is accepted:
the number is measured at the LARGE board with a report showing, which is the state with
the most rows, and recorded in the phase notes. Nothing above or beside the board moves,
so `CHROME_ABOVE` and the two beside constants do not change. S16's two numbers hold as
before: the bar, `.board` and `cg-board` end on the same pixel and the page never
scrolls sideways.

### 19.2 Tests and acceptance, added

To S15: (20) every control except the two view toggles is under the board and the side
panel holds no button, in both states of row 2; (21) the report's text takes the head
row's colour; (22) the Play as radios still change the side of the next new game from
their new home, and the two toggles still work and are still remembered from the header;
(23) the stepping arrows are in the first row under the board and the two view toggles
are in the header, which is Q27's three placements held where a test can see them.

To section 17: the screen is 19.1's at both sizes and both themes at the three
viewports with S16 holding, and the large board's new size is recorded. The version is
1.2.0 when this section is green, and **1.2.1 when Q27's three placements are**.

---

## 20. Version 1.3.0: the window matches the board (ruled 2026-09-14)

| # | Question | Ruling |
|---|---|---|
| Q28 | The board size toggle in a small window | **The window changes to match the board.** Nick: "The Small/Large toggle doesn't work going from small to large if the user has shrunk the window size. Make it so that the window size auto changes to match the dimension that fits everything naturally." Asked whether Small should shrink the window back, he chose **both ways**: the window is always the size the chosen board needs. |

### 20.1 Why the toggle looked dead

`fitBoardSize` never answers less than `BOARD_SIZE`, which is 416, because a viewport too
small for the small board is one where scrolling beats shrinking the pieces past reading
(S2). So in a window with less than a large board's worth of room, Large computes 416,
the screen does not change, and the toggle reads as broken. It was not broken; it was
honest about a window with no room in it.

How small is too small, with the layout of 19.1 and the chrome of `board-size.ts` (167
above, 224 below, 607 beside): the first board bigger than 416 is 424 at a display scale
of 1, and 432 at 1.25 or 1.5, where the size must be a multiple of 32 or 16. So the
toggle does nothing until the window is about **1039 wide and 823 tall**. The window's
own minimum is 960 by 720, so there is a band of window sizes, reachable by dragging a
corner, where the toggle is inert. That band is what Nick found.

### 20.2 The rule

**S21. The board size toggle sets the window to the size that board needs, on Windows.**

- The size a board needs is the board plus the chrome: `board + CHROME_BESIDE_WIDE` wide
  and `board + CHROME_ABOVE + CHROME_BELOW` tall, as an INNER size. Those three constants
  keep their single home in `ui/board-size.ts` and are not written down anywhere else.
- **Small** is the 416 board, so the window becomes 1023 by 807.
- **Large** is the biggest board the screen can actually show: `fitBoardSize` asked for
  832 against the monitor's work area rather than against the window, so the window never
  grows past the screen and the board it is sized for is the board that will be drawn.
- The target is clamped to the monitor's **work area** (the screen without its taskbar)
  less the window's own frame, which is `outerSize` minus `innerSize`, measured at the
  moment of the change rather than assumed.
- A **maximised** window is un-maximised first: a maximised window ignores a size.
- If the window would then hang off the work area, it is moved back inside, by the least
  that puts it there. It is not re-centred: a window the user placed stays where they put
  it as far as it can.
- The window's declared minimum, 960 by 720, still binds; a target under it is clamped up
  to it, and then the board is whatever fits, which is the behaviour of every version
  before this one.
- **Opening the app resizes nothing.** The window opens at the size `tauri.conf.json`
  gives it. Only the toggle resizes. **Reversed by Q31 in section 22**: a window that
  opened at neither of the two sizes the toggle produces was a landing page matching
  nothing, so the launch now asks the same question the toggle does. (The sentence also
  said "or the size Windows remembers for it", which was never true of this app: it has
  no window-state plugin, so every launch has always used the declared size.)

**On the web there is no window to resize and nothing changes.** A page cannot resize a
browser window it did not open, and an iPad has no window at all, so the toggle keeps
S2's behaviour there: the largest board that fits, and Large may equal Small on a small
screen. The desktop call is imported lazily behind `isDesktop()` (S14), so the browser
bundle does not carry it.

**S22. Three more permissions in the Tauri capability.** Verified against
`src-tauri/gen/schemas/acl-manifests.json`: `core:window:default`, which `core:default`
brings in, already allows the app to READ its own geometry (`current-monitor`,
`inner-size`, `outer-size`, `scale-factor`, `is-maximized`, `outer-position`). It does
not allow it to CHANGE it. So the capability gains `core:window:allow-set-size`,
`core:window:allow-unmaximize` and `core:window:allow-set-position`, and its description
says what they are for. Section 11.4's list of five entries becomes eight.

### 20.3 Tests and acceptance, added

To S15: (24) the size a board needs is worked out by a pure function, tested without a
window, including the work-area clamp, the minimum-size clamp and the move back inside;
(25) the toggle still changes the remembered setting and the board on the web, where
nothing resizes, and no test starts a Tauri call.

To section 17: on Windows, shrinking the window into the dead band and pressing Large
grows the window and draws a large board; pressing Small puts it back to 1023 by 807.
The version is 1.3.0 when this section is green.

---

## 21. Versions 1.3.1 and 1.3.2: the window the layout actually needs (ruled 2026-09-14)

| # | Question | Ruling |
|---|---|---|
| Q29 | The report after an automatic resize | **It stays beside the move list.** Nick, using 1.3.0: "In both auto size cases the post game review drops to under the board, I really want it alongside the move list which is the natural place." The window the toggle asks for must have room for the three columns of 19.1 with a report in the third, not merely for the board. |
| Q30 | The horizontal scrollbar after a review | **The window is wider again.** Nick, using 1.3.1: "the width for small size needs to be a little wider so as not to trigger the horizontal scroll bar", and the trigger was "load a game, stop and review". 1.3.1 allowed for the scrollbar and nothing more, which left the side panel squeezed to the pixel where its own contents round past it. |

### 21.1 What went wrong, measured

`innerSizeForBoard` asks for the layout's EXACT minimum: the board plus
`CHROME_BESIDE_WIDE`, which is the sum of the page padding, the bar, the gaps, the move
list and the side panel's own 300 px minimum. Exact is one pixel too little, and this is
why.

Measured in the shipped 1.3.0 window at a display scale of 1.5, with a report showing:

| Auto size | Page width for the columns | The three columns need | Result |
|---|---|---|---|
| Small, 1024 by 808 | 961 | 975 | the side panel wraps under the board |
| Large, 1440 by 1224 | 1377 | 1391 | the same |

Both are 14 px short, and the 14 is a scrollbar. **`main` is the scrolling element above
900 by 700** (`app.css`), so its vertical scrollbar takes about 15 logical pixels out of
the width WITHOUT changing `document.documentElement.clientWidth`, which is why the page
reports no scrollbar at all while behaving as though one is there. The layout fits its
window by one pixel, the scrollbar takes fifteen, and the side panel is pushed onto the
next line, where it lands under the board with the report in it.

**Proved by giving it the room**: the same window and the same report at an inner width
of 1045 instead of 1024 puts the panel back beside the board at y 164 with `main` not
scrolling at all. Twenty-one pixels was enough; the height was never the problem.

### 21.2 The rule

**S23. The window the toggle asks for has a margin, and the margin is the scrollbar.**
`innerSizeForBoard` adds a width allowance to the layout's minimum, at least as wide as a
vertical scrollbar. **Measured rather than reasoned about in phase 16: WebView2 draws it
15 CSS pixels wide at a display scale of 1 and 15 again at 1.5**, so it does not grow in
CSS pixels as the scale rises, which is what an earlier draft of this section assumed it
would. The allowance is 24, which clears the 15 at both scales and is a round number
rather than one tuned to the machine it was measured on.
The height keeps its exact figure, because the height was never short: with the panel
beside the board the page fits its window, and it is only the wrap that made it tall.

The allowance belongs to the WINDOW's arithmetic and not to the chrome constants.
`CHROME_BESIDE_WIDE` describes what the layout truly needs and the fit rule of S2 uses it
to answer honestly about a window the user sized; a scrollbar allowance buried in it
would take pixels off the board on every screen for a scrollbar that is only sometimes
there.

**What this does not fix, and that is accepted.** A window the USER drags to within a
scrollbar's width of the boundary still wraps the panel under the board, because the wrap
is the layout degrading as it is meant to and the app cannot both honour the size the user
chose and refuse to use it. The toggle is what promises a window that fits, and that
promise is what this section makes true.

### 21.3 The pixel the panel rounds by, and S24

1.3.1 allowed for the scrollbar exactly and nothing else, so the side panel came out at
**309.67 px** at BOTH automatic sizes. At a display scale of 1.5 its full-width children
round up past that: `scrollWidth` 311 against a box of 309.67. One pixel is a horizontal
scrollbar across the bottom of the page, and that is what Nick met after loading a game
and reviewing it. His own file, a 23-move game with ten slips, is what made it show:
the report is then tall enough for `main` to scroll, the vertical scrollbar takes its 15
px, and what is left squeezes the panel onto the pixel where it rounds.

Measured in the shipped 1.3.1 window, with that report on screen and the window widened a
step at a time:

| Side panel | Its `scrollWidth` | The page |
|---|---|---|
| 311 | 312 | scrolls sideways |
| 319 | 320 | scrolls sideways |
| **327** | 327 | **does not**, and never did again above it |

**S24. The window's allowance covers the scrollbar AND the panel's breathing room.**
It is 64: the scrollbar's 15, plus enough to put the side panel at 349 px, which is 22
clear of the 327 where the rounding stops. One number serves both board sizes, because
the board and the move list grow together and the panel is what is left over - it was
309.67 in each. The small window becomes **1087 by 807** and the large one, on a screen
with room for the full board, **1503 by 1223**.

The height is still the layout's exact figure. It has never been the short one.

**Why not hide the pixel instead.** `overflow-x: clip` on the row would end this class of
fault at every window size, including one the user drags to the boundary themselves. It
is not done here because it hides real overflow as readily as a rounding artefact, and
the app has twice now been told something true by a scrollbar it did not want. Giving the
layout room is the fix that leaves the page honest.

### 21.4 Tests and acceptance, added

To S15: (26) the window a board asks for is wider than the layout's bare minimum by at
least a scrollbar AND the room the side panel needs over its own minimum, held as a
property rather than as the number, in the same pure test as S21's other arithmetic.

To section 17: on Windows, a game reviewed after either automatic resize has its report
beside the move list, with `main` not scrolling; and a LOADED game of two dozen moves,
reviewed, leaves the page scrolling in neither direction. The version is 1.3.1 for the
first half of this section and **1.3.2 for S24**.

---

## 22. Version 1.4.0: the window opens at the size it will use (ruled 2026-09-14)

| # | Question | Ruling |
|---|---|---|
| Q31 | The size the app opens at | **One of the two automatic sizes, whichever the remembered board size names.** Nick, using 1.3.2: "When launching simply chess the initial landing page size is wider than the auto-small width and narrower than the auto large width. It should match one of the two auto sizes depending on the persisted board size state." |

The window was declared at 1400 by 980, which is between the small board's 1087 and the
large board's 1503 and therefore matches neither. Every launch landed on a size the app
would never choose for itself, and the board inside it was whatever happened to fit.

**S25. The launch asks the same question as the toggle.**

- `tauri.conf.json` declares the **small** size, 1087 by 807, because Small is the default
  board size (Q3) and every fresh install therefore opens at exactly the right size with
  nothing to resize. The two files cannot import from each other, so a test holds them
  together, as one already holds the window's minimum.
- On starting, the app asks for the window the REMEMBERED board size needs. A small-board
  launch changes nothing. A large-board launch resizes once.
- **A launch centres the window; the toggle does not.** At a launch nobody has put the
  window anywhere yet - the configuration centres it at the size it declares - so a window
  that resized from its top-left corner would sit off centre by half the difference. Once
  the app is open, a window the user has placed stays where they put it, which is S21's
  rule and is unchanged.
- The work-area clamp, the minimum-size clamp and the rule that a window too big for the
  screen starts at the work area's corner all apply exactly as they do for the toggle.
- On the web nothing happens, as before: there is no window to open at a size.

**What this costs.** A window the user has resized by hand is put back to the size of the
remembered board the next time the app opens. That is what Q31 asks for: the two automatic
sizes are the sizes this app has, and the launch is now one of them.

### 22.1 Tests and acceptance, added

To S15: (27) a launch answers a centred position, where the toggle answers none for a
window that already fits; (28) the width and height in `tauri.conf.json` are the window
the small board asks for, read out of the file itself.

To section 17: on Windows, the app opens at 1087 by 807 with Small remembered and at the
large size with Large remembered, centred, with the board drawn at the size that window
was chosen for. The version is 1.4.0 when this section is green.

---

## 23. Version 1.4.1: the report scrolls, not the window (ruled 2026-09-14)

| # | Question | Ruling |
|---|---|---|
| Q32 | A report longer than the screen | **The panel scrolls, not the page.** Nick, using 1.4.0: "The vertical scrollbar scrolls the whole window, the game report moves should be the panel with the vertical scroll bar not the whole window." |

Until now the side panel had no ceiling, so a report longer than the board is tall made
the page itself taller than the window and `main` scrolled. Reading the last slip moved
the board, the four button rows and the move list up the screen with it: the whole window
travelled for the sake of one column.

**S26. The side panel is a column that scrolls itself, like the move list.**

- Its ceiling is the board's own height, so it ends level with the board and the move
  list, and the page keeps the height it had.
- It scrolls vertically, with the move list's own thin scrollbar, so the two columns
  beside the board behave alike. This is the phase 6 rule again, now for the third
  column: **a column that needs to scroll scrolls itself and nothing above it.**
- It scrolls one way only. The panel is a scroll container now, so a child that rounds a
  pixel past it at a fractional display scale would draw a scrollbar along the bottom of
  the panel; `overflow-x: hidden` stops that. It is scoped to the one column, which is
  what makes it honest here where the same declaration at page level was refused in 21.3:
  there it would have hidden the layout telling the truth about a window too small for it.
- **The board's pixels move up to the row.** The move list took its height from
  `--board-pixels` set on itself; the panel needs the same number, so it is set once on
  `.play-body` and both columns read it. One number, one home.
- **The narrow layout keeps no ceiling.** Below 900 px the columns are stacked, there is
  no board beside the panel to take a height from, and the page scrolls as it always has
  there.

### 23.1 Tests and acceptance, added

To S15: (29) the board's pixels are on the row rather than on the move list, so both
columns can read them. The scrolling itself is a pane measurement, as the move list's is:
jsdom lays nothing out.

To section 17: on Windows, a loaded game of two dozen moves with a report long enough to
overflow its column scrolls inside the panel, with the board, the four rows and the move
list staying exactly where they are and the page not scrolling at all. The version is
1.4.1 when this section is green.
