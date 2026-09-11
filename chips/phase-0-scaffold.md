# Chip: phase 0 - the scaffold

You are a builder session in `C:\Users\nick2\Code\SimpleChess`, working on `main` (no
worktree; there is no remote yet, and you never push or create one). Read
`CLAUDE.md`, `docs/simple-chess-spec.md` sections 1 to 4, 10, 13 and 14, and
`docs/simple-chess-build-plan.md` ("Rules for the builder", "Standing discipline" and
phase 0) before starting. Everything below is compressed from those; where this chip
and the spec disagree, the spec wins and you say so in the phase notes.

**Goal: `npm run dev` opens a page titled Simple Chess with the version and the theme
toggle, `npx vitest run` is green, `npm run build` produces `dist/`.** Nothing about
chess yet. This phase proves the tools work together and puts the header on screen.

## What this app is, in one paragraph

A no-frills chess game against Stockfish on one screen, copied from the Repertoire
Trainer in `C:\Users\nick2\Code\London` (React 19, TypeScript, Vite 8, vitest 4,
chessground, chess.js, Stockfish WASM, Tauri 2 for Windows) and from Conquest in
`C:\Users\nick2\Code\Conquest` (the same web stack as an iPad Home Screen app). Copy
their files. Change only what the spec says to change. Never edit anything under those
two folders.

## Settled decisions you build on

- **Copy per spec S3.** A file this app does not change is byte-identical to the
  trainer's, plus one line at the top of its header comment: `Origin: London
  src/ui/theme.ts, identical.` (or `... adapted: <what changed>`). A file with no
  header comment gets one two-line comment holding the origin line.
- **Ports.** Dev 5185, preview 5186, both `--strictPort`. 5173, 5175, 5180 and 5181
  belong to other projects on this machine and may be live.
- **Node.** The shell has Node 20.20.2 and npm 10.8.2, which Vite 8 accepts.
  `.node-version` says `22.12.0` for Cloudflare Pages (phase 7) and is not what you
  run locally. Do not install a different Node.
- **The version** is `0.1.0` in `package.json`, shown in the header as
  `__APP_VERSION__` from Vite's `define`. The two Tauri files arrive in phase 8.
- **Theme.** Dark by default, light on the toggle, remembered under
  `simple-chess.theme`. The palette is the trainer's `src/index.css`, unchanged.
- **Words.** "The user", never "trainee". No em dashes under `src/`. Australian
  English. One name for one thing (spec section 3).
- **No PWA plugin yet.** `vite-plugin-pwa` is installed but not configured until
  phase 7, so no service worker exists while the screen is being built.

## The work

### 0.1 `package.json`

- [ ] Name `simple-chess`, version `0.1.0`, `"private": true`, `"type": "module"`,
  description `A simple chess game against Stockfish`. Scripts, exactly:

  | Script | Value |
  |---|---|
  | `dev` | `npm run engine && vite --port 5185 --strictPort` |
  | `build` | `npm run engine && tsc -b && vite build` |
  | `preview` | `vite preview --port 5186 --strictPort` |
  | `engine` | `node scripts/copy-engine.mjs` |
  | `test` | `vitest run` |
  | `test:watch` | `vitest` |
  | `lint` | `oxlint` |
  | `icons` | `node tools/make-icons.mjs` |
  | `tauri` | `tauri` |

- [ ] Dependencies, at the trainer's ranges (verified in `London/package.json`
  2026-09-11): `@tauri-apps/api ^2.11.1`, `@tauri-apps/plugin-dialog ^2.7.2`,
  `@tauri-apps/plugin-fs ^2.5.1`, `chess.js ^1.4.0`, `chessground ^9.2.1`,
  `react ^19.2.8`, `react-dom ^19.2.8`, `stockfish ^18.0.8`. NOT `ts-fsrs`, NOT
  `react-markdown`.
- [ ] Dev dependencies: the trainer's, exactly as it pins them: `@tauri-apps/cli
  ^2.11.4`, `@testing-library/dom 10.4.1`, `@testing-library/react 16.3.3`,
  `@testing-library/user-event 14.6.7`, `@types/node ^24.13.3`, `@types/react
  ^19.2.18`, `@types/react-dom ^19.2.4`, `@vitejs/plugin-react ^6.1.0`,
  `@vitest/coverage-v8 ^4.1.11`, `jsdom 27.4.0`, `oxlint ^1.79.0`, `typescript
  ~6.0.2`, `vite ^8.2.2`, `vitest ^4.1.11`; plus Conquest's `vite-plugin-pwa ^1.3.0`
  and `sharp ^0.35.4`. The four exact pins (the three testing-library packages and
  jsdom) stay exact, for the trainer's reason: those four move together.
- [ ] `npm install`. Commit `package-lock.json`.

### 0.2 TypeScript, lint, Node

- [ ] `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: the trainer's three,
  identical (they carry no comments to put an origin line in; the phase notes say
  they are copies).
- [ ] `.oxlintrc.json` identical. `.node-version` containing `22.12.0`.

### 0.3 `vite.config.ts`

- [ ] The trainer's, with these changes and no others: the port comment and default
  become 5185; the two vitest projects stay exactly as written (`string` in node
  for `src/**/*.test.ts`, `dom` in jsdom for `src/**/*.dom.test.tsx` with
  `setupFiles: ['src/test/dom-setup.ts']`); the `define` for `__APP_VERSION__` stays.
  No `VitePWA`. Origin line adapted.

### 0.4 Ignore and editor files

- [ ] `.gitignore` already exists in the repository (the orchestrator wrote it from
  the trainer's plus Conquest's `dev-dist/`). Leave it unless something is missing.
- [ ] `.vscode/extensions.json` and `.vscode/settings.json` copied from Conquest.
  The `.gitignore` already lets those two through.

### 0.5 `.claude/launch.json`

- [ ] Two configurations in Conquest's shape (the `//` comment key, `--prefix`
  pointing at `C:/Users/nick2/Code/SimpleChess`): `simple-chess-dev` running `npm
  run dev` on port 5185, and `simple-chess-preview` running `npm run preview` on
  5186. The comment on the preview says it is the only way to test the service
  worker, which arrives in phase 7.

### 0.6 The engine files

- [ ] `scripts/copy-engine.mjs` identical. Run `npm run engine` and confirm
  `public/engine/stockfish-18-lite-single.js` and `.wasm` appear and are ignored by
  git (`git status` shows nothing under `public/engine`).

### 0.7 `index.html`

- [ ] Conquest's head with this app's words: `lang="en-AU"`, the viewport meta with
  `viewport-fit=cover`, `<title>Simple Chess</title>`, `theme-color` `#16181c`, the
  two `mobile-web-app-capable` metas, `apple-mobile-web-app-title` Simple Chess, the
  `apple-touch-icon`, `favicon-32.png` and `icon.svg` links. Those three icon files
  do not exist until phase 7; a link to a missing file is a 404 in the console and
  nothing else, and the phase notes say so. Body: `<div id="root">` and the module
  script for `/src/main.tsx`, as both apps have.

### 0.8 The source files

- [ ] `src/main.tsx`: the trainer's (`StrictMode`, `createRoot`, `./index.css`,
  `App`). Origin line.
- [ ] `src/index.css` identical. `src/globals.d.ts` identical.
- [ ] `src/ui/theme.ts` identical but for `const KEY = 'simple-chess.theme'`. Origin
  line says `adapted: the storage key`.
- [ ] `src/ui/app.css`: from the trainer's, keep ONLY `.app`, `.app-header`,
  `.app-header h1`, `.app-version`, `.app-nav`, `.nav-link` and its `:hover`,
  `button` and `button:hover`, `.theme-toggle` and its `:hover`, and the
  `@media (min-width: 900px) and (min-height: 700px)` block. Add the trainer's
  app-wide `button:disabled` rule (`opacity: 0.5; cursor: default;`), which lives at
  `London/src/ui/drill.css` line 132 because Drill was the first screen to need it;
  it belongs in `app.css` here, and the origin line says where it came from. Drop the tagline, the scratch board, the
  status table and the read-failure rules. Origin line says what was cut.

### 0.9 `App.tsx`

- [ ] `src/ui/App.tsx`: a `header.app-header` holding `<h1>Simple Chess <span
  className="app-version">v{__APP_VERSION__}</span></h1>` and a `nav.app-nav` with
  the theme toggle button exactly as the trainer's (`className="nav-link
  theme-toggle"`, the same `title` and `aria-label` wording, the label "Light" in
  dark and "Dark" in light), then an empty `<main>`. Wrapped in `div.app`. No
  providers, no tagline. `useTheme` called here.

### 0.10 The version test

- [ ] `src/version.test.ts`: the trainer's, identical text, except that the two
  tests reading `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml` become
  `it.skip` with one comment above each: `Phase 8 adds the file and unskips this.`
  The other two tests run.

### 0.11 The DOM test helpers

- [ ] `src/test/dom-setup.ts` identical.
- [ ] `src/test/dom.tsx`: `renderApp` rendering `<App />` (no providers exist yet;
  the comment says the trainer's `Shell` split arrives when the first provider
  does, in phase 2) and returning `{ user }`. Nothing else yet.

### 0.12 `docs/testing.md`

- [ ] The trainer's `docs/testing.md`, adapted: keep "The two kinds of test", "Why
  the DOM kind exists" (shortened to its first paragraph and the three bugs, which
  are the reason the rig exists here too), "What is faked, and why", "The rules this
  suite keeps" and "Writing one". Drop "The content checkers". Replace the trainer's
  names (`PlayProvider`, `play-context.tsx`, the course wording) with this app's
  where a sentence would otherwise be false; where a helper does not exist yet, say
  which phase brings it.

### 0.13 The first DOM test

- [ ] `src/ui/shell.dom.test.tsx`: renders the app; the heading reads "Simple Chess"
  and contains "v0.1.0" (read the version from `package.json` in the test rather
  than hard-coding it, as `version.test.ts` does); the button named "Switch to the
  light theme" sets `document.documentElement.dataset.theme` to `light` and writes
  `simple-chess.theme` = `light` to `localStorage`; pressing it again goes back.
  Shown red first by asserting the wrong key, then fixed.

### 0.14 Prove it

- [ ] `npm run dev` serves on 5185. Open it in the pane at 1280 by 1000. The header
  shows the name, `v0.1.0` in the faint style, and the toggle. Press the toggle:
  the ground changes colour and `localStorage` holds the key. Screenshot both
  themes and put the two file names in the phase notes.
- [ ] `npx vitest run`: both projects green. `tsc -b` clean. `npx oxlint` reports no
  errors. `npm run build` finishes and `dist/index.html` exists.

## Decision rules

- **A copied file does not compile here.** Fix the copy in the smallest way, and
  record the fault in the phase notes so the orchestrator can carry it back to the
  trainer. Do not touch the trainer.
- **A dependency version fails to install.** Try the trainer's exact
  `package-lock.json` version for that package first. If that fails too, stop that
  item and ask.
- **Something a person would see is not specified.** Stop and ask Nick. Something
  about code shape is not specified: decide, and say what you decided and why in
  the notes.
- **A contradiction between this chip, the plan, the spec and the copied code.**
  Stop that item, write the contradiction under the phase notes, continue with the
  items that do not depend on it.

## Out of scope for this phase

The board, the engine adapter, the session, any provider, any sidebar, the PWA
plugin, icons, Tauri, scenes, the layout probe. Phase 1 copies the engine and the
model; phase 2 puts a game on screen.

## Acceptance

Phase 0 of the plan, every box ticked in the same sitting each item lands: the dev
page shows the header in both themes at 1280 by 1000 with screenshots named in the
notes; `npx vitest run` green in both projects with the shell test and the two live
version tests; `tsc -b` clean; `npm run build` makes `dist/`; `public/engine/` filled
and ignored; every copied file carries its `Origin:` line; no em dashes under `src/`;
no file under `../London` or `../Conquest` changed (`git -C ../London status` and
`git -C ../Conquest status` show nothing new from you).

## Conventions

- Tick the plan's boxes as you go. Append the phase notes under "Phase notes" in the
  plan: what was measured, decided, asked, what the reuse review found (say "nothing"
  if nothing), what is left. Update the Progress table row for phase 0.
- Close with a reuse and duplication review of the new code before the commit. In
  this phase the likely find is a second copy of the version read, or a colour
  written outside `index.css`.
- One commit at least, on `main`. Short imperative subject, a body that says why.
  End the message with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`,
  naming the model you actually are. PowerShell 5.1 mangles some multi-line
  messages: write the message to a scratch file and `git commit -F` it.
- Stage explicit paths. Never `git add -A`. Never `git clean`. Never push.
- Nick's own files are not yours: list, read and report nothing under his profile
  beyond what a step names. Clear the pane's `localStorage` after the drive.

## Cleanup

Stop the dev server you started. Leave `public/engine/` in place (ignored) and
`node_modules/` in place. Report the commit hash, the test count and time, and the
two screenshot names.
