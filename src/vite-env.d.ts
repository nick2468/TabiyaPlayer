/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

/**
 * Origin: Conquest src/vite-env.d.ts, adapted: the two references only, because this app bakes in no settings of its own.
 * The types Vite and its PWA plugin bring with them.
 *
 * The first line is already covered by `types: ["vite/client"]` in
 * `tsconfig.app.json`, and it stays because it says at the top of the file
 * what the file is for, and because the second line is not covered by
 * anything: `virtual:pwa-register/react` is a module the plugin invents at
 * build time, and `useUpdate` imports it. Without this reference `tsc -b`
 * cannot find it.
 */
