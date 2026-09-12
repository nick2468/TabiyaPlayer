# Chip: phase 6 - scenes, the probe and the layout pass

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`. Your
context may have been compacted since phase 5; Nick decides that each time. **Do not
rely on what you remember of phases 0 to 5.** Read fresh, in this order, before
touching a file: `CLAUDE.md`; `docs/simple-chess-spec.md` sections 4, 13.3, 14 and
15 (all of it); the plan `docs/simple-chess-build-plan.md` "Rules for the builder",
"Standing discipline", phase 6, and the phase 5 notes with the gate 5 findings at
the end; then `docs/testing.md`; then `../London/scripts/packaged-eval.mjs` and
`../London/src/ui/Diagnostics.tsx` (the dev-only pattern) and
`../Conquest/src/ui/useUpdate.ts` (the `pretendUpdate` query pattern). Everything
below is compressed from those; where this chip and the spec disagree, the spec wins
and you say so in the phase notes.

**Goal: every screen of spec 15 can be set up from the address bar in a development
build, the layout probe exists as a file, the packaged-app script is in place for
phase 8, and the layout holds at all three viewports, both sizes and both themes.**
No pixel is meant to change unless the pass finds a fault. Version stays 0.1.0.

## Where things stand

Phases 0 to 5 are committed and passed review (phase 5 is `2ef0843`). The app is
complete as a browser game: the board, the bar with its number, the four buttons,
the hint, the promotion picker, the sidebar's three settings, Save game and Load
game, everything remembered. `Shell` (`src/ui/App.tsx`) reads the three settings
through hooks from `src/storage/prefs.ts`, reopens the remembered game through
`startFrom(sans, side, level)`, and starts a fresh game otherwise; `useTheme` in
`src/ui/theme.ts` reads `simple-chess.theme` through `prefs.ts`'s `read`. The
provider has `askHint`. 222 tests green. The trainer is `C:\Users\nick2\Code\London`;
you read and copy from it and never change it.

## Settled decisions you build on

- **Scenes exist in development builds only** (spec 15.1). The check is on
  `import.meta.env.DEV`, so Vite's dead-code removal drops every scene from the
  production bundle. `main.tsx` stays free of harness code (spec 13.3): the dev code
  lives in `src/dev/` and is reached from `App.tsx`, not from the entry point.
- **The five scenes** (spec 15.1): `fresh`, `midgame` (a fixed 20-move game, played
  through the session so the list and the bar are real), `mate` (a fixed game ending
  in checkmate), `promotion` (a pawn one step from promoting), `hint` (`midgame` with
  a hint already asked). The three settings `size`, `theme` and `side` may be given
  too and override storage for that load.
- **The probe** (spec 15.3): `scripts/probes/layout.js`, one JavaScript expression
  returning JSON with the bounding boxes of `.board`, `cg-board`, `.live-eval`,
  `.play-controls`, `.sidebar` and `.move-list`, plus `scrollWidth` and `innerWidth`.
  Evaluated in the pane during development and, in phase 8, against the installed
  app through the trainer's `packaged-eval.mjs`.
- **S16, the two numbers that must hold:** the bar, `.board` and `cg-board` end on
  the same pixel, and `scrollWidth` never exceeds `innerWidth`.
- **Screenshots**: looked at and described with the probe's numbers. No files. No
  headless browser. Clear the pane's storage at the end.
- **Copy per spec S3**; `user` words; no pixel numbers or colours in `.ts`/`.tsx`
  outside `board-size.ts`.

## The work

### 6.1 The scenes as data

- [ ] `src/dev/scenes.ts`, new. `export type SceneName = 'fresh' | 'midgame' |
  'mate' | 'promotion' | 'hint'`. `export interface Scene { sans: readonly string[];
  hint: boolean }` and `export const SCENES: Record<SceneName, Scene>`:
  - `fresh`: no moves.
  - `midgame`: twenty moves (forty plies) of a real opening, legal end to end, White
    to move at the end. Write the list and verify it replays with chess.js in the
    test below; a Ruy Lopez or a Queen's Gambit line is fine. Do not copy a line from
    the trainer's courses.
  - `mate`: `['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#']` (scholar's mate, the
    user as White wins).
  - `promotion`: `['a4', 'b5', 'axb5', 'a6', 'bxa6', 'Nc6', 'a7', 'Nb8']`, White to
    move with `axb8=Q` and three others legal (phase 4's sequence, checked).
  - `hint`: the `midgame` list with `hint: true`.
- [ ] `export interface SceneRequest { scene: SceneName; size?: BoardSizeName; theme?:
  Theme; side?: Colour }` and `export function sceneFromLocation(search: string):
  SceneRequest | null`: parses `URLSearchParams`; null when `scene` is absent or not
  one of the five; `size`, `theme` and `side` only when they are one of their allowed
  words (reuse `BOARD_SIZES` and `SIDES` from `prefs.ts`; the theme's two words are
  `theme.ts`'s, export a `THEMES` list from there rather than writing the pair
  again). Pure; no `window`.
- [ ] `src/dev/scenes.test.ts`: every scene's move list replays (`canReplayMoves`, or
  empty for `fresh`); `mate` ends in checkmate and `promotion` offers `axb8=Q`;
  `sceneFromLocation` parses the example in spec 15.1, ignores a scene that is not
  one of the five, ignores a bad `size`, and returns null for an empty search.

### 6.2 Applying a scene

- [ ] `src/dev/apply-scene.ts`, new: `applyScene(request: SceneRequest): void` writes
  the settings the request carries through the storage helpers (`write` for the
  theme, level is untouched, `setSide`/`setBoardSize` are hooks so write their keys
  through the same `write` and the key constants `prefs.ts` exports for that purpose;
  export them if they are not), and writes the scene's game through `rememberGame`
  (`{ version: 1, sans, side: request.side ?? 'white', level: 4 }`) or `forgetGame()`
  for `fresh`. It writes storage and nothing else, so the ordinary start path picks
  the scene up as if the app had been closed on that game with those settings. That
  is the whole trick, and it is why no scene needs a second way into the provider.
- [ ] `src/dev/use-dev-scene.ts`: `useDevScene(): SceneRequest | null`. When
  `import.meta.env.DEV` is false it returns null and touches nothing. Otherwise it
  reads `sceneFromLocation(window.location.search)` once (a `useState` initializer),
  calls `applyScene` for it, and returns it. `App` (not `main.tsx`) calls it BEFORE
  rendering `Shell`, so that the storage writes land before `Shell`'s hooks read
  storage. In development StrictMode runs the initializer twice; `applyScene` is
  idempotent, so say so in a comment rather than guarding it.
- [ ] The `hint` scene: `Shell` receives the request (a prop from `App`, or the hook's
  return threaded down) and, after the mount start resolves, calls `game.askHint()`
  when `request?.hint` is true. Keep it to one line in the existing mount effect,
  with a comment that this is the one thing storage cannot carry.
- [ ] Prove the bundle is clean: after `npm run build`, `grep -c "midgame"
  dist/assets/*.js` is 0 and so is `grep -c "Qxf7"`. Record the two counts in the
  notes. If either is not 0, the `import.meta.env.DEV` check is not where Vite can
  see it; fix that rather than the grep.
- [ ] DOM tests (`src/ui/scenes.dom.test.tsx`): vitest sets `import.meta.env.DEV` to
  true, so the hook is live in tests. Before `renderApp`, set the address with
  `window.history.replaceState({}, '', '/?scene=mate&side=white')`; the status line
  reads "You won by checkmate" and the list ends `Qxf7#`. A second test with
  `?scene=promotion` shows the four `move axb8=…` buttons. A third with
  `?scene=fresh&theme=light&size=large` has `data-theme` light and the Large radio
  ticked. Reset the address to `/` in an `afterEach` so the other files are not
  affected (`dom-setup.ts` does not know about it; add the reset there if it reads
  better, and say which).

### 6.3 The probe and the packaged-app script

- [ ] `scripts/probes/layout.js`: one expression (not a statement; `packaged-eval.mjs`
  evaluates it and awaits the result), for example an arrow function called at once,
  returning `{ board, cg, bar, controls, sidebar, list, scrollWidth, innerWidth,
  devicePixelRatio }` where each box is `{ x, y, width, height, bottom }` rounded to
  two decimals from `getBoundingClientRect()`, and `null` for an element that is not
  on the page. A comment at the top says what it is for and the two numbers S16
  wants from it.
- [ ] `scripts/packaged-eval.mjs`: the trainer's, identical, origin line. Nothing
  runs it until phase 8; it is here so the probe has its second reader in the repo.
- [ ] `docs/testing.md`: a short section "The layout probe and the scenes" saying how
  to open a scene, how to run the probe in the pane, and that phase 8 runs it against
  the installed app.

### 6.4 The layout pass

- [ ] `npm run dev` on 5185, header v0.1.0, storage cleared first. For each of the
  three viewports (1280 by 1000; 1180 by 820; 820 by 1180), each size (small, large)
  and each theme (dark, light): open `?scene=midgame` with `size` and `theme` in the
  address, dispatch a `resize` event after changing the viewport (the pane fires
  none), and evaluate the probe. Record every result as a table in the notes: 12
  rows, the bar/board/cg bottom values, `scrollWidth` against `innerWidth`, the
  `devicePixelRatio` the pane reported. Then `?scene=mate`, `?scene=promotion` (open
  the picker through the board's move seam as phase 4 did) and `?scene=hint` at 1280
  by 1000 in both themes, described in a sentence each. Look at every screenshot; a
  number cannot see a piece drawn wrong.
- [ ] Fix what the pass finds. Anything a person can see that the spec does not
  settle is a question for Nick, not a decision.

### 6.5 Close

- [ ] `npx vitest run` both projects green under twenty seconds; counts and time.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean, the two greps at 0.
- [ ] Copies diffed and listed (`packaged-eval.mjs`). No forbidden words in adapted
  or new files. No pixel number or colour in a `.ts` or `.tsx` other than
  `board-size.ts` (`scripts/probes/layout.js` is not under `src/` and may name
  selectors).
- [ ] Reuse and duplication review, then commit.

## Decision rules

- **A scene's storage write and the remembered game's shape drift.** They cannot, if
  `applyScene` writes through `rememberGame` and the exported key constants. If you
  find yourself writing a key string in `src/dev/`, stop and export the constant
  instead.
- **The pane reports a display scale of 1 after a navigation and 1.5 before.** Record
  which it reported for each probe row; the large board's size follows it (spec S2)
  and both answers are right for their scale.
- **A test cannot set `import.meta.env.DEV`.** It does not need to: vitest runs with
  it true. Do not mock it.
- **Something a person would see is not specified** (a scene's exact moves are yours
  to choose; a layout fault's fix that changes a number in spec 4.2 is not): stop
  and ask Nick for the second kind. Code shape: decide and say why.
- **A contradiction** between chip, plan, spec and copied code: stop that item, write
  it down, continue with the rest.

## Out of scope for this phase

The PWA (phase 7), Tauri and running `packaged-eval.mjs` (8), any change to the
layout numbers of spec 4.2 without a ruling.

## Acceptance

Phase 6 of the plan, every box ticked as it lands: the five scenes open from the
address bar in development and none of them survives `npm run build`; the probe file
exists and its output for the twelve viewport, size and theme combinations is in the
notes with S16's two numbers holding in every row; `packaged-eval.mjs` is in place
identical to the trainer's; suite green under twenty seconds; `tsc -b` clean;
`../London` and `../Conquest` untouched.

## Conventions

- Tick the plan's phase 6 boxes as you go. Append "Phase 6 - builder notes" under the
  plan's "Phase notes" after the gate 5 findings: measured (the twelve-row table),
  decided, asked, the reuse review's find, left. Update the Progress table row.
- The reuse review's likely finds this phase: a storage key written twice (once in
  `prefs.ts`, once in `src/dev/`); a second list of the two themes or the two sides;
  a second copy of the probe's box arithmetic (the probe is a script and the pane
  measurements are ad hoc; that is fine, but the probe file is the one that ships).
- One commit at least, on `main`. Short imperative subject, a body that says why. End
  the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, naming the
  model you actually are. Write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours.

## Cleanup

Stop the dev server. Clear the pane's storage. Report the commit hash, the test
counts and time, the twelve-row probe table, the two grep counts, and anything the
decision rules made you skip.
