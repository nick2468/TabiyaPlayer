/**
 * The PWA plugin's virtual module, faked, for the DOM tests.
 *
 * `virtual:pwa-register/react` does not exist as a file. The plugin invents it
 * while Vite builds, and vitest's runner cannot load an id that is not a path:
 * every DOM test that mounts the app fails at import with "The argument
 * 'filename' must be a file URL object, file URL string, or absolute path
 * string".
 *
 * So the dom project aliases that id to this, beside the fake engine and the
 * board stub and for the same reason: the thing being stood in for is the
 * browser's, not the app's. A test never installs a service worker, so
 * `needRefresh` is false and the update bar stays away, which is the state
 * every test but `update.dom.test.tsx` wants. That one mocks this same id
 * again to say a version is waiting.
 */

export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as [boolean, (value: boolean) => void],
    offlineReady: [false, () => {}] as [boolean, (value: boolean) => void],
    updateServiceWorker: async (_reload?: boolean) => {},
  }
}
