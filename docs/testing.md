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

**The board.** Chessground measures its host with a `ResizeObserver`, and jsdom has no
layout and no such global, so mounting the real board throws. `src/test/board-stub.tsx`
(phase 2) stands in: it renders the fen, the last move, and one button per legal move,
and calls the real `onMove` seam. `rig.dom.test.tsx` (phase 2) pins the throw that makes
the stub necessary, so if a later chessground or jsdom removes the need, that test goes
red and asks.

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
