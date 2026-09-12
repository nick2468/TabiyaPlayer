import { describe, expect, it } from 'vitest'

import { updateNotice } from './updates'

/**
 * Origin: Conquest src/ui/updates.test.ts, adapted: three tests, because there is one notice and it costs nothing.
 */
describe('telling the user a new version is ready', () => {
  it('says a new version is ready', () => {
    expect(updateNotice().heading).toContain('new version')
  })

  /**
   * Conquest's one rule here was not to hide the cost of pressing the button.
   * This app's cost is nothing, and that is exactly what has to be said: the
   * game and the settings are in storage, so a reload gives them back.
   */
  it('says the game is remembered', () => {
    const notice = updateNotice()

    expect(notice.detail).toContain('remembered')
    expect(notice.detail).toContain('loses nothing')
  })

  it('labels the button', () => {
    expect(updateNotice().confirmLabel).toBe('Load it')
  })
})
