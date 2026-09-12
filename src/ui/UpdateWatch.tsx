import { UpdateBanner } from './UpdateBanner'
import { useUpdate } from './useUpdate'

/**
 * The update bar, when there is one to show.
 *
 * This exists because of a rule of hooks and a rule of this app. `useUpdate`
 * registers the service worker, and the worker is never registered inside the
 * Tauri window (spec S12): a WebView2 app updates by installer, and a worker
 * holding an old bundle inside it would make that untrue. But a hook cannot be
 * called behind a condition, so `Shell` cannot ask `isDesktop()` and then call
 * it. A component can be rendered behind one, and that is this component: it
 * is only ever mounted off the desktop, so the hook inside it is called every
 * render or never at all.
 */
export function UpdateWatch() {
  const { waiting, take, later } = useUpdate()

  if (!waiting) return null

  return <UpdateBanner onUpdate={take} onLater={later} />
}
