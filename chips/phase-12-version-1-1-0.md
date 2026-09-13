# Chip: phase 12 - version 1.1.0, the last phase

You are the builder session for Simply Chess, in `C:\Users\nick2\Code\SimpleChess`, on
`main`, no worktree, no remote (never push, never create one). Your context was
compacted after phase 11: rely on nothing you remember about this code. Read, in this
order, before the first edit:

1. `CLAUDE.md` in this folder, all of it.
2. `docs/simple-chess-spec.md`: section 17 (the version 1 acceptance list), then
   section 18 and especially **18.7**, which adds to both 17 and S15 and **wins wherever
   it and sections 1 to 17 differ**. Then S15 in section 15 for items 1 to 11.
3. `docs/simple-chess-build-plan.md`: "Rules for the builder", "Standing discipline",
   phase 12's boxes, and the **gate 11 findings**, which box 12.1 comes from.
4. `docs/acceptance.md` all through, `docs/simple-chess-deploy.md`, `docs/testing.md`
   and `README.md`. You rewrite parts of all four.
5. `src/ui/play-from-replay.ts` and `src/ui/play-from-replay.test.ts`,
   `src/ui/MoveList.tsx`, `src/ui/play-context.tsx`, `src/ui/viewer.dom.test.tsx`.

This is the last phase. When it is done the app ships as 1.1.0 and nothing but Nick's
own three boxes is open.

## Where things stand

Phase 11 landed as `2502c88` and passed gate 11 as `a92020b`: 323 tests green in 15.4
seconds, four mutations caught, the screen driven in the pane at both board sizes and
both themes. A reviewed game is a viewer. Everything spec section 18 asks for is built
except the three items in box 12.1 below.

- **The version is 1.0.0 in three files**: `package.json:3`, `src-tauri/tauri.conf.json:4`
  and `src-tauri/Cargo.toml:4`. `src/version.test.ts` holds them together with four
  tests, and it is the file that catches a bump that only half happened.
- **The app is called Simply Chess everywhere**, since phase 9: `productName` and the
  window title in `tauri.conf.json`, the identifier `com.nick.simply-chess`, the package
  name `simply-chess` in `Cargo.toml`, the data folder `%LOCALAPPDATA%\Simply Chess Data`
  (its one home is `LOCAL_FOLDER` in `src/storage/paths.ts`, held against `lib.rs` and
  `installer-hooks.nsh` by `src/storage/local-folder.test.ts`), and the storage keys
  `simply-chess.*`.
- **The window opens at 1400 by 980**, minimum 960 by 720, built in `lib.rs` with
  `"create": false` in the config so the WebView2 profile lands in the named folder.
- **`docs/acceptance.md` is the version 1 walk, written in phase 8, and parts of it are
  now false.** It says the app is called Simple Chess, that the window is 1280 by 1000,
  that there are four buttons under the board and a 280 px sidebar, and it counts 257
  tests. Phases 9 to 11 changed all of that. It is the living record of what was
  actually checked, so it is rewritten here rather than added to.
- **The spec's sections 1 to 17 keep their version 1 text as history**, which the front
  matter already says. Section 18 is the delta and 18.7 is the acceptance delta. **Do
  not rewrite section 17.**
- **Q22, how the iPad gets the app, is still Nick's to decide.** Nothing in the code
  waits on it.

## Settled decisions

- **Box 12.1 lands first, as its own commit, before the version bump**, so a bisect can
  tell the fix from the release.
- **The start of a game is not a position to play from.** Spec 18.4 says Play from here
  is disabled there, and it is the one thing gate 11 found. The trainer has no rule for
  it because a trainer game can begin from a Study position, where the start is a real
  position to practise; here ply 0 is always the opening position, so the button there
  is New game under another name that also throws the reviewed game away.
- **The start is checked BEFORE the colour**, so `whyNotPlayable` answers the same
  sentence at ply 0 whichever side the user has. For a user playing Black, ply 0 is also
  the engine's move, and "Step one move on or back" would be half wrong there: back is
  disabled at ply 0. The order becomes: no game, then the game is over, then the start,
  then the engine's move.
- **The sentence is "This is the start of the game. Use New game."** It is the shape of
  the other two: a statement, then what to do instead. Spec 18.4 carries it.
- **The acceptance document describes the app that ships.** Every item is re-checked
  against the app as it is now, not edited to look right. An item that cannot be checked
  from a build session says so and names Nick, as items 8 and 9 already do.
- **The packaged window can be read and clicked but not moved on.** The shipped build
  ignores synthetic events on the board, which is what makes it safe, so a real move is
  Nick's. Everything else in the window is reachable through
  `scripts/packaged-eval.mjs`, including seeding a game into `localStorage` and pressing
  Stop and review, which is how the review gets proved in the shipped window.
- **No headless browser on this machine, ever.** The one screenshot file in this project
  is `packaged-eval.mjs --shot` against the Tauri window. Clear the pane's `localStorage`
  after every drive.
- **Do not run the installer.** That is Nick's box. Do not delete
  `%LOCALAPPDATA%\Simply Chess Data`.

## The work

- [ ] 12.1 **The three gate 11 findings, in one commit, before anything else.**
      - `whyNotPlayable` and `canPlayFromPly` in `src/ui/play-from-replay.ts` answer
        **"This is the start of the game. Use New game."** at ply 0, checked before the
        colour and after the game-over case. Its `Origin:` line gains this as an
        adaptation, with the reason in the comment. `play-from-replay.test.ts` changes
        with it: the existing `canPlayFromPly(g, 0, 'white')` case is now false, and
        both colours get the new sentence at ply 0. Add the ply 0 case to
        `viewer.dom.test.tsx`, where the button is already walked back to the start.
      - The `walkable` class goes from `MoveList.tsx`. No rule in this app or the
        trainer uses it, and gate 2 ruled that unused code goes.
      - The double blank line in `play-context.tsx`, where `discard` follows `resume`.
- [ ] 12.2 **`docs/acceptance.md` rewritten for version 2.** Same shape, same honesty:
      each item says what was done to check it, in which phase, with the measured
      numbers. What has to change, at least:
      - The name, everywhere. The installer path, the install folder and the data
        folder. The window is 1400 by 980.
      - Item 1, the screen: 18.1's layout, the selector row, the two button rows, the
        move list's own column, the side panel, both board sizes, both themes, with
        S16 holding. Use the numbers already recorded in the gate 9, 10 and 11 findings
        rather than re-measuring what has not changed, and say which gate they come
        from. Re-measure anything you touch in 12.1.
      - A new item for **stopping, reviewing and walking a game** (spec 18.3 and 18.4),
        and one for the report and the file (18.5 and 18.6), or those items folded into
        2 and 6 if that reads better. Your call, said in the notes.
      - Item 10, the tests: the real counts, and the S15 table extended with 18.7's
        items 12 to 19, each naming the test file that holds it:
        (12) Stop and review builds a report whose slips match a scripted game with a
        known blunder; (13) Stop and discard forgets the game; (14) the review viewer
        marks the clicked move and the arrow keys step, with the board locked; (15) Keep
        playing returns to the final position with the report gone; (16) Play from here
        starts a new game from the viewed position with the old game gone; (17) Copy
        game and Save game produce the same text for a reviewed game, with the comments;
        (18) the header's size toggle and the selector row's select work and are
        remembered; (19) the hint count reaches the report and the file.
        **If an item has no test, write the test rather than the excuse.**
      - 18.7's sentence added to section 17 is walked too: a game stopped, reviewed,
        walked, kept playing, and played on from a viewed position, and the report
        naming a scripted blunder.
- [ ] 12.3 **Version 1.1.0 and the Windows build.**
      - 1.1.0 in the three files; `npx vitest run` green, which is where
        `version.test.ts` proves the three agree.
      - `npx tauri build`. Rust is not on a tool shell's path:
        `export PATH="$HOME/.cargo/bin:$PATH"` in Bash. NSIS is already fetched at
        `%LOCALAPPDATA%\tauri\NSIS`.
      - Record the installer's path and size (`src-tauri/target/release/bundle/nsis/
        Simply Chess_1.1.0_x64-setup.exe`) and the executable's
        (`src-tauri/target/release/simply-chess.exe`).
      - Drive the packaged window: start it with
        `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333"` and read
        it with `node scripts/packaged-eval.mjs "<expression>"` or `@file`. Check the
        title, the inner size, the header's version, the layout probe (S16's two
        numbers at this window's real size), that the engine answers in the window, that
        `navigator.serviceWorker.getRegistrations()` is empty (S12), and that a game
        seeded into `localStorage` can be reviewed and walked there. One screenshot with
        `--shot`, looked at and described.
      - `node scripts/check-uninstall-hook.mjs` re-run, its four cases recorded.
- [ ] 12.4 **`docs/simple-chess-deploy.md` documents both of Q22's routes**, marked
      undecided, because Nick has not chosen. The Cloudflare route is already written.
      Add a short second route, the LAN one, in the same voice and no longer than it
      needs to be: Caddy on this machine serving `dist/` over HTTPS on the LAN; a
      private root certificate made once with mkcert and trusted once on the iPad,
      which is what lets Safari install a Home Screen app and run a service worker; the
      app then installs from a LAN address with no internet, no DNS record and no
      public URL, and anyone on the wifi can install it. Say which route each of Nick's
      existing steps belongs to, and that the choice changes nothing in the code.
- [ ] 12.5 **Docs sweep and the release commit.** `README.md` (the status paragraph and
      "four buttons", which is now two rows), `CLAUDE.md`'s current state, `docs/testing.md`
      if anything moved, the plan's phase 12 notes with every measurement, and every box
      in the plan ticked or its gap recorded. The spec's section 18 gains the ply 0
      sentence if 12.1 did not already put it there (check first; the orchestrator added
      it at gate 11).
- [ ] 12.6 **Nick's, once.** Install 1.1.0, open it, play a move, save a game and load
      it back through the real dialogs, close and reopen to see the game remembered,
      stop and review a game in the installed app, then uninstall with the box ticked and
      check `%LOCALAPPDATA%\Simply Chess Data` is gone. If he has the interim 1.0.0
      installed, install over it first and check the settings and the game survive.
      Leave the date blank for him.

## Decision rules

- **A test that fails is a finding, not an obstacle.** If 12.2's walk shows something
  the app does not do, say so in the notes and fix it if it is small; stop and report if
  it is not.
- **Do not invent numbers for the acceptance document.** Every figure in it is either
  measured in this phase or quoted from a phase note or gate finding that measured it,
  and says which.
- If `npx tauri build` fails on the Rust toolchain, say so plainly with the error and
  carry on with everything else; the build is one box, not the phase.
- Anything a person would see or feel that neither the spec nor this chip settles: ask
  Nick, do not guess.

## Out of scope

Any new feature. Any change to `../London` or `../Conquest`. The chrome constants in
`board-size.ts`. Pushing, publishing, running the installer, and the Cloudflare and iPad
steps, which are Nick's.

## Acceptance

`npx vitest run` green under twenty seconds with nothing skipped; `tsc -b` clean;
`npx oxlint` silent; `npm run build` clean. 1.1.0 in three files and in the header. The
installer built, its path and size recorded, the packaged window driven and its numbers
in the notes. `docs/acceptance.md` describes the app that ships, item by item, with
18.7's items 12 to 19 each naming a test. Every plan box ticked or its gap written down.
`git -C ../London status` shows nothing new from you.

## Conventions

Commits on `main`: 12.1 its own, then the release work, short imperative subjects and a
body that says why, each ending with
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` (name the model you actually
are). Write the message to a scratch file and `git commit -F` it. Stage explicit paths,
never `git add -A`, never `git clean`. No em dashes under `src/`. Australian English.
Nick's own files are not listed or reported. Never push.
