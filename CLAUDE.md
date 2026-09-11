# Simple Chess

A no-frills chess game against Stockfish, on one screen. It runs as an installed
Windows app (Tauri 2 over WebView2, like the Repertoire Trainer in `../London`) and as
an iPad Home Screen app (a PWA on Cloudflare Pages, like Conquest in `../Conquest`),
from one React, TypeScript and Vite code base. The code is copied from those two apps
wherever they already do the job, so that a shared library can follow later.

Current state: phase 2 (the board, the session and a playable game) built 2026-09-12
and awaiting review. A game against the engine plays on screen at level 4 as White,
with New game, Undo, Redo, the status line and the move list; no sidebar settings yet.

## Documents

- [docs/simple-chess-spec.md](docs/simple-chess-spec.md) - what the app does and how
  it is built. Authoritative. Section 2 records Nick's rulings Q1 to Q14; numbered
  decisions S1 upward carry their reasons.
- [docs/simple-chess-build-plan.md](docs/simple-chess-build-plan.md) - the phases,
  their boxes, and the rules for the builder. Tick a box when the item lands with
  green tests and works on screen.
- [docs/testing.md](docs/testing.md) - the two kinds of test and the rules the suite
  keeps.
- [docs/simple-chess-deploy.md](docs/simple-chess-deploy.md) - Nick's Cloudflare and
  iPad steps (arrives in phase 7).
- `SimpleChess-brief.txt` - Nick's brief, kept for history. Build from the spec, not
  from this.

## Who does what

- **The orchestrator** is a session started here that writes the spec, the plan and
  one chip per phase, reviews each phase after it lands, and keeps the docs current.
  It builds nothing substantial itself.
- **The builder** is an Opus session that works one phase from its chip, on `main`,
  in this folder, and never pushes. It asks Nick rather than guessing on anything a
  person would see or feel. The plan's "Rules for the builder" bind.
- **Nick** rules, pushes to GitHub, and does the Cloudflare, DNS, iPad and installer
  steps that need his accounts and his devices.

## Toolchain

- Node 22.12.0 (`.node-version`), npm. Rust toolchain for phase 8 only.
- `npm run dev` on port 5185 (`--strictPort`; 5173 is dc.web, 5175 is London, 5180
  and 5181 are Conquest). `npm run preview` on 5186 serves the built files with the
  service worker, which is the only way to test offline.
- `npx vitest run` runs both test projects. `tsc -b` type-checks. `npm run build`
  makes `dist/`. `npx tauri build` makes the installer (phase 8).
- Stockfish is copied into `public/engine/` by `npm run engine` (gitignored).

## Architecture rules

- `src/engine`, `src/model` and `src/play` import no React and touch no browser
  global except the worker in `stockfish.ts`. `src/storage` is the only place that
  reads or writes storage or files. `src/ui` holds every component. Spec S13.
- Tauri and PWA APIs are imported lazily behind `isDesktop()`. Spec S14.
- One worker for the life of the app. Spec S5.
- Every evaluation and hint uses the analysis profile (level 8, 150 ms) and puts the
  playing profile back in a `finally`. Spec 6.3.
- The screen is built from the provider's state. Nothing on screen is patched by
  hand.

## Code quality (applies from the first line, never as a later pass)

- One implementation per algorithm. The shared homes are the copied ones and must
  stay single: `legalDests` and `sideToMove` (`position.ts`); `squaresForSan`,
  `sanForMove`, `isPromotion` (board moves to chess moves); `Movetext` and `pgnTag`
  (writing PGN); `parsePgn` (reading it); `outcomeOf` (every outcome sentence);
  `evalShare` and `evalText` (the bar); `levelName` (naming a level); the `read`,
  `write`, `readOneOf` and `useRemembered` helpers in `prefs.ts` (every setting).
  Never fork a second copy, and give any new repeated snippet a single home the
  moment it appears twice.
- Copied files are byte-identical to their origin plus one `Origin:` line; adapted
  files say what changed in that line. Spec S3.
- `main.tsx` stays free of test-harness code: the dev scenes live in `src/dev/`.
- Close every phase with a short reuse and duplication review of the new code, and
  refactor on the spot before the phase commit.
- Check every change a person can see in the pane inside the same phase, as the
  trainer's phases did, with the scenes and the layout probe of spec section 15. The
  bar, the board box and `cg-board` end on the same pixel, and the page never scrolls
  sideways.

## Conventions

- Spec section 3 words, exactly: the user, the engine, level, side, board size, the
  bar, evaluation, the analysis profile, move, game, outcome. One name for one thing.
  Never "trainee".
- No em dashes anywhere under `src/`. Docs use plain hyphens.
- Australian English on screen and in docs.
- `npx vitest run` green and `tsc -b` clean before every commit. No snapshots, no
  fake timers, no worker in the suite. Under twenty seconds.
- Commits: short imperative subject, a body that says why. End the message with
  `Co-Authored-By: <the model you are> <noreply@anthropic.com>`. PowerShell 5.1
  mangles some multi-line messages: write the message to a scratch file and use
  `git commit -F` when in doubt.
- Never change anything under `../London` or `../Conquest`. Read and copy only.
- Never push. Nick pushes.

## Standing hazards

- **The engine file is bigger than Workbox's default precache limit.** Without
  `maximumFileSizeToCacheInBytes` the app opens offline and the engine never answers.
  Spec S11.
- **The trainer's port is 5175 and its dev server may be running.** Confirm the
  served page shows this app's version before trusting any live check.
- **A hidden browser pane throttles React.** A move lands in the session at once and
  the screen catches up a second later. Poll for the DOM to change; do not read once
  and conclude. The trainer met this twice.
- **Chessground needs `ResizeObserver`**, which jsdom lacks. DOM tests mock the board
  with `src/test/board-stub.tsx`; `rig.dom.test.tsx` pins the throw.
- **Headless Edge is not a screenshot tool on this machine.** Started with a fresh
  scratch profile, and again with `--inprivate`, it signed into Nick's Windows account,
  began syncing, and loaded his extensions (phase 0 notes). Screenshots come from the
  pane, and from `packaged-eval.mjs --shot` against the Tauri window, which has its
  own profile.
- **The uninstall hook deletes a folder.** Its guard is copied from Tauri's own block
  and is not optional. `scripts/check-uninstall-hook.mjs` proves all four cases.
