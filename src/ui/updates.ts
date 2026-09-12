/**
 * Origin: Conquest src/ui/updates.ts, adapted: one notice with no argument, because this app remembers the game.
 * Telling the user when a new version is ready.
 *
 * The service worker is set to WAIT rather than update on its own. See the
 * comment in vite.config.ts.
 *
 * The cost of waiting is that an update is invisible: there is no way to know
 * whether the iPad is running the newest version short of looking for a
 * change and guessing. This makes it visible without making it forced.
 *
 * Conquest says two different things here, because a game of Conquest lives
 * only in memory and loading a new version ends it. This app writes the game
 * after every move and reopens on it (spec 10), so there is one thing to say
 * and it is good news. Saying it plainly is the point: a user who has been
 * told what the button costs will press it.
 *
 * No React here, so the wording is tested without a browser.
 */

export interface UpdateNotice {
  readonly heading: string
  readonly detail: string
  readonly confirmLabel: string
}

/** What to say about a waiting update (spec 12.1). */
export function updateNotice(): UpdateNotice {
  return {
    heading: 'A new version is ready',
    detail: 'Your game and settings are remembered, so loading it loses nothing.',
    confirmLabel: 'Load it',
  }
}
