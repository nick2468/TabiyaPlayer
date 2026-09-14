# Simply Chess

A no-frills chess game against the Stockfish engine. One screen: the name with the
board size and theme toggles at its right, the difficulty in a row under it, then the
opening line and the status, then the board with its evaluation bar and four rows of
buttons under it (this position, this game, the file, the next game), the move list in
its own column, and a side panel that is the report on the game you have just played.

It runs as an installed Windows app and as an iPad Home Screen app, from one code
base. The code comes from the Repertoire Trainer (`../London`) and Conquest
(`../Conquest`).

Read [docs/simple-chess-spec.md](docs/simple-chess-spec.md) first. It holds every
decision. [docs/simple-chess-build-plan.md](docs/simple-chess-build-plan.md) holds
the phases and their progress.

## Status

**Version 1.3.0 is built, and it is the whole of the specification** (sections 19 and
20 for this version, 18 for version 2, sections 1 to 17 for version 1). The game plays, saves
and loads, remembers itself, is a Home Screen app that works with no internet, and
installs on Windows. A game can be stopped and reviewed: the engine scans every
position of it and the report names each slip with the move it would have played
instead, and the move list becomes a viewer you can click and step through with the
arrow keys. Version 1.2.0 gave the report the side panel to itself and put every
button under the board, which is what the board gives up height for; 1.2.1 put the two
view toggles back in the header and paired New game with Play as and the stepping
arrows with Undo, Redo and Hint. In 1.3.0 the board size toggle takes the Windows
window with it, both ways: Large sets the window to the size the biggest board the
screen can show needs, and Small puts it back to 1023 by 807. The toggle used to look
dead in a window with no room in it, which is what Nick found.

Three things are left and all are Nick's, because they need his machine, his accounts
and his iPad: running the installer, publishing the site, and playing a move in
aeroplane mode. [docs/acceptance.md](docs/acceptance.md) walks the specification's
acceptance list item by item and says who checked what.

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
engine and all. Publishing it is Nick's job and needs his accounts or his wifi:
[docs/simple-chess-deploy.md](docs/simple-chess-deploy.md) writes up both routes,
Cloudflare Pages and Caddy on the LAN, and the choice between them is still open.

**On Windows, as an installed app.** The Rust toolchain has to be on the path first
(it lives in `%USERPROFILE%\.cargo\bin` and is not there by default), then:

```bash
npx tauri build
```

That writes `src-tauri/target/release/bundle/nsis/Simply Chess_1.2.1_x64-setup.exe`.
It installs for the current user, with no administrator prompt, into
`%LOCALAPPDATA%\Simply Chess`. It is unsigned, so SmartScreen warns the first time:
More info, then Run anyway. The window keeps its settings and the game in progress in
`%LOCALAPPDATA%\Simply Chess Data`, and the uninstaller removes that folder only if you
tick the box.

`npx tauri dev` runs the same window against the dev server, and
`node scripts/check-uninstall-hook.mjs` proves the uninstaller's four cases without
uninstalling anything.
