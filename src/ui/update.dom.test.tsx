import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../test/dom'

vi.mock('./Board', async () => await import('../test/board-stub'))

/**
 * The update bar (spec 12.1), and where it is not shown (spec S12).
 *
 * `virtual:pwa-register/react` is a module the PWA plugin invents at build
 * time, so it is mocked here rather than resolved: the test is about what the
 * app does when a new version is waiting, not about Workbox. The mock is also
 * how "waiting" is arrived at at all, since nothing in a test can install a
 * service worker.
 */
const pwa = vi.hoisted(() => ({
  useRegisterSW: vi.fn(),
  updateServiceWorker: vi.fn(),
}))

vi.mock('virtual:pwa-register/react', () => ({ useRegisterSW: pwa.useRegisterSW }))

beforeEach(() => {
  pwa.useRegisterSW.mockReturnValue({
    needRefresh: [true, vi.fn()],
    updateServiceWorker: pwa.updateServiceWorker,
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('a new version waiting', () => {
  it('offers it, and says it costs nothing', async () => {
    renderApp()

    const bar = await screen.findByRole('status')
    expect(bar.textContent).toContain('A new version is ready')
    expect(bar.textContent).toContain('remembered')
    expect(screen.getByRole('button', { name: 'Load it' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Not now' })).toBeTruthy()
  })

  it('goes away on Not now', async () => {
    const { user } = renderApp()

    await user.click(await screen.findByRole('button', { name: 'Not now' }))

    expect(screen.queryByRole('status')).toBeNull()
  })

  /**
   * `true` is what tells the waiting worker to take over. Without it the new
   * version stays parked and the button does nothing a person can see, which
   * is the failure this test exists for.
   */
  it('takes the new version on Load it', async () => {
    const { user } = renderApp()

    await user.click(await screen.findByRole('button', { name: 'Load it' }))

    expect(pwa.updateServiceWorker).toHaveBeenCalledWith(true)
  })
})

/**
 * What Tauri puts on `window`, and the one thing `isDesktop()` looks for. The
 * test sets it rather than mocking `isDesktop`, so the real check runs.
 */
const TAURI = '__TAURI_INTERNALS__'

describe('inside the Tauri window', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, TAURI)
  })

  /**
   * Spec S12. A WebView2 app updates by installer, and a service worker
   * holding an old bundle inside it would make "new code reaches the window
   * after a reinstall" untrue. So nothing registers one, which means the hook
   * is never called at all rather than called and ignored.
   */
  it('shows no bar and registers nothing', async () => {
    Reflect.set(window, TAURI, {})

    renderApp()
    await screen.findByTestId('board')

    expect(screen.queryByRole('status')).toBeNull()
    expect(pwa.useRegisterSW).not.toHaveBeenCalled()
  })
})
