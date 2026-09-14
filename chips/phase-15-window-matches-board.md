# Chip: phase 15 - the window matches the board

You are the builder session for Simply Chess, in `C:\Users\nick2\Code\SimpleChess`, on
`main`, no worktree, no remote (never push, never create one). Your context may have
been compacted: rely on nothing you remember about this code. Read, in this order,
before the first edit:

1. `CLAUDE.md` in this folder.
2. `docs/simple-chess-spec.md` **section 20**, which is this phase: 20.1 says why the
   toggle looked dead, 20.2 is the rule (S21 and S22), 20.3 the tests. Then **S2** in
   section 4 (the fit rule and why it never answers below 416), **S14** (Tauri imported
   lazily) and **11.4** (the capability).
3. `docs/simple-chess-build-plan.md`: "Rules for the builder", phase 15's boxes, and the
   gate 13 findings, which is where the chrome constants last changed.
4. `src/ui/board-size.ts`, `src/ui/use-board-pixels.ts`, `src/ui/App.tsx`,
   `src/storage/paths.ts`, `src-tauri/capabilities/default.json`, `src-tauri/tauri.conf.json`.

## Why this phase exists

Nick shrank the window and found the Small/Large toggle inert:

> The Small/Large toggle doesn't work going from small to large if the user has shrunk
> the window size. Make it so that the window size auto changes to match the dimension
> that fits everything naturally.

**The diagnosis, verified in the code.** `fitBoardSize` never answers below `BOARD_SIZE`,
which is 416, by design (S2). So in a window with less than a large board's worth of room,
Large computes 416, the screen does not change, and the toggle reads as broken. With the
layout of 19.1 and the constants `CHROME_ABOVE = 167`, `CHROME_BELOW = 224` and
`CHROME_BESIDE_WIDE = 607`, the first board bigger than 416 is 424 at a display scale of
1 and **432** at 1.25 or 1.5, so the toggle does nothing until the window is about
**1039 wide and 823 tall**. The window's own minimum is 960 by 720. Between the two is a
band, reachable by dragging a corner, where the toggle is inert. That is the bug.

**Asked and ruled.** Nick was asked whether Small should shrink the window back as well,
and chose **both ways**: the window is always the size the chosen board needs.

## Where things stand

1.2.1 is built, gated (`fc511b9`) and its installer made. 325 tests green in about 10
seconds. The four rows under the board are S19's; the two view toggles are in the header,
in `App.tsx`, and `setBoardSize` is called straight from the size toggle's `onClick`.
`useBoardPixels` turns the remembered size into pixels with `fitBoardSize`, listening to
`resize` and `orientationchange`.

## Facts verified at source, so you do not have to find them

- **The Tauri API has everything needed** (`@tauri-apps/api` 2.11.1, in
  `node_modules/@tauri-apps/api/window.d.ts`): `getCurrentWindow()` with `setSize`,
  `innerSize`, `outerSize`, `isMaximized`, `unmaximize`, `setPosition`, `outerPosition`;
  `currentMonitor()` returning `{ size, position, workArea: { position, size },
  scaleFactor }`. **`workArea` is the monitor without its taskbar**, in PHYSICAL pixels,
  and `scaleFactor` converts: `monitor.workArea.size.toLogical(monitor.scaleFactor)`.
- **Three permissions are missing and the call will fail without them.** Checked against
  `src-tauri/gen/schemas/acl-manifests.json`: `core:window:default`, which `core:default`
  brings in, allows `current-monitor`, `inner-size`, `outer-size`, `scale-factor`,
  `is-maximized` and `outer-position` - every READ this phase needs. It does not allow
  `set-size`, `unmaximize` or `set-position`. All three exist as permissions and must be
  added to `src-tauri/capabilities/default.json`.
- **`isDesktop()` is `src/storage/paths.ts`'s**, and it asks by reading
  `'__TAURI_INTERNALS__' in window` rather than importing anything, on purpose.
- The window is declared in `tauri.conf.json` at 1400 by 980 with a minimum of 960 by
  720, and built in `lib.rs` with `"create": false`.

## Settled decisions

- **The arithmetic is a pure function and the Tauri calls are a thin shell around it.**
  Everything that can be decided without a window is decided in one tested function: the
  size a board needs, the work-area clamp, the minimum-size clamp, and whether and where
  the window has to move to stay inside the work area. The desktop half reads four
  numbers, calls that function, and applies the answer. That is the only shape in which
  this is testable at all, since no test may start a Tauri call.
- **The size a board needs** is `board + CHROME_BESIDE_WIDE` wide and `board +
  CHROME_ABOVE + CHROME_BELOW` tall, as an INNER size. **Those constants keep their
  single home in `board-size.ts`** - export them or export a function that uses them, but
  do not write 607, 167 or 224 anywhere else (CLAUDE.md's rule: they are the only pixel
  numbers allowed in a `.ts` or `.tsx`, and they live in one file).
- **Which board each size means.** Small is 416. Large is `fitBoardSize` asked for 832
  against the **work area** rather than against the window, so the window is never sized
  for a board the screen cannot show, and the board it is sized for is the board that
  will then be drawn.
- **`setSize` may set the inner or the outer size: check, do not assume.** Set it, read
  `innerSize()` back, and see which one moved. The phase notes say which it is, with the
  numbers. If it is the outer size, the frame has to be added rather than subtracted, and
  getting that backwards is a window a title bar too short every time.
- **The frame is measured, not assumed**: `outerSize` minus `innerSize`, at the moment of
  the change, both converted to logical pixels.
- **A maximised window is un-maximised first.** A maximised window ignores a size. This
  is the case Q28's "both ways" makes real: maximised, then Small, un-maximises and
  shrinks to 1023 by 807.
- **Moving, not centring.** If the resized window would hang off the work area, move it
  back inside by the least that puts it there. A window the user placed stays where they
  put it as far as it can. Do not call `center()`.
- **The web does nothing.** A page cannot resize a window it did not open and an iPad has
  no window, so on the web the toggle is exactly what it is today. The desktop half is
  imported lazily behind `isDesktop()` (S14) so the browser bundle does not carry it.
- **Opening the app resizes nothing.** Only the toggle resizes. A window the user sized
  stays sized until they press a toggle.
- **No headless browser on this machine, ever.** Clear the pane's `localStorage` after
  every drive.

## The work

- [ ] 15.1 The pure function and its test (S15 item 24). Name it for what it answers.
      Cases worth holding: the small target is 1023 by 807; a large target is the board
      the work area allows plus the chrome; a work area too small clamps the target to
      it; a target under 960 by 720 clamps up to the minimum; a window near the right or
      bottom edge is moved back inside, by the least that does it, and a window already
      inside is not moved at all.
- [ ] 15.2 The desktop half, lazily imported: read `currentMonitor()`, `innerSize()`,
      `outerSize()`, `isMaximized()` and `outerPosition()`; un-maximise if needed; call
      the pure function; `setSize`, and `setPosition` only if the answer says to move.
      One home for it, in `src/ui`, beside the other things the screen does to its
      window. It fails quietly: a window that will not resize is not a reason to stop the
      user changing the board size.
- [ ] 15.3 The toggle calls it for both sizes. The setting is still remembered exactly as
      it is now, and the board still comes from `useBoardPixels`, which will see the
      `resize` event the window fires.
- [ ] 15.4 `src-tauri/capabilities/default.json` gains `core:window:allow-set-size`,
      `core:window:allow-unmaximize` and `core:window:allow-set-position`, and its
      `description` says what they are for, in the voice the file already uses.
- [ ] 15.5 Tests: S15 items 24 and 25. **No test starts a Tauri call**; the DOM tests run
      in jsdom where `isDesktop()` is false, and item 25 is that the toggle still changes
      the setting and the board there.
- [ ] 15.6 Driven. In the pane first: nothing resizes, the toggle still works, the suite's
      claim about the web holds. Then **in the packaged window**, which is where this
      phase actually lives: build it, shrink the window into the dead band (about 1000 by
      780), press Large and watch the window grow and the board become large; press Small
      and watch it go back to 1023 by 807; maximise and press Small; put the window at
      the bottom right of the screen, press Large, and check it is moved back inside
      rather than hanging off. Record every number in the notes.
- [ ] 15.7 Version 1.3.0 in the three files. Docs swept: `docs/acceptance.md` (item 8 is
      the Windows one and gains this), `README.md` if it names the toggle, `CLAUDE.md`'s
      current state and its single-home list if a new home appears, the plan's phase 15
      notes and boxes. Reuse review, commit, then `export PATH="$HOME/.cargo/bin:$PATH"`
      and `npx tauri build`, with the installer's path and size in the notes.

## Decision rules

- **If `setSize` turns out to set the outer size**, say so in the notes with the two
  readings that showed it, and make the pure function take the frame in the direction
  that is actually true. Do not carry an assumption into the arithmetic.
- **If the work area cannot fit even the small target**, the clamp answers the work area
  and the fit rule does the rest, exactly as today. That is not a failure and needs no
  message.
- **If a permission is refused at runtime**, the console will say which. Add it to the
  capability, say so in the notes, and do not work around it by reaching for a shell
  command or a Rust command that does not need one.
- Anything a person would see or feel that section 20 does not settle: ask Nick, do not
  guess.

## Out of scope

The chrome constants themselves, the layout, the fit rule's own arithmetic, and anything
about the board other than how big the window is around it. The web build's behaviour.
Resizing on startup.

## Acceptance

`npx vitest run` green under twenty seconds with nothing skipped; `tsc -b` clean;
`npx oxlint` silent; `npm run build` clean. In the packaged window, the toggle changes the
window both ways and the board with it, from a shrunk window and from a maximised one,
with the window kept inside the work area. In the browser nothing resizes and the toggle
still works. 1.3.0 in the three files, the installer built and its size recorded. Every
box ticked or its gap written down.

## Conventions

Commits on `main`, short imperative subject, a body that says why, ending with
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` (name the model you actually
are). Write the message to a scratch file and `git commit -F` it. Stage explicit paths,
never `git add -A`, never `git clean`. No em dashes under `src/`. Australian English.
Spec section 3's words. Nick's own files are not listed or reported. Never push.
