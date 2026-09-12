# Simply Chess - putting it on the iPad

Origin: Conquest `docs/conquest-deploy.md`, adapted: this app's project, repository
and domain, an offline proof that plays a move against the engine, and an update
that costs nothing. Written 2026-09-12 for plan phase 7.

**Every step here needs Nick's GitHub account, Nick's Cloudflare account or Nick's
iPad. They are steps for a person, not for Claude.** What the build session could do
is already done and is listed under "What is already built" below.

---

## It is live

**https://simplechess.datacrafter.net** - published ______ (fill in the date).

| Thing | Value |
|---|---|
| Cloudflare project | `simplechess` |
| Built from | `nick2468/SimpleChess`, branch `main` |
| Cloudflare's own URL | `simplechess-___.pages.dev` (Cloudflare picks the middle) |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 22.12.0, from `.node-version` and a `NODE_VERSION` variable |

**Every push to `main` rebuilds and republishes.** Nothing else to run.

### What changed in DNS

One record. Nothing edited, nothing removed.

| Type | Name | Content |
|---|---|---|
| CNAME | simplechess | `simplechess-___.pages.dev` |

Check the other records still answer afterwards, as Conquest's setup did.

---

## What is already built

| Built | Where |
|---|---|
| The app icon, at four sizes | `public/icon.svg`, `public/icon-*.png`, `public/apple-touch-icon.png`, `public/favicon-32.png` |
| The manifest | Written at build time by `vite-plugin-pwa` into `dist/manifest.webmanifest` |
| The service worker | `dist/sw.js`, written at build time |

The icon is one drawing, `public/icon.svg`, and `npm run icons` renders it at the four
sizes. Run that after changing the drawing; the output is committed.

**Proven offline on 2026-09-12, on this machine.** The built site was served on port
5186, opened once, and a move was played. The server was then stopped and the page
reloaded. It opened on the game it was closed on, and the engine answered a second
move, with a request for anything not stored refused. The engine's own files came
from the service worker's cache.

That last part is the one that can silently fail: the engine is a 7 MB WASM file and
Workbox refuses anything over 2 MiB unless told otherwise (spec S11). The app would
still open offline without it, and every move would hang. So the proof plays a move
rather than checking that the page appears.

---

## 1. Put the repository on GitHub

Cloudflare Pages builds from a Git repository, so it needs one it can read.

```bash
gh repo create SimpleChess --private --source . --remote origin --push
```

Or make an empty repository on github.com and then:

```bash
git remote add origin https://github.com/nick2468/SimpleChess.git
```

```bash
git push -u origin main
```

Private is fine. Cloudflare can read a private repository once you grant it.

---

## 2. Make the Cloudflare Pages project

1. Open the Cloudflare dashboard, then **Workers & Pages**, then **Create**, then
   **Pages**, then **Connect to Git**.
2. Pick the SimpleChess repository.
3. Set the build settings:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | leave blank |

4. Press **Save and Deploy**.

**The Node version matters.** Cloudflare's default is older than Vite 8 accepts, and
the build fails with a version error. The repository holds a `.node-version` file
saying `22.12.0`. Set a `NODE_VERSION` build variable to the same value as well, as
Conquest's project does. The build log says which version it installed.

`npm run build` runs `npm run engine` first, which copies Stockfish out of the
`stockfish` package into `public/engine/`. That folder is gitignored on purpose, so
the engine is not in the repository and Cloudflare makes it during the build. If a
build ever produces a site whose engine never answers, this is the first thing to
look at in the log.

The first build takes a couple of minutes. It ends with a URL like
`simplechess-abc.pages.dev`. Open it and play a move.

---

## 3. Point simplechess.datacrafter.net at it

1. In the Pages project, open **Custom domains**, then **Set up a custom domain**.
2. Enter `simplechess.datacrafter.net`.
3. Cloudflare already runs DNS for `datacrafter.net`, so it offers to add the record
   itself. Accept.

**One thing that looks wrong but is not.** While the domain says "Verifying",
Cloudflare shows a panel headed "Complete DNS setup", telling you to add the CNAME by
hand at your DNS provider. Ignore it. That text appears for everyone, including
people whose DNS Cloudflare already runs. The record has already been created. Check
the DNS records list before adding anything, or you will end up with two.

The certificate takes a few minutes. **HTTPS is not optional here**: a service worker
only runs on a secure page, and without one the app never works offline. Cloudflare
provides the certificate, so there is nothing to do but wait.

`localhost` is the one exception to that rule, which is why the offline proof worked
on this machine with no certificate.

---

## 4. Add it to the iPad Home Screen

1. Open `https://simplechess.datacrafter.net` in **Safari**. It must be Safari.
   Chrome on iPadOS cannot add a Home Screen app.
2. Press the Share button.
3. Choose **Add to Home Screen**.
4. The name will already read Simply Chess. Press **Add**.

The icon is a white knight on the dark ground. Opening it runs the game full screen,
with no address bar and no browser buttons.

---

## 5. Check it really works with no internet

This is plan box 7.8, and it is the one that finishes phase 7.

1. Open Simply Chess from the Home Screen once, with Wi-Fi on, and play one move.
   This is the visit that lets the service worker store the app and the engine.
2. Turn on **Aeroplane Mode**.
3. Close Simply Chess completely. Swipe up and flick the app away.
4. Open it again from the Home Screen.

It should open on the game you left, **and the engine should answer a move.** Play
one and wait for the reply. The board appearing is not the test: the engine is the
part that can fail silently offline.

If the board appears and the engine never answers, say so rather than working around
it: it means the engine did not reach the cache, and the fix is in `vite.config.ts`,
not on the iPad.

---

## Getting a new version onto the iPad

The service worker is set to **wait**, not to update on its own. See the comment in
`vite.config.ts`.

Waiting costs nothing here. The game in progress and every setting are in storage
(spec section 10) and the app reopens on them, so loading a new version loses no
game. It is still an offer rather than an automatic reload, because a page that
reloads itself in the middle of a move is a surprise.

So when a new version is waiting, the app says so in a bar across the bottom:

> **A new version is ready**
> Your game and settings are remembered, so loading it loses nothing.
> [Not now] [Load it]

**Load it** takes the new version and reloads. **Not now** puts the bar away until
the next time the app is opened.

The bar appears the visit AFTER a push has been published, because that is when the
worker finds the new files. To go looking for one: close Simply Chess completely,
swipe up and flick it away, then open it again.

If a version is stubborn, open the site in Safari, then Settings, Safari, Advanced,
Website Data, and remove `simplechess.datacrafter.net`. That clears the stored copy
and the next visit fetches everything fresh.

---

## If something goes wrong

**The build fails on Cloudflare with a Node error.** See the Node version note in
step 2.

**The app loads but the engine never answers, offline.** The engine did not get into
the precache. In a build here, `dist/sw.js` should name both
`engine/stockfish-18-lite-single.wasm` and `engine/stockfish-18-lite-single.js`. If
it does not, `maximumFileSizeToCacheInBytes` in `vite.config.ts` is the reason (spec
S11).

**It never works offline at all.** Check the page is on `https`, and that a service
worker registered: the quickest test is step 5 above.

**The Home Screen icon is a screenshot of the page rather than the knight.** Safari
did not find `apple-touch-icon.png`. Check it is in `dist` after a build.

**An old version keeps coming back.** See "Getting a new version onto the iPad".
