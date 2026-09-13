# Simply Chess - putting it on the iPad

Origin: Conquest `docs/conquest-deploy.md`, adapted: this app's project, repository
and domain, an offline proof that plays a move against the engine, and an update
that costs nothing. Written 2026-09-12 for plan phase 7; the second route added
2026-09-13 for phase 12.

**Every step here needs Nick's GitHub account, Nick's Cloudflare account or Nick's
iPad. They are steps for a person, not for Claude.** What the build session could do
is already done and is listed under "What is already built" below.

---

## Two routes, and the choice is not made

The iPad needs the app over **HTTPS**, because a service worker only runs on a secure
page and without one the app never works offline. That is the only real requirement.
There are two ways to meet it and Nick has not chosen (spec Q22):

| | **Cloudflare Pages** | **Caddy on the LAN** |
|---|---|---|
| Who can reach it | Anyone with the address | Anyone on the home wifi |
| Needs internet to install | Yes | No |
| Needs a DNS record | Yes, one CNAME | No |
| Needs a certificate trusted on the iPad | No, Cloudflare provides one | Yes, once |
| Needs this machine running | No | Yes, to install and to update |
| Publishing a new version | `git push` | `npm run build`, and the files are served |

**The choice changes nothing in the code.** The app is the same `dist/` folder either
way, the same service worker, the same manifest and the same offline behaviour. Nothing
in the source reads a URL, so there is no build flag and no configuration to switch.

Sections 1 to 3 below are the Cloudflare route. Section 3a is the LAN route, and is an
alternative to sections 1 to 3 rather than an addition. Sections 4 onward are the same
whichever route is taken.

---

## It is live

**https://simplechess.datacrafter.net** - published ______ (fill in the date), by the
Cloudflare route.

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

*Cloudflare route.*

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

*Cloudflare route.*

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

*Cloudflare route.*

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

## 3a. Or: Caddy on the LAN, with no internet at all

*The LAN route. Instead of 1 to 3, not as well as.*

The app is a folder of static files. Anything that serves them over HTTPS will do, and
on the home wifi that means one small server here and one certificate trusted once on
the iPad. No GitHub, no Cloudflare, no DNS record and no public URL.

**Why a certificate at all.** Safari will not register a service worker on a page it
does not trust, and without the worker there is no Home Screen app and nothing works
offline. A LAN address has no public certificate authority behind it, so the trust has
to be put on the iPad by hand. It is one file and one visit to Settings, and it lasts
until it expires.

1. **Build the app.**

```bash
npm run build
```

That writes `dist/`, which is the whole site.

2. **Make a certificate for this machine's LAN name**, once, with
   [mkcert](https://github.com/FiloSottile/mkcert). `mkcert -install` creates a private
   root certificate authority on this machine and trusts it here; the second command
   issues a certificate for the addresses the iPad will use.

```bash
mkcert -install
```

```bash
mkcert simplychess.local 192.168.1.10
```

Use this machine's own LAN address in place of `192.168.1.10`. `ipconfig` gives it.

3. **Trust the root certificate on the iPad**, once. `mkcert -CAROOT` prints the folder
   holding `rootCA.pem`. Send that one file to the iPad (AirDrop, or email it to
   yourself), open it, then:
   - **Settings, General, VPN & Device Management**, and install the profile.
   - **Settings, General, About, Certificate Trust Settings**, and turn full trust on
     for it.

   Both steps are needed. Installing the profile without the second step leaves Safari
   refusing the page, which looks like the server being wrong.

4. **Serve `dist/` with Caddy.** A `Caddyfile` beside the project:

```
simplychess.local, 192.168.1.10 {
  tls cert.pem key.pem
  root * ./dist
  file_server
  try_files {path} /index.html
}
```

```bash
caddy run
```

`try_files` matters: the app is a single page, so any path that is not a file has to
return `index.html`.

5. **Let it through the firewall.** Windows will ask the first time Caddy listens.
   Allow it on **private** networks only, not public.

6. **Open it on the iPad** at `https://192.168.1.10` (or `https://simplychess.local` if
   the network resolves that name), and carry on at step 4 below.

**Publishing a new version** is `npm run build` and nothing else: Caddy serves whatever
is in `dist/`. The iPad picks it up the next time it is opened with the wifi on, through
the same update bar described below.

**The trade.** The app installs and updates only on the home wifi, and this machine has
to be running for both. Once installed it works anywhere, because the service worker has
stored it, which is the whole point. It is the better route if the app is never meant to
be on the public internet, and the worse one if the iPad leaves the house before it has
been installed.

---

## 4. Add it to the iPad Home Screen

*Either route. The address is the only difference.*

1. Open the site in **Safari**: `https://simplechess.datacrafter.net` by the Cloudflare
   route, or the LAN address by the other. It must be Safari.
   Chrome on iPadOS cannot add a Home Screen app.
2. Press the Share button.
3. Choose **Add to Home Screen**.
4. The name will already read Simply Chess. Press **Add**.

The icon is a white knight on the dark ground. Opening it runs the game full screen,
with no address bar and no browser buttons.

---

## 5. Check it really works with no internet

*Either route.*

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
