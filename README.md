# Tabiya Player

A no-frills chess game against the Stockfish engine, for Windows. One screen, eight
levels, the engine's evaluation on a bar beside the board, and when the game is over,
a review that names every slip you made and the move the engine would have played
instead.

It is the companion to [Tabiya](https://github.com/nick2468/Tabiya), which teaches
chess opening repertoires. Tabiya is where you learn the openings; this is where you
play the game out.

Built in Australia.

## Download

**[Download the latest installer](https://github.com/nick2468/TabiyaPlayer/releases/latest)**
for 64-bit Windows. It installs for the current user, with no administrator prompt.

Windows will warn you that the publisher is unknown, because the installer is not
signed with a code signing certificate. That is what an unsigned installer looks like
whoever wrote it. If you would rather not take that on a stranger's word, the source
is all here and `npm run dev` runs the app in a browser without installing anything.

## What is in it

- **A game against Stockfish** at eight levels, from Very casual to Unpleasant, with
  Club as the place to start. Play White or Black. The level can change mid-game and
  the engine hears it on its next move.
- **The bar** beside the board shows the engine's evaluation as a shade and a number:
  plus when White is better and minus when Black is, the usual convention, with the
  bar turned to match the board.
- **Hint** draws the engine's move as an arrow and says it in words.
- **Undo and Redo**, a picker when a pawn reaches the last rank, and the game in
  progress remembered when you close the window.
- **Stop and review.** The engine scans every position of the game and the report
  names each inaccuracy, mistake and blunder with its move number and the move the
  engine preferred, then gives the final position a verdict in words. The move list
  becomes a viewer: click a move, or step with the arrow keys, and standing where a
  slip was played shows both the move you made and the engine's choice on the board.
  From there you can **Keep playing**, or **Play from here** to try the position again.
- **Save game and Load game** write and read ordinary PGN files, with the report's
  comments in a reviewed game. **Copy game** puts the same text on the clipboard.
- Two board sizes and a light and a dark theme. The window resizes itself to fit the
  board you choose.

## Running it

```bash
npm install
npm run dev
```

The dev server binds to port 5185. `npm run dev` copies Stockfish into `public/engine/`
first, which is why the first run takes a moment. `npm test` runs the suite and
`npx tsc -b` typechecks.

To build the Windows installer, put the Rust toolchain on the path and run:

```bash
npx tauri build
```

That writes `src-tauri/target/release/bundle/nsis/Tabiya Player_<version>_x64-setup.exe`.
The window keeps its settings and the game in progress in
`%LOCALAPPDATA%\Tabiya Player Data`, and the uninstaller removes that folder only if you
tick the box. `node scripts/check-uninstall-hook.mjs` proves the uninstaller's four
cases without uninstalling anything.

## How it was built

[`docs/simple-chess-spec.md`](docs/simple-chess-spec.md) is the contract and
[`docs/simple-chess-build-plan.md`](docs/simple-chess-build-plan.md) is the running
record: every phase, what it changed, and what the review of it found. `chips/` holds
the brief each phase was built from. Reading a phase's chip, then its plan section,
then its review notes shows the whole loop, including the parts that were wrong the
first time.

The app was called Simply Chess while it was built, and the documents keep that name,
because a dated record keeps the name it was written under. Its code started as a copy
of Tabiya's Play screen, back when that app was called London, which is why many
source files open with an `Origin: London` line saying what was copied and what
changed.

## Licence

MIT. See [LICENSE](LICENSE). You may copy, change and use this, including in something
you sell. Keep the copyright notice in any copy you pass on. The documents under
`docs/` and `chips/` are covered by the same licence.

**One thing to know before you redistribute a build.** The app plays against
[Stockfish](https://stockfishchess.org/), which is licensed GPL-3.0. Stockfish is not
in this repository: `scripts/copy-engine.mjs` copies it out of `node_modules` at build
time, and `public/engine/` is gitignored. So the source here is MIT and nothing more. A
built installer, though, has Stockfish inside it, and distributing that combined binary
puts GPL-3.0 obligations on it. If you ship a build rather than the source, read the
GPL terms first.
