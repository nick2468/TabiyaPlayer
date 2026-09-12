import type { DetailedHTMLProps, HTMLAttributes } from 'react'

/**
 * Chessground's `<piece>` element, for TypeScript.
 *
 * The board's stylesheet draws every piece through selectors of the form
 * `.cg-wrap piece.queen.white`, so a component that wants a board piece outside
 * the board has to render that element rather than a div with the same classes.
 * The promotion picker is the one place that does (spec 5.3).
 *
 * Chessground makes these elements itself, in its own DOM, so it never needed a
 * JSX type for them and does not ship one.
 */
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      piece: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
    }
  }
}
