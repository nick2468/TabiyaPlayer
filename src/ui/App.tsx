import { useTheme } from './theme'
import './app.css'

/**
 * Origin: London src/ui/App.tsx, adapted: the header and the theme toggle only.
 * The app shell: the header, and the one screen under it (spec section 4).
 *
 * The header holds the name with the version beside it, and the theme toggle,
 * and nothing else. There is no nav to a second screen, because there is no
 * second screen (spec S1).
 */
export function App() {
  const { theme, toggle } = useTheme()
  const switchTo = theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          Simple Chess <span className="app-version">v{__APP_VERSION__}</span>
        </h1>
        <nav className="app-nav">
          <button
            type="button"
            className="nav-link theme-toggle"
            onClick={toggle}
            title={switchTo}
            aria-label={switchTo}
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </nav>
      </header>

      <main />
    </div>
  )
}
