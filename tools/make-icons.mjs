/**
 * Origin: Conquest tools/make-icons.mjs, adapted: the art is read from public/icon.svg rather than drawn from a map, and the rounded version is a clip rather than a second drawing.
 * Write the app icon out at the sizes iPadOS and the manifest want.
 *
 * Run it with: npm run icons
 *
 * The art is `public/icon.svg`, hand drawn once from the board's own knight.
 * This script only resizes it, so the Home Screen icon and the favicon cannot
 * drift apart: there is one drawing and four renderings of it.
 *
 * The output is committed, because an icon should not need a build step to
 * exist. This only has to run when `icon.svg` changes.
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const OUT = join(ROOT, 'public')

/** The icon's own size, and the corner radius at that size. Conquest's numbers. */
const SIZE = 512
const RADIUS = 112

/**
 * The same art with its corners taken off.
 *
 * Conquest draws its icon twice, square and rounded. Here the art is a
 * committed file, so rounding it is a clip over that one file rather than a
 * second copy of the drawing that could drift from it. The corners come out
 * transparent either way, which is what a rounded icon is.
 */
function rounded(square) {
  const inner = square.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <clipPath id="corners">
      <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}"/>
    </clipPath>
  </defs>
  <g clip-path="url(#corners)">${inner}</g>
</svg>`
}

async function main() {
  const square = await readFile(join(OUT, 'icon.svg'), 'utf8')
  const art = Buffer.from(rounded(square))
  // iPadOS rounds the corners itself, so its icon is drawn square. A rounded
  // icon would come out with the corners clipped twice.
  const flat = Buffer.from(square)

  const wanted = [
    { file: 'icon-192.png', size: 192, art },
    { file: 'icon-512.png', size: 512, art },
    { file: 'apple-touch-icon.png', size: 180, art: flat },
    { file: 'favicon-32.png', size: 32, art },
  ]

  for (const { file, size, art: source } of wanted) {
    await sharp(source).resize(size, size).png().toFile(join(OUT, file))
    console.log(`wrote public/${file} at ${size}x${size}`)
  }
}

await main()
