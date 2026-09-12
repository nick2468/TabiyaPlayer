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

Phases 0 to 7 built. The game plays, saves and loads, remembers itself, and is a
Home Screen app that works with no internet. The Windows installer is phase 8.

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

**On Windows, as an installed app.** Arrives with phase 8.
