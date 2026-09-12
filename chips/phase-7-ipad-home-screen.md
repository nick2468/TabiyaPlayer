# Chip: phase 7 - the iPad Home Screen app

You are the builder session in `C:\Users\nick2\Code\SimpleChess`, on `main`. Your
context may have been compacted since phase 6; Nick decides that each time. **Do not
rely on what you remember of phases 0 to 6.** Read fresh, in this order, before
touching a file: `CLAUDE.md`; `docs/simple-chess-spec.md` sections 1, 4.4, 10, 12
(all of it), 13 and 14; the plan `docs/simple-chess-build-plan.md` "Rules for the
builder", "Standing discipline", phase 7, and the phase 6 notes with the gate 6
findings at the end; then `docs/testing.md`; then, in `../Conquest`:
`vite.config.ts`, `index.html`, `src/vite-env.d.ts`, `src/ui/useUpdate.ts`,
`src/ui/UpdateBanner.tsx`, `src/ui/updates.ts`, `src/ui/updates.test.ts`,
`tools/make-icons.mjs`, `docs/conquest-deploy.md`, and the `.update-bar` rules in
`src/ui/styles.css`. Everything below is compressed from those; where this chip and
the spec disagree, the spec wins and you say so in the phase notes.

**Goal: the built app is a Home Screen app. It has an icon and a manifest, it opens
with no internet and plays a move against the engine, and it offers a new version
rather than forcing one. The deploy document tells Nick his steps.** Version stays
0.1.0.

## Where things stand

Phases 0 to 6 are committed and passed review (phase 6 is `c415000`). The app is
complete as a browser game and every screen can be set up from the address bar in
development. `index.html` already carries Conquest's head: `lang="en-AU"`, the
viewport with `viewport-fit=cover`, `theme-color` `#16181c`, the two
`mobile-web-app-capable` metas, `apple-mobile-web-app-title`, and links to
`/apple-touch-icon.png`, `/favicon-32.png` and `/icon.svg`, none of which exist yet.
`src/storage/paths.ts` has `isDesktop()`. `vite.config.ts` has no PWA plugin (left
out in phase 0 so no service worker existed while the screen was built).
`vite-plugin-pwa` and `sharp` are installed. `.node-version` says `22.12.0`.
`package.json` has `"icons": "node tools/make-icons.mjs"` and `"preview": "vite
preview --port 5186 --strictPort"`, and `.claude/launch.json` has
`simple-chess-preview` on 5186. 243 tests green. Conquest is
`C:\Users\nick2\Code\Conquest`; you read and copy from it and never change it.

## Settled decisions you build on

- **A PWA exactly as Conquest** (spec 12.1): `vite-plugin-pwa` with `registerType:
  'prompt'` and `injectRegister: null`, the worker WAITS and the app shows a banner;
  `devOptions` off, so no service worker in development.
- **S11: the engine must be in the precache and it is bigger than the default
  limit.** The WASM is about 7 MB and Workbox refuses files over 2 MiB unless told:
  `maximumFileSizeToCacheInBytes: 12 * 1024 * 1024`, and `wasm` in `globPatterns`.
  Without it the app opens offline and the engine never answers.
- **S12: no service worker inside the Tauri window.** The registration hook runs only
  when `!isDesktop()`, and a hook cannot be called conditionally, so the banner and
  its hook live in a component that is rendered only off the desktop.
- **The banner's wording** (spec 12.1): because the game and the settings are
  remembered (spec 10), loading a new version costs nothing. Heading "A new version
  is ready", detail "Your game and settings are remembered, so loading it loses
  nothing.", buttons "Load it" and "Not now". Conquest's mid-game warning does not
  apply.
- **The manifest** (spec 12.1): name and short name "Simple Chess", `display:
  standalone`, `orientation: any`, `background_color` and `theme_color` `#16181c`,
  icons 192 and 512 plus a maskable 512, `start_url` and `scope` `/`.
- **Icons** (spec 12.3): `public/icon.svg`, a single knight in the piece white
  `#ece9e2` on the dark ground `#16181c`; `tools/make-icons.mjs` adapted from
  Conquest's writes `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180,
  square corners: iPadOS rounds them itself) and `favicon-32.png` into `public/`; the
  output is committed. Phase 8 makes the Windows icon from the same SVG.
- **Hosting** (spec 12.2): Cloudflare Pages, project `simplechess`, from
  `nick2468/SimpleChess` on `main`, `npm run build` into `dist`, Node 22.12.0, custom
  domain `simplechess.datacrafter.net`. Nick's steps, with his accounts.
- **Copy per spec S3**; `user` words; no pixel numbers or colours in `.ts`/`.tsx`
  (the manifest's two colours live in `vite.config.ts`, which is config, not `src/`;
  say so in a comment there and point at `index.css`); screenshots looked at and
  described, no files, no headless browser; clear the pane's storage at the end.

## The work

### 7.1 The icon

- [ ] `public/icon.svg`: a 512 by 512 square, ground `#16181c`, one knight drawn in
  `#ece9e2`. Draw a plain knight silhouette with a few path commands of your own, or
  take the cburnett knight's outline from `node_modules/chessground/assets/
  chessground.cburnett.css` (it is a data URI SVG; GPL, which this app already
  carries). Say which. Keep it readable at 32 px: one shape, no thin lines.
- [ ] `tools/make-icons.mjs`, adapted from Conquest's with an origin line: reads
  `public/icon.svg` (rather than building the art from a map), and writes the four
  PNGs with `sharp` as Conquest's `wanted` table does: `icon-192.png` and
  `icon-512.png` from a rounded version (`rx` 112 at 512, Conquest's number),
  `apple-touch-icon.png` at 180 from the square one, `favicon-32.png` at 32. To make
  the rounded version, wrap the SVG's content in a group and put a rounded `rect`
  behind it in the script, as Conquest does; the committed `icon.svg` stays square.
- [ ] Run `npm run icons` and commit the four PNGs and the SVG. Look at the 32 and the
  180 in the pane (open the files by URL from the dev server) and say what you saw.

### 7.2 The manifest and the worker

- [ ] `vite.config.ts`: add `VitePWA` from `vite-plugin-pwa`, Conquest's settings
  with this app's manifest (above). `includeAssets: ['apple-touch-icon.png',
  'favicon-32.png', 'icon.svg']`. `workbox: { globPatterns: ['**/*.{js,css,html,png,
  svg,webmanifest,wasm}'], maximumFileSizeToCacheInBytes: 12 * 1024 * 1024 }`, with
  the S11 comment. `devOptions: { enabled: false }` with Conquest's comment.
  `registerType: 'prompt'` and `injectRegister: null` with Conquest's comments,
  reworded where they speak of a game that is not saved (here it is). Origin line
  adapted.
- [ ] `src/vite-env.d.ts`, new: `/// <reference types="vite/client" />` and
  `/// <reference types="vite-plugin-pwa/react" />` (the second is what types
  `virtual:pwa-register/react`). `globals.d.ts` stays as it is. If `tsconfig.app.json`'s
  `types: ["vite/client"]` makes the reference redundant, keep the file anyway for the
  PWA reference and say so.
- [ ] `npm run build`: `dist/sw.js` and `dist/manifest.webmanifest` exist; the
  precache manifest inside `sw.js` names `engine/stockfish-18-lite-single.wasm` and
  `.js`. Record the sizes.

### 7.3 The banner

- [ ] `src/ui/updates.ts`, adapted from Conquest's: `updateNotice()` with no
  argument, returning the one notice above. `updates.test.ts` reduced to: the heading
  names a new version; the detail says the game is remembered; the button says "Load
  it". Origin lines.
- [ ] `src/ui/useUpdate.ts`, Conquest's, adapted: the `pretendUpdate` query stays
  (development only, it is how the banner is looked at without a real update), and
  the comment on the reload-anyway timer stays. Origin line.
- [ ] `src/ui/UpdateBanner.tsx`, Conquest's, adapted: no `gameInProgress` prop; it
  renders `updateNotice()`; `className="update-bar"`, `role="status"`. Origin line.
- [ ] `src/ui/UpdateWatch.tsx`, new: a component that calls `useUpdate()` and renders
  `<UpdateBanner>` when `waiting`, else null. `Shell` renders `{!isDesktop() &&
  <UpdateWatch />}` (spec S12), with the comment that a hook cannot be behind a
  condition but a component can.
- [ ] CSS: Conquest's `.update-bar`, `.update-words` and `.update-buttons` rules
  (`styles.css`, from line 895 on 2026-09-11) into `app.css`, with the colour names
  changed to this app's tokens (`--surface`, `--line`, `--text-dim`) and an origin
  line. The bar sits at the bottom with the safe-area padding as Conquest's does.
- [ ] DOM test (`src/ui/update.dom.test.tsx`): with `vi.mock('virtual:pwa-register/
  react')` returning `needRefresh: [true]` and a `vi.fn()` for `updateServiceWorker`,
  the banner shows the heading and the two buttons; "Not now" hides it; "Load it"
  calls `updateServiceWorker(true)`. And one test that on the desktop (`window.
  __TAURI_INTERNALS__` set before render) no banner and no registration happen.
- [ ] In the pane: `npm run dev`, open `/?pretendUpdate` and look at the banner in
  both themes at 1280 by 1000 and at 820 by 1180; it sits at the bottom, over the
  page, and "Not now" removes it. Record the probe: the banner must not change
  `scrollWidth`.

### 7.4 The offline proof

- [ ] `npm run build`, then the launch configuration `simple-chess-preview` (port
  5186). Open `http://localhost:5186/` in the pane, play one move and see the reply
  (this is the visit that lets the worker precache). Check in the console that a
  service worker is registered (`navigator.serviceWorker.getRegistrations()` in the
  JavaScript tool has one entry with `active`).
- [ ] Stop the preview server (`preview_stop`), then reload the page in the pane.
  It must open, show the board, and play a move with the engine replying, with every
  request refused. Record what you saw. If the page opens but the engine never
  answers, S11 is the first thing to check (the precache manifest in `sw.js`).
- [ ] Start the preview server again for the cleanup, unregister the worker in the
  pane (`registration.unregister()`) and clear storage, so the next session's dev
  drive is not served a cached build. Say so in the notes.

### 7.5 The documents

- [ ] `docs/simple-chess-deploy.md`, adapted from `../Conquest/docs/conquest-deploy.md`
  with an origin line: project `simplechess`, repository `nick2468/SimpleChess`,
  domain `simplechess.datacrafter.net`, `.node-version` 22.12.0 and the
  `NODE_VERSION` variable, the Home Screen steps, the aeroplane-mode proof (one move
  and the engine's reply, because the engine is the thing that can silently fail
  offline), and "Getting a new version onto the iPad" reworded for a banner that
  costs nothing. Every step that needs Nick's account or his iPad says so at the
  top, as Conquest's does. Leave the "It is live" block as a template with the date
  blank for Nick to fill in.
- [ ] `README.md`: replace "Arrives with phase 0" with the two ways to run it (the
  dev server, and the Home Screen app once published) and a pointer to the deploy
  document.
- [ ] `docs/testing.md`: one paragraph on the offline proof and the `pretendUpdate`
  query.

### 7.6 Close

- [ ] `npx vitest run` both projects green under twenty seconds; counts and time.
  `tsc -b` clean, `npx oxlint` silent, `npm run build` clean.
- [ ] Copies diffed and listed. No forbidden words in adapted or new files. No pixel
  number or colour in a `.ts` or `.tsx` other than `board-size.ts` and
  `vite.config.ts`'s two manifest colours.
- [ ] Reuse and duplication review, then commit.
- [ ] Tell Nick, in the report, exactly which steps in the deploy document are his:
  the GitHub push, the Cloudflare project, the DNS record, the Home Screen add, and
  the aeroplane-mode game. Plan box 7.8 is his to tick.

## Decision rules

- **The preview server serves the worker but the pane reports no registration**: the
  page must be on `localhost` (it is) and the worker file must be reachable at
  `/sw.js`; check the network list for it. A `registerType: 'prompt'` worker
  registers on load but only takes over after a reload.
- **The offline reload shows the page but the engine hangs**: read `dist/sw.js`'s
  precache list for the two engine files. If they are absent, the size limit is the
  cause. Fix the config, not the engine.
- **`virtual:pwa-register/react` will not resolve in the test**: mock it at the top of
  the test file; do not add the plugin to the vitest projects.
- **Something a person would see is not specified** (the knight's exact shape is
  yours; the banner's position and wording are spec 12.1's): stop and ask Nick for
  the second kind. Code shape: decide and say why.
- **A contradiction** between chip, plan, spec and copied code: stop that item, write
  it down, continue with the rest.

## Out of scope for this phase

Publishing (Nick's), Tauri and the Windows icon set (phase 8), any change to the
layout.

## Acceptance

Phase 7 of the plan, boxes 7.1 to 7.7 ticked as they land: the icon set committed;
`dist/` carries `sw.js` and the manifest with both engine files in the precache; the
built site opens and plays a move with the preview server stopped; the banner shows
under `?pretendUpdate` and never on the desktop; the deploy document names Nick's
steps; suite green under twenty seconds; `tsc -b` clean; `../London` and
`../Conquest` untouched. Box 7.8 stays open for Nick.

## Conventions

- Tick the plan's phase 7 boxes as you go. Append "Phase 7 - builder notes" under the
  plan's "Phase notes" after the gate 6 findings: measured, decided, asked, the reuse
  review's find, left. Update the Progress table row.
- The reuse review's likely finds this phase: a second `isDesktop` check written as
  `'__TAURI_INTERNALS__' in window` somewhere; a second copy of the safe-area padding
  rule (the banner's and `.app`'s share the insets; one custom property if the same
  four `max()` calls appear twice); the manifest's colours written anywhere but the
  config.
- One commit at least, on `main`. Short imperative subject, a body that says why. End
  the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, naming the
  model you actually are. Write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours.

## Cleanup

Stop both servers. Unregister the worker in the pane and clear its storage. Report the
commit hash, the test counts and time, the `sw.js` precache entries for the engine,
what the offline reload showed, and the steps that are Nick's.
