import { useState } from 'react'
import { applyScene } from './apply-scene'
import { SCENES, sceneFromLocation } from './scenes'

/**
 * What the screen needs to know about a scene, which is one thing.
 *
 * Everything else a scene says is already in storage by the time this is
 * returned, and the screen reads storage the way it always does. Handing
 * `src/ui` the whole request instead would invite it to ask `SCENES` a question,
 * and one live reference to that table from a module the app always imports
 * would put the scenes' moves in the shipped bundle.
 */
export interface DevScene {
  /** Whether the scene wants a hint already showing (spec section 8). */
  hint: boolean
}

/**
 * The scene the address bar asked for, in a development build (spec 15.1).
 *
 * Called as the FIRST hook in `Shell`, because the order matters: a state
 * initializer runs during the render it belongs to, so the scene's settings and
 * game are in storage before the hooks under it read storage, and before the
 * mount effect goes looking for a game to reopen. Nothing about it is visible
 * lower down; the screen is built from the settings and the game like any other.
 *
 * `import.meta.env.DEV` is a literal at build time, so `npm run build` leaves
 * this function with one `return null` in it and drops `scenes.ts` and
 * `apply-scene.ts` from the bundle altogether. The phase 6 notes record the
 * grep that proves it.
 *
 * The one thing a scene cannot carry in storage is the hint, which is a
 * question asked of the engine rather than a fact about the game. `Shell` asks
 * it, once, using the `hint` flag on what comes back from here.
 */
export function useDevScene(): DevScene | null {
  // StrictMode runs this twice in development. `applyScene` is idempotent, so
  // the second run writes what the first one wrote.
  const [scene] = useState<DevScene | null>(() => {
    if (!import.meta.env.DEV) return null
    const asked = sceneFromLocation(window.location.search)
    if (!asked) return null
    applyScene(asked)
    return { hint: SCENES[asked.scene].hint }
  })
  return scene
}
