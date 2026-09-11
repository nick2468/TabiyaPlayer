/**
 * Origin: London src/model/types.ts, adapted: cut to the four the board and the bar use.
 * The shared types. Nothing here imports React: the board, the bar and the
 * session all consume them.
 */

/** Colours, in the wording chessground uses. */
export type Colour = 'white' | 'black'

/** Arrow and circle colours chessground ships with. */
export type Brush = 'green' | 'red' | 'blue' | 'yellow'

/** A board highlight: a circle when `dest` is absent, else an arrow. */
export interface Shape {
  orig: string
  dest?: string
  brush: Brush
}

/** "White" or "Black", for error messages and prose. */
export function colourName(colour: Colour): string {
  return colour === 'white' ? 'White' : 'Black'
}
