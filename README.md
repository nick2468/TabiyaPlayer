# Simple Chess

A no-frills chess game against the Stockfish engine. One screen: the board, an
evaluation bar, four buttons, and a sidebar with the difficulty, the colour you play,
the board size, and Save and Load.

It runs as an installed Windows app and as an iPad Home Screen app, from one code
base. The code comes from the Repertoire Trainer (`../London`) and Conquest
(`../Conquest`).

Read [docs/simple-chess-spec.md](docs/simple-chess-spec.md) first. It holds every
decision. [docs/simple-chess-build-plan.md](docs/simple-chess-build-plan.md) holds
the phases and their progress.

## Status

Built, all eight phases. The game plays, saves and loads, remembers itself, is a Home
Screen app that works with no internet, and installs on Windows as version 1.0.0.
[docs/acceptance.md](docs/acceptance.md) walks the specification's acceptance list item
by item and says who checked what.

## Running it

**In a browser, while working on it.** Node 22.12.0 and npm:

```bash
npm install
```

```bash
npm run dev
```

That serves it on http://localhost:5185. `npm run dev` copies Stockfish into
`public/engine/` first, which is why the first run takes a moment. There is no
service worker in a development build, so to try the app offline build it and serve
the built files:

```bash
npm run build
```

```bash
npm run preview
```

That serves http://localhost:5186 with the service worker, which is the only way to
see what the iPad sees.

**On an iPad, as a Home Screen app.** Open the published site in Safari, press Share,
then Add to Home Screen. Once it has been opened once it works in aeroplane mode,
engine and all. Publishing it is Nick's job and needs his accounts:
[docs/simple-chess-deploy.md](docs/simple-chess-deploy.md) has every step.

**On Windows, as an installed app.** The Rust toolchain has to be on the path first
(it lives in `%USERPROFILE%\.cargo\bin` and is not there by default), then:

```bash
npx tauri build
```

That writes `src-tauri/target/release/bundle/nsis/Simple Chess_1.0.0_x64-setup.exe`.
It installs for the current user, with no administrator prompt, into
`%LOCALAPPDATA%\Simple Chess`. It is unsigned, so SmartScreen warns the first time:
More info, then Run anyway. The window keeps its settings and the game in progress in
`%LOCALAPPDATA%\Simple Chess Data`, and the uninstaller removes that folder only if you
tick the box.

`npx tauri dev` runs the same window against the dev server, and
`node scripts/check-uninstall-hook.mjs` proves the uninstaller's four cases without
uninstalling anything.
