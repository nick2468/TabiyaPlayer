import { useEffect, useState } from 'react'
import { asMessage } from './message'

/**
 * Origin: London src/ui/Play.tsx CopyGame and toClipboard, adapted: the failure is worded by asMessage, which is this app's one home for a thrown thing as a sentence.
 * The game on the clipboard, as PGN with the report written in (spec 18.6).
 *
 * The point is that a game can leave this app as text: pasted into a chat, a
 * file, or another engine, and played through by whoever reads it. Save game
 * writes the same text to a file; this is the same game without a dialog.
 *
 * A failure says so on the button rather than leaving one that looks as though
 * it worked.
 */

/** How long "Copied" stays up. */
const SAID_MS = 2500

/**
 * Puts text on the clipboard, by whichever of the two ways works.
 *
 * `navigator.clipboard` is the one to use and it is what both builds have. It
 * is also the one that can be refused: it needs a secure context and a
 * permission, and an embedded browser can say no to a page that a person
 * clicking a button in the real app would be allowed. So the old `execCommand`
 * path is kept behind it rather than the button simply failing where the modern
 * API is not permitted. It is deprecated and it is also the thing that works,
 * which is a fair trade for a fallback nobody sees.
 */
async function toClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    // Fall through and try the old way before giving up.
  }
  const box = document.createElement('textarea')
  box.value = text
  // Off the screen rather than hidden: a display:none textarea cannot be
  // selected, and selection is the whole mechanism here.
  box.style.position = 'fixed'
  box.style.left = '-9999px'
  document.body.appendChild(box)
  try {
    box.select()
    if (!document.execCommand('copy')) throw new Error('the browser refused to copy')
  } finally {
    box.remove()
  }
}

export function CopyGame({ text }: { text: string }) {
  const [said, setSaid] = useState<string | null>(null)

  useEffect(() => {
    if (said === null) return
    const timer = setTimeout(() => setSaid(null), SAID_MS)
    return () => clearTimeout(timer)
  }, [said])

  const copy = async () => {
    try {
      await toClipboard(text)
      setSaid('Copied')
    } catch (error) {
      setSaid(`That could not be copied: ${asMessage(error)}`)
    }
  }

  return (
    <div className="copy-game">
      <button type="button" onClick={() => void copy()}>
        Copy game
      </button>
      {said ? <span className="hint">{said}</span> : null}
    </div>
  )
}
