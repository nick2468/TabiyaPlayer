import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The header and the theme (spec 19.1 and 4.5).
 *
 * The header is the name and the version, and from phase 13 that is all of it:
 * the theme toggle is in the settings row under the board with every other
 * control (spec Q23), so the second test waits for the board before it can
 * press it. The toggle is found by its name either way, which is why moving it
 * cost this file one line.
 *
 * The version is `__APP_VERSION__` rather than a second read of package.json:
 * `version.test.ts` already holds that constant to package.json, so the two
 * tests together say the header shows the declared number.
 */
describe('the header', () => {
  it('names the app and shows its version', () => {
    renderApp()
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toContain('Simply Chess')
    expect(heading.textContent).toContain(`v${__APP_VERSION__}`)
  })

  it('switches the theme, remembers it, and switches back', async () => {
    const { user } = renderApp()
    await screen.findByTestId('board')

    await user.click(screen.getByRole('button', { name: 'Switch to the light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem('simply-chess.theme')).toBe('light')

    await user.click(screen.getByRole('button', { name: 'Switch to the dark theme' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem('simply-chess.theme')).toBe('dark')
  })
})
