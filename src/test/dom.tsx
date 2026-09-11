import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../ui/App'

/**
 * Origin: London src/test/dom.tsx, adapted: renderApp only, rendering App with no providers.
 * The app in jsdom, driven the way a person drives it.
 *
 * The real components, so the code under test is the code that ships. There
 * are no providers yet, so this renders `App` itself. The trainer renders a
 * `Shell` inside its providers, with a fake engine handed to `PlayProvider`;
 * that split arrives here with the first provider, in phase 2.
 */
export function renderApp() {
  const user = userEvent.setup()
  render(<App />)
  return { user }
}
