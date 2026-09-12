import { forgetGame, rememberGame } from '../storage/current-game'
import { DEFAULT_LEVEL, rememberBoardSize, rememberSide } from '../storage/prefs'
import { rememberTheme } from '../ui/theme'
import { SCENES, type SceneRequest } from './scenes'

/**
 * Puts a scene in storage, and nothing else (spec 15.1).
 *
 * That is the whole trick. The app already reopens on the game it was closed
 * on, at the settings it was closed with (spec 10), so a scene has nothing to
 * do but write the game and the settings and let the ordinary start path find
 * them. No second way into the provider, no dev-only branch in `Shell` deciding
 * where a game comes from, and the path a scene exercises is the path a person
 * uses.
 *
 * The level is the default rather than the scene's own choice: a scene shows
 * the app as it comes, and the sidebar's level is one of the things being
 * looked at.
 *
 * Idempotent, deliberately. StrictMode runs the state initializer that calls
 * this twice in development, and writing the same three keys and the same game
 * twice is the same as writing them once, so there is nothing to guard against.
 */
export function applyScene(request: SceneRequest): void {
  if (request.theme) rememberTheme(request.theme)
  if (request.side) rememberSide(request.side)
  if (request.size) rememberBoardSize(request.size)

  const scene = SCENES[request.scene]
  if (scene.sans.length === 0) {
    // A scene with no moves is a fresh install: the remembered game has to go,
    // or the app would reopen on whatever the last drive left behind.
    forgetGame()
    return
  }
  rememberGame({
    version: 1,
    sans: scene.sans,
    side: request.side ?? 'white',
    level: DEFAULT_LEVEL,
  })
}
