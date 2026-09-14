# Chip: phase 16 - the window the layout actually needs

You are the builder session for Simply Chess, in `C:\Users\nick2\Code\SimpleChess`, on
`main`, no worktree, no remote (never push, never create one). Your context may have
been compacted: rely on nothing you remember about this code. Read, in this order,
before the first edit:

1. `CLAUDE.md` in this folder.
2. `docs/simple-chess-spec.md` **section 21**, which is this phase: 21.1 is the fault
   with its measurements, 21.2 is the rule (S23), 21.3 the tests. Then **section 20**
   (S21, the resize this corrects), **S2** (the fit rule) and **19.1** (the three
   columns).
3. `docs/simple-chess-build-plan.md`: "Rules for the builder", phase 16's boxes, and the
   gate 15 findings.
4. `src/ui/board-size.ts`, `src/ui/window-size.ts`, `src/ui/window-size.test.ts`,
   `src/ui/app.css` (the rule that makes `main` the scrolling element),
   `src/ui/play.css` (`.play-body`, `.play-side`).

## Why this phase exists

Nick, using 1.3.0:

> In both auto size cases the post game review drops to under the board, I really want
> it alongside the move list which is the natural place.

**This is a one-line fix and the diagnosis is already done. Do not re-derive it; verify
it.** Measured in the shipped 1.3.0 window at a display scale of 1.5, with a report
showing:

| Auto size | Width the columns get | Width they need | What happens |
|---|---|---|---|
| Small, 1024 by 808 | 961 | 975 | the side panel wraps under the board |
| Large, 1440 by 1224 | 1377 | 1391 | the same |

Both are 14 px short, and the 14 is a scrollbar. `innerSizeForBoard` asks for the
layout's EXACT minimum, so the layout fits its window by one pixel. **`main` is the
scrolling element above 900 by 700** (`app.css`), so its vertical scrollbar takes about
15 logical pixels out of the usable width **without changing
`document.documentElement.clientWidth`** - which is why `window.innerWidth -
document.documentElement.clientWidth` reads 0 while the page behaves as though a
scrollbar is there. That is the whole fault.

**Proved by giving it the room**: the same window and the same report at an inner width
of 1045 rather than 1024 puts the panel back beside the board at y 164, with `main` not
scrolling. The height was never short.

## Where things stand

1.3.0 is built, gated (`7cd0628`) and its installer made. 339 tests green.
`innerSizeForBoard` in `board-size.ts` answers `board + CHROME_BESIDE_WIDE` by
`board + CHROME_ABOVE + CHROME_BELOW`, and `windowForBoard` in `window-size.ts` clamps
that to the work area and the window's minimum. The small target is 1023 by 807 and the
large one on this machine 1439 by 1223.

## Settled decisions

- **The allowance is a width only.** The height keeps its exact figure: with the panel
  beside the board the page fits its window, and it was only the wrap that ever made it
  tall. Measured at 1045 by 808, which is the original height.
- **It goes in `innerSizeForBoard`, not in the chrome constants.**
  `CHROME_BESIDE_WIDE` describes what the layout truly needs, and the fit rule of S2 uses
  it to answer honestly about a window the user sized. A scrollbar allowance buried in it
  would take pixels off the board on every screen for a scrollbar that is only sometimes
  there. Nothing in `board-size.ts` but `innerSizeForBoard` changes.
- **At least a scrollbar at a display scale of 1**, which is the worst case in logical
  pixels: a scrollbar is a physical thing, so it costs 17 logical pixels at scale 1 and
  about 11 at 1.5. Measure it rather than trusting this sentence, and pick a round number
  at or above the worst case, with the measurement in the comment. 24 is a reasonable
  answer and so is 32; what is not reasonable is a number that only works at 1.5.
- **Name it for what it is.** A reader should not have to ask why a window is wider than
  the thing inside it. The comment carries 21.1's two rows of numbers.
- **Nothing else moves.** Not the layout, not the fit rule, not the chrome constants, not
  the resize logic, not the report.
- **No headless browser on this machine, ever.** Clear the pane's `localStorage` after
  any drive.

## The work

- [ ] 16.1 The allowance in `innerSizeForBoard`, with the reason and the numbers in its
      comment (S23).
- [ ] 16.2 Tests: **S15 item 26** in `window-size.test.ts`, plus every existing
      expectation the allowance moves - the small target's 1023, the large target's, and
      any clamp case that was written against them. Each changed number gets the reason
      in its comment, not just a new value.
- [ ] 16.3 **Driven in the packaged window at BOTH automatic sizes with a real reviewed
      game on screen.** The check is three numbers: the side panel's `y` equals the
      board's `y`, `main.scrollHeight` equals `main.clientHeight`, and `scrollWidth`
      equals `innerWidth`. Do it in both themes and record the numbers. A game seeded
      into the window's own storage is the quickest way to a report; remove it afterwards
      and leave the four settings keys alone.
- [ ] 16.4 Version 1.3.1 in the three files. Docs swept: `docs/acceptance.md` item 8,
      `CLAUDE.md`'s current state if it quotes the window sizes, the plan's phase 16
      notes and boxes. Reuse review, commit, then `export PATH="$HOME/.cargo/bin:$PATH"`
      and `npx tauri build`, with the installer's path and size in the notes.

## Decision rules

- **If the panel still wraps after the allowance**, measure `.play-body`'s width against
  the sum of the three columns' minimums and say both numbers in the notes. Do not widen
  the allowance until it happens to work: find what is taking the pixels.
- **If `main` scrolls at the new size**, the height is short after all, and that is worth
  stopping for: say so with the numbers rather than adding a height allowance to match.
- Anything a person would see or feel that section 21 does not settle: ask Nick.

## Out of scope

The layout, the fit rule, the chrome constants, the resize itself, and the case section
21 names as accepted: a window the USER drags to within a scrollbar's width of the
boundary still wraps, and that is the layout degrading as it is meant to.

## Acceptance

`npx vitest run` green under twenty seconds with nothing skipped; `tsc -b` clean;
`npx oxlint` silent; `npm run build` clean. In the packaged window, a reviewed game's
report sits beside the move list after both automatic resizes, in both themes, with
`main` not scrolling. 1.3.1 in the three files, the installer built and its size
recorded.

## Conventions

Commits on `main`, short imperative subject, a body that says why, ending with
`Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` (name the model you actually
are). Write the message to a scratch file and `git commit -F` it. Stage explicit paths,
never `git add -A`, never `git clean`. No em dashes under `src/`. Australian English.
Nick's own files are not listed or reported. Never push.
