import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../test/dom'

/**
 * The header: the name, the version and the theme toggle (spec 4.1 and 4.5).
 *
 * The version is `__APP_VERSION__` rather than a second read of package.json:
 * `version.test.ts` already holds that constant to package.json, so the two
 * tests together say the header shows the declared number.
 */
describe('the header', () => {
  it('names the app and shows its version', () => {
    renderApp()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('Simple Chess')
    expect(heading.textContent).toContain(`v${__APP_VERSION__}`)
  })

  it('switches the theme, remembers it, and switches back', async () => {
    const { user } = renderApp()

    await user.click(screen.getByRole('button', { name: 'Switch to the light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem('simple-chess.theme')).toBe('light')

    await user.click(screen.getByRole('button', { name: 'Switch to the dark theme' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem('simple-chess.theme')).toBe('dark')
  })
})
