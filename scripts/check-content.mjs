// Guards the homepage's content and colour rules. Run after `npm run build`:
//   - the restricted fundraising term never appears in source, public assets or build output
//   - no currency symbols in user-facing source
//   - no purple / violet / magenta hex colours anywhere in source or styles
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const TEXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.json', '.svg', '.md', '.txt', '.webmanifest'])
const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => {
        const p = join(dir, f)
        return statSync(p).isDirectory() ? walk(p) : TEXT.has(extname(p)) ? [p] : []
      })
    : []

const sourceFiles = [...walk('src'), ...walk('public'), 'index.html']
const builtFiles = walk('dist')
const problems = []

// Assembled at runtime so this script doesn't trip its own check.
const restricted = new RegExp(['d', 'o', 'n', 'a', 't'].join(''), 'i')
for (const f of [...sourceFiles, ...builtFiles]) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => restricted.test(line) && problems.push(`${f}:${i + 1} restricted term`))
}

// The supplied HyperChat logo carries its own blue → magenta gradient. Those
// brand-artwork files are the only ones allowed to contain it; the rest of the
// page palette must stay clear of purple.
const BRAND_ARTWORK = [/^public\/brand\//, /^public\/favicon\.svg$/, /^src\/assets\/hyperchat-/, /^src\/components\/three\/BrandEmblem\.tsx$/]
const isBrandArtwork = (f) => BRAND_ARTWORK.some((re) => re.test(f))

const currency = /[€£₹¥]|\$\d/
const hex = /#([0-9a-f]{6}|[0-9a-f]{3})\b/gi
const hue = (h) => {
  const v = h.length === 3 ? [...h].map((c) => parseInt(c + c, 16)) : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [r, g, b] = v.map((x) => x / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  if (d === 0) return { h: 0, s: 0 }
  let H = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  H = (H * 60 + 360) % 360
  return { h: H, s: d / (1 - Math.abs(max + min - 1)) }
}
for (const f of sourceFiles) {
  readFileSync(f, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (currency.test(line)) problems.push(`${f}:${i + 1} currency symbol`)
      if (isBrandArtwork(f)) return
      for (const [, h] of line.matchAll(hex)) {
        const { h: H, s } = hue(h)
        if (s > 0.2 && H >= 255 && H <= 335) problems.push(`${f}:${i + 1} purple-family colour #${h}`)
      }
    })
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`content check passed (${sourceFiles.length} source files, ${builtFiles.length} build files)`)
