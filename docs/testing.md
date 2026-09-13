# How this app is tested

Origin: London `docs/testing.md`, adapted: the content checkers are gone, the trainer's
history is shortened, and each helper names the phase that brings it.

Two kinds of test, one command. `npx vitest run` runs everything.

## The two kinds of test

**String tests** (`src/**/*.test.ts`) run in node. They call a function, or render a
component to a string with `renderToStaticMarkup`, and read the result. They are the
bulk of the suite and they are fast because they are cheap: no browser, no layout, no
effects.

That last one is the limit. Rendering to a string mounts nothing, so no `useEffect`
ever runs. A component that loads something on mount is always caught in its empty
starting state, and anything reached by clicking is not reached at all.

**DOM tests** (`src/**/*.dom.test.tsx`) run in jsdom, a JavaScript implementation of a
browser's document. They render the real app with
[testing-library](https://testing-library.com), click its buttons with `user-event`, and
read the screen and what was stored afterwards. Effects run. State changes. A test can
start a game, play a move, press Undo and look.

The two are separate vitest **projects**, declared in `vite.config.ts`. That is what
lets the node tests stay in node: a single config with a jsdom environment would make
every pure test pay for a document it never touches.

## Why the DOM kind exists

The trainer built it at its phase 29, after the same class of bug shipped there three
times. Each was in the provider that runs a game, which no string test could reach:

- **Phase 23.** The provider's value was memoised and the session's change counter was
  not in the dependencies. React skips a provider's children unless the value changes,
  so Undo moved the game and left the screen showing the position before it.
- **Phase 25.** `finish` minted a fresh timestamp on every review, and the timestamp is
  what says two reviews are one game. A game reviewed twice appeared twice on Progress.
- **Phase 27.** Replay both minted an identity and wrote its scan back, so reading a
  game left a second record and drifted its recorded ending.

Every one of those passed the whole suite and was found by a person pressing a button.
This app copies the provider, so it copies the rig with it, from the first phase.

## What is faked, and why

**The engine.** The game's provider (`PlayProvider` in `src/ui/play-context.tsx`, from
phase 2) takes an optional `createEngine`, defaulting to the real Stockfish one. Tests
pass `fakeEngine` from `src/test/fake-engine.ts` (phase 1), which plays the first legal
move and returns a fixed evaluation. A real engine in the suite would mean a worker per
test and a bar that depends on a WASM build being present. From phase 2 one DOM test
puts a recording stub on `globalThis.Worker` and asserts nothing was ever constructed,
so this cannot rot quietly.

Three fakes are built on `engineByProfile` (`src/test/by-profile.ts`), which tells the
engine's MOVE from the app's ANALYSIS by the profile set before each search, exactly as
the real engine sees it. `scriptedEngine` plays a written-out game; `heldEngine` stops
on a move until the test lets it go, so the screen can be looked at while the engine
thinks; and `scoredEngine` (phase 10) answers a different number per POSITION, in pawns
from White's point of view. That last one exists because a slip is a CHANGE of
evaluation across one move, and against a fake that says the same number everywhere no
scan can ever produce one.

**The board.** Chessground measures its host with a `ResizeObserver`, and jsdom has no
layout and no such global, so mounting the real board throws. `src/test/board-stub.tsx`
(phase 2) stands in: it renders the fen, the last move, and one button per legal move,
and calls the real `onMove` seam. `rig.dom.test.tsx` (phase 2) pins the throw that makes
the stub necessary, so if a later chessground or jsdom removes the need, that test goes
red and asks.

**The PWA plugin's virtual module.** `virtual:pwa-register/react` (phase 7) is not a
file: the plugin invents it while Vite builds, and vitest's runner cannot load an id
that is not a path. `src/test/pwa-register.ts` stands in, aliased by the dom project,
and says no new version is waiting. See the offline section at the end.

Nothing else is faked. The providers, the storage and the screen are the code that
ships.

## The rules this suite keeps

- **No snapshots.** A snapshot records what the code did, not what it should do, and it
  is updated by pressing a key.
- **No fake timers.** Waiting is done with `vi.waitFor`, on the thing being waited for.
- **No worker, ever**, per the guard above.
- **Under twenty seconds.** The whole suite, both projects, on this machine. The rule
  exists for one reason: a bar nobody waits for is a bar nobody runs, so the suite has to
  stay fast enough that a builder runs it after every change. The trainer's limit was
  ten until Nick raised it to twenty there (2026-09-05), when 1003 tests took 9.5
  seconds and the next DOM file would have crossed it: a rule that blocks a better app
  is the wrong rule. The number is a ceiling, not a target.
- **A regression test is shown red first.** Write it against the commit before the fix,
  or put the bug back and watch it fail. A test that has never failed proves nothing.

## Writing one

`src/test/dom.tsx` has the helpers. Today that is `renderApp`, which renders the app and
returns a `user-event` user. From phase 2 it puts the real providers around the screen
with the fake engine, and `board` and `movesOnScreen` join it to do the reading a test
would otherwise repeat.

Two things to know. From phase 2, mock the board at the top of every DOM test file that
shows it (`vi.mock('./Board', async () => await import('../test/board-stub'))`). And
`src/test/dom-setup.ts` empties `localStorage` after every test, so each test starts
from a fresh install unless it writes storage before `renderApp`.

## The layout probe and the scenes

Some things no test can answer. jsdom has no layout, so every rectangle in a DOM test
is zero: a board with its top rank scrolled off the screen passes the whole suite.
Those are looked at instead, in the browser pane, and measured (spec section 15).

**A scene** puts the app in a state worth looking at, from the address bar:

```
http://localhost:5185/?scene=midgame&size=large&theme=light&side=black
```

The five are `fresh`, `midgame` (twenty moves), `mate` (a finished game, so the
outcome shows), `promotion` (a pawn one step from the last rank) and `hint`
(`midgame` with a hint already asked). `size`, `theme` and `side` are optional and
override what is remembered for that load. They live in `src/dev/scenes.ts` and work
by writing storage, so a scene arrives through the same path a reopened game does.

Development builds only. The check is `import.meta.env.DEV`, which is a literal at
build time, so `npm run build` drops every scene: `grep -c midgame dist/assets/*.js`
is 0, and a phase that touches this says so in its notes.

**The probe** is `scripts/probes/layout.js`, one expression returning the boxes of
`.board`, `cg-board`, `.live-eval`, `.play-controls`, `.play-head`,
`.course-switch`, `.play-side` and `.move-list` beside `scrollWidth`, `innerWidth`
and the display scale. From phase 13 it also returns `rows`, one entry per row of
buttons under the board with its width, height, bottom and text: there are four of
them (spec S19), none may be wider than the board, and the last one's bottom plus the
page's padding is what `CHROME_BELOW` has to cover. Evaluate it in the pane by
fetching it from the dev server, so the file is what runs rather than a copy of it:

```js
eval(await (await fetch('/scripts/probes/layout.js')).text())
```

Two more things live only here. **Whether the move list scrolls ITSELF** to keep the
marked move in view (spec 18.4) is a question about layout, and every rectangle in jsdom
is zero, so `scrollToShow` always answers 0 there: it is measured in the pane by
comparing the list's `scrollTop` against the board's `y` before and after a jump. And
**whether an arrow is drawn** cannot be read from the SVG in a hidden pane at all,
because chessground redraws behind `requestAnimationFrame`; read `window.__cg.state`
or look at a screenshot (CLAUDE.md, standing hazards).

Two numbers have to hold at every viewport, both board sizes and both themes (S16):
the bar, `.board` and `cg-board` end on the same pixel, and `scrollWidth` never
exceeds `innerWidth`. Every UI-affecting phase records the table in its notes.

In phase 8 the same file is read a second way, against the built Windows app, through
`node scripts/packaged-eval.mjs @scripts/probes/layout.js`.

## The two things only the packaged app can answer

**Whether the shipped window is the app.** `npx tauri build` makes a window whose
contents are a production bundle, and a production bundle ignores synthetic events on
the board on purpose, so nothing in a test can play a move in it. It can still be read.
Start the built executable with WebView2's debugging port on:

```bash
WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333" ./src-tauri/target/release/simply-chess.exe &
```

Then `node scripts/packaged-eval.mjs "<expression>"` evaluates anything in that window,
`@file` reads the expression from a file (which is how the layout probe runs there), and
`--shot window.png` writes a picture of it. That picture is the one screenshot file this
project makes, because the window has its own browser profile and the pane cannot reach
it. Clicking a button works; making a move does not, and that move is the one step in
the acceptance walk that belongs to a person.

**Whether the uninstaller deletes the right folder.** `node
scripts/check-uninstall-hook.mjs` compiles the shipped NSIS macro with the folder name
pointed at a scratch folder and runs it four times, once for each combination of "the
user ticked the box" and "this is an upgrade". Only the first combination may remove the
folder. The script needs `makensis`, which a Tauri build downloads to
`%LOCALAPPDATA%\tauri\NSIS`. It is a mutation test by nature: take the `$UpdateMode <> 1`
half of the guard out and the second case fails, which is a version bump deleting the
user's game.

## The offline proof and the update bar

Two more things no test can answer, both from phase 7.

**Whether the app works with no internet** is a question about a service worker, and
a development build has none by choice (`devOptions: { enabled: false }`). So it is
proved against the built files: `npm run build`, then the `simply-chess-preview`
launch configuration on port 5186, open it and **play one move** (that visit is what
lets the worker store everything), then stop the server and reload.

The move is the point. The page opening again proves the HTML and the bundle were
stored; only a move proves the engine was, and the engine is a 7 MB WASM file that
Workbox will silently leave out unless told otherwise (spec S11). An app that opens
offline and then never answers is the failure that looks most like a broken app.
`navigator.serviceWorker.getRegistrations()` in the pane says whether a worker is
registered, and a `fetch` of something that was never stored should be refused,
which is what says the server really is down.

Unregister the worker and clear the caches afterwards, or the next session's build
is served from that one.

**The update bar** (spec 12.1) cannot wait for a real new version either. A
development build answers `?pretendUpdate` by showing the bar as though one were
waiting, which is Conquest's trick and is `import.meta.env.DEV` gated like the
scenes. In the suite, `virtual:pwa-register/react` is faked twice over: the dom
project aliases it to `src/test/pwa-register.ts` so that every DOM test can mount the
app at all, and `update.dom.test.tsx` mocks the same id again to say a version is
waiting.
