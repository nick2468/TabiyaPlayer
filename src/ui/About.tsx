import { useState } from 'react'
import { GPL_TEXT, MIT_TEXT, OTHER_DEPENDENCIES } from './licences'
import { loadNotices, type NoticesLoad } from './notices'
import './about.css'

/**
 * Origin: Tabiya src/ui/About.tsx, adapted: this app's name and what it is in place of what a tabiya is, the source address as plain text rather than a link the opener plugin opens, and no help stylesheet to borrow.
 * Who made this, and the notices the program owes (spec 25).
 *
 * The licence half is the reason it exists. The installer contains two
 * libraries under the GNU General Public License, Stockfish and chessground,
 * so the program as a whole goes out under GPL-3.0, and a GPL program with a
 * user interface owes whoever runs it the notices this screen carries.
 * Tabiya, which this app was copied from, met the same obligation the same way.
 *
 * The address is text, not a link. In the desktop window a link either does
 * nothing or navigates the app's own window, and opening the system browser
 * needs a plugin and a permission this app does not otherwise have. A short
 * address that can be read and typed meets the obligation without either.
 *
 * The version is `__APP_VERSION__`, the build-time value the header shows. A
 * version written here by hand would be wrong by the next release.
 */

/** Where the complete source is, as the screen writes it. */
export const REPOSITORY_SHOWN = 'github.com/nick2468/TabiyaPlayer'

export function About() {
  const [licences, setLicences] = useState(false)
  return (
    <div className="about">
      <h2>
        Tabiya Player <span className="app-version">v{__APP_VERSION__}</span>
      </h2>
      <p>
        Made by Nicholas Walker. The source code is at{' '}
        <span className="about-address">{REPOSITORY_SHOWN}</span>.
      </p>
      <p>
        It is the companion to Tabiya, which teaches chess opening repertoires: learn the
        openings there, and play the game out here.
      </p>

      <h3>Licence</h3>
      <p>
        Tabiya Player's own code is copyright (c) 2026 Nicholas Walker, and is free software
        under the MIT licence.
      </p>
      <p>
        The program you are running also contains two libraries licensed under the GNU
        General Public License: Stockfish (GPL-3.0), the engine you play against, and
        chessground (GPL-3.0-or-later), the board. Because it contains them, this program as
        a whole is distributed under the GNU General Public License version 3. You may copy,
        change and share it under those terms. It comes with no warranty. The complete
        source is at the address above.
      </p>
      <p>
        <button
          type="button"
          aria-expanded={licences}
          aria-controls="about-licences"
          onClick={() => setLicences(!licences)}
        >
          View the licences
        </button>
      </p>
      {licences ? <Licences /> : null}
    </div>
  )
}

/**
 * The full texts, offline: GPL-3.0 section 4 says whoever receives the program
 * gets a copy of its licence with it, and this is that copy.
 *
 * Exported for its test, which cannot click the button in a string render.
 */
export function Licences() {
  return (
    <div id="about-licences" className="licences">
      <h4>Tabiya Player: the MIT licence</h4>
      <pre>{MIT_TEXT}</pre>

      <h4>Stockfish and chessground: the GNU General Public License, version 3</h4>
      <p>
        This one text covers both libraries. Each ships it as its own licence file, and the
        two are the same word for word.
      </p>
      <pre>{GPL_TEXT}</pre>

      <h4>Its other direct dependencies</h4>
      <ul>
        {OTHER_DEPENDENCIES.map((dependency) => (
          <li key={dependency.name}>
            {dependency.name} {dependency.version}: {dependency.licence}
          </li>
        ))}
      </ul>

      <ThirdPartyNotices />
    </div>
  )
}

/**
 * Every library the program contains, with its own copyright and licence
 * notice, fetched only when it is opened.
 *
 * The list above names the libraries the app asks for. This is everything that
 * ships, theirs included: each JavaScript package with code in the bundle and
 * each Rust crate in the Windows program, a few hundred kilobytes. Fetched on
 * the first open and kept, never imported, so it is not in the main bundle.
 *
 * Exported for its test.
 */
export function ThirdPartyNotices({ load = loadNotices }: { load?: () => Promise<NoticesLoad> }) {
  const [open, setOpen] = useState(false)
  const [notices, setNotices] = useState<NoticesLoad | 'loading' | null>(null)

  const toggle = () => {
    const opening = !open
    setOpen(opening)
    if (opening && notices === null) {
      setNotices('loading')
      void load().then(setNotices)
    }
  }

  return (
    <>
      <h4>Every library it contains</h4>
      <p>
        The copyright and licence notice of every library in the program, those above
        included: each JavaScript package in the app and each Rust crate in the Windows
        program. They are generated from the build itself, every time it is built.
      </p>
      <p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="about-third-party"
          onClick={toggle}
        >
          Third-party notices
        </button>
      </p>
      {open ? <div id="about-third-party">{shown(notices)}</div> : null}
    </>
  )
}

/** What the open section says, for each state the fetch can be in. */
function shown(notices: NoticesLoad | 'loading' | null) {
  if (notices === null || notices === 'loading') return <p>Loading the notices.</p>
  if (notices.kind === 'loaded') return <pre className="notices">{notices.text}</pre>
  if (notices.kind === 'missing') {
    // In development there is no bundle for the notices to be read from. In a
    // release a missing file is a fault, and it is not dressed up as anything else.
    return (
      <p role="note">
        {import.meta.env.DEV
          ? 'The third-party notices are generated when the app is built for release, so a development build has none to show.'
          : 'The third-party notices are missing from this build. Every release build writes them, so this one was not built the usual way.'}
      </p>
    )
  }
  return (
    <p role="alert" className="about-failed">
      The third-party notices could not be loaded ({notices.why}).
    </p>
  )
}
