import type { Colour } from '../model/types'
import { BOARD_SIZES, SIDES, oneOf, type BoardSizeName } from '../storage/prefs'
import { THEMES, type Theme } from '../ui/theme'

/**
 * The screens a person can see, set up from the address bar (spec 15.1).
 *
 * A UI-affecting phase is checked by looking at it, and half the work of
 * looking is getting the app into the state worth looking at. Playing twenty
 * moves by hand to photograph a full move list is work nobody repeats, so the
 * five states the spec names are written down here instead:
 *
 *   http://localhost:5185/?scene=midgame&size=large&theme=light&side=black
 *
 * Development builds only. `useDevScene` asks for this behind
 * `import.meta.env.DEV`, which is a literal at build time, so the production
 * bundle carries neither the hook's body nor any of the text below.
 *
 * This file is pure: it names the moves and reads a query string, and it
 * touches no storage and no window. `apply-scene.ts` does the writing.
 */

export type SceneName = 'fresh' | 'midgame' | 'mate' | 'promotion' | 'hint'

export interface Scene {
  readonly sans: readonly string[]
  /** Whether a hint has already been asked for (spec section 8). */
  readonly hint: boolean
}

/**
 * Twenty moves of a Ruy Lopez, closed, checked against chess.js by the test
 * beside this file. Forty plies, so it is White to move at the end and a user
 * playing White is looked at, not waited for.
 *
 * A real opening rather than a made-up one, because a move list full of
 * nonsense is hard to read past when the thing being looked at is the list.
 */
const MIDGAME = [
  'e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6',
  'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O',
  'h3', 'Nb8', 'd4', 'Nbd7', 'Nbd2', 'Bb7', 'Bc2', 'Re8',
  'Nf1', 'Bf8', 'Ng3', 'g6', 'a4', 'c5', 'd5', 'c4',
  'Bg5', 'h6', 'Be3', 'Nc5', 'Qd2', 'h5', 'Bg5', 'Be7',
] as const

export const SCENES: Record<SceneName, Scene> = {
  /** The start position, and nothing remembered. */
  fresh: { sans: [], hint: false },
  midgame: { sans: MIDGAME, hint: false },
  /** Scholar's mate, so a user playing White has won and the outcome shows. */
  mate: { sans: ['e4', 'e5', 'Qh5', 'Nc6', 'Bc4', 'Nf6', 'Qxf7#'], hint: false },
  /** A pawn one step from the last rank, so the picker can be opened. */
  promotion: { sans: ['a4', 'b5', 'axb5', 'a6', 'bxa6', 'Nc6', 'a7', 'Nb8'], hint: false },
  hint: { sans: MIDGAME, hint: true },
}

/** A scene, with any of the three settings the address asked to override. */
export interface SceneRequest {
  scene: SceneName
  size?: BoardSizeName
  theme?: Theme
  side?: Colour
}

/**
 * What the address bar is asking for, or null when it asks for nothing.
 *
 * Anything unrecognised is ignored rather than complained about: this is a
 * developer's tool, and a mistyped size should show the app at the remembered
 * size rather than an error where the board goes.
 */
export function sceneFromLocation(search: string): SceneRequest | null {
  const asked = new URLSearchParams(search)
  const scene = oneOf(asked.get('scene'), Object.keys(SCENES) as SceneName[])
  if (!scene) return null
  return {
    scene,
    size: oneOf(asked.get('size'), BOARD_SIZES),
    theme: oneOf(asked.get('theme'), THEMES),
    side: oneOf(asked.get('side'), SIDES),
  }
}
