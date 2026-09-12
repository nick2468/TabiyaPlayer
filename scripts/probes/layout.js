/**
 * The layout probe (spec 15.3).
 *
 * One expression, so it can be evaluated anywhere a page can be reached: in the
 * browser pane through the JavaScript tool while a phase is being built, and
 * against the installed Windows app through
 *
 *   node scripts/packaged-eval.mjs @scripts/probes/layout.js
 *
 * with the window started under
 * WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9333" (phase 8).
 *
 * The two numbers S16 wants from it:
 *
 * 1. `bar.bottom`, `board.bottom` and `cg.bottom` are the same pixel. The bar is
 *    stretched to the board's box, and chessground floors each square to whole
 *    device pixels, so a board size that does not divide evenly draws short
 *    inside its own box and the bar hangs below it.
 * 2. `scrollWidth` never exceeds `innerWidth`. A page that scrolls sideways is a
 *    regression whatever else went right.
 *
 * `null` for anything not on the page, which is an answer rather than a failure:
 * the picker and the hint sentence are only there sometimes.
 */
;(() => {
  const box = (selector) => {
    const node = document.querySelector(selector)
    if (!node) return null
    const rect = node.getBoundingClientRect()
    const round = (value) => Math.round(value * 100) / 100
    return {
      x: round(rect.x),
      y: round(rect.y),
      width: round(rect.width),
      height: round(rect.height),
      bottom: round(rect.bottom),
    }
  }
  return {
    board: box('.board'),
    cg: box('cg-board'),
    bar: box('.live-eval'),
    controls: box('.play-controls'),
    sidebar: box('.sidebar'),
    list: box('.move-list'),
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    devicePixelRatio: window.devicePixelRatio,
  }
})()
