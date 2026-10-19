import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

// Origin: London vite.config.ts, adapted: the port is 5185, the comments describe this app, and the PWA plugin is Conquest's vite.config.ts with this app's manifest and the engine in the precache.
// The version the app shows comes from package.json, read here at BUILD time
// and substituted into the bundle. Not from a Tauri call: the browser build has
// no Tauri, and a number the app has to ask for at runtime is a number that can
// be missing on the one screen that shows it.
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    // What turns the page into something you add to the Home Screen. It
    // writes the manifest and a service worker that stores the whole app, so
    // it opens with no internet at all (spec 12.1).
    VitePWA({
      // 'prompt', NOT 'autoUpdate'. An automatic update reloads the page the
      // moment a new version arrives. Here that costs nothing at all, because
      // the game and the settings are in storage (spec 10) and the app
      // reopens on them. It is still prompt rather than auto, because a
      // reload in the middle of a move is a surprise, and an offer the user
      // takes when they like is not.
      registerType: 'prompt',
      // The app registers the worker itself, through useRegisterSW, so it
      // can show a bar when a new version is waiting. 'auto' would register
      // it behind our back and the app would never hear about the update.
      injectRegister: null,
      // The three files index.html links to. The globs below already match
      // all three, so each lands in the precache list twice with the same
      // revision, which Workbox folds back into one entry. Naming them keeps
      // them precached if those patterns are ever narrowed.
      includeAssets: ['apple-touch-icon.png', 'favicon-32.png', 'icon.svg'],

      manifest: {
        name: 'Tabiya Player',
        short_name: 'Tabiya Player',
        description: 'A no-frills chess game against Stockfish',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        // As index.html's html element. The plugin's default is 'en', and
        // this app is written in Australian English.
        lang: 'en-AU',
        // The dark ground, and the same colour `index.html` gives the
        // theme-color meta. The two hex values in this file are the only ones
        // outside src/index.css, which holds every other colour the app draws
        // with: a manifest is read by iPadOS before any stylesheet exists, so
        // it cannot ask a custom property what the ground is.
        background_color: '#16181c',
        theme_color: '#16181c',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,wasm}'],
        // The engine must be in the precache, and it is bigger than the
        // default limit (spec S11). Stockfish's WASM is about 7 MB and
        // Workbox refuses anything over 2 MiB unless told otherwise. Without
        // this the app opens offline and the engine never answers, which is
        // the failure that looks most like the app being broken.
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
      },

      // No service worker while developing. A cached old build during
      // development wastes hours and teaches nothing.
      devOptions: { enabled: false },
    }),
  ],
  define: { __APP_VERSION__: JSON.stringify(version) },
  // Honour PORT so a launcher can place the dev server. The default is 5185,
  // not Vite's own 5173: 5173 is dc.web, 5175 is the trainer, and 5180 and
  // 5181 are Conquest, all on this machine, and the `dev` script names 5185
  // with --strictPort. A config that still said 5173 was one bare `npx vite`
  // away from serving this app where another project answers, which is how
  // the trainer's window once showed someone else's site.
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5185 },
  test: {
    /**
     * Two kinds of test, and they want different rooms.
     *
     * The `.test.ts` files render React to a STRING and assert on the markup.
     * They need no DOM, they run in milliseconds, and they are the bar that
     * runs on every change.
     *
     * The `.dom.test.tsx` files mount the app in jsdom and drive it the way a
     * person does, because three identity bugs in the trainer's
     * `play-context.tsx` passed every string test and were found only by
     * playing in the browser. They cost seconds rather than milliseconds,
     * which is why they are a separate kind rather than the default.
     *
     * `projects` rather than `environmentMatchGlobs`: the glob form is
     * deprecated, and two projects also keep the node tests from paying for
     * jsdom's globals. `npx vitest run` still runs both, which is the point.
     */
    projects: [
      {
        extends: true,
        test: {
          name: 'string',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.dom.test.tsx'],
          setupFiles: ['src/test/dom-setup.ts'],
          // `virtual:pwa-register/react` is invented by the PWA plugin while
          // Vite builds, and vitest's runner cannot load an id that is not a
          // path. Every DOM test mounts the app, and the app imports it, so
          // the fake goes here rather than at the top of nine test files. It
          // stands beside the fake engine and the board stub, and for the
          // same reason: it is the browser's, not the app's.
          alias: {
            'virtual:pwa-register/react': fileURLToPath(
              new URL('./src/test/pwa-register.ts', import.meta.url),
            ),
          },
        },
      },
    ],
  },
})
