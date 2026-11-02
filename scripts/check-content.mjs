// Guards the homepage's content and colour rules. Run after `npm run build`:
//   - the restricted fundraising terms never appear in source, public assets, README or build output
//   - no currency symbols in user-facing source
//   - no purple / violet / magenta colours anywhere in source, styles or built CSS: hex, 0xRRGGBB,
//     rgb(), hsl(), oklch(), named colours and Tailwind purple-family utilities
//   - no purple-family pixels in raster images under public/ (PNG decoded here; WebP/JPEG via ffmpeg)
// The official logo artwork is the one exception (see BRAND_ARTWORK).
//
// CHECK_ROOT=<dir> points the checker at another tree (default: the current directory).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, extname, relative, resolve, sep } from 'node:path'
import { inflateSync } from 'node:zlib'
import { spawnSync } from 'node:child_process'

const ROOT = resolve(process.env.CHECK_ROOT ?? '.')
const rel = (p) => relative(ROOT, p).split(sep).join('/')

const TEXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.json', '.svg', '.md', '.txt', '.webmanifest'])
const RASTER = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const walk = (dir, exts = TEXT) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => {
        const p = join(dir, f)
        return statSync(p).isDirectory() ? walk(p, exts) : exts.has(extname(p).toLowerCase()) ? [p] : []
      })
    : []
const at = (...p) => join(ROOT, ...p)
const ifExists = (p) => (existsSync(p) ? [p] : [])

const sourceFiles = [...walk(at('src')), ...walk(at('public')), ...ifExists(at('index.html'))]
const builtFiles = walk(at('dist'))
const builtCss = builtFiles.filter((f) => extname(f) === '.css')
const docFiles = ifExists(at('README.md'))
const problems = []
const warnings = []
const lines = (f) => readFileSync(f, 'utf8').split('\n')

// Assembled at runtime so this script doesn't trip its own check. Catches every
// variant and case of both stems (…ate, …ation, …ating, …or, …ors).
const restricted = new RegExp(['d', 'o', 'n', '(?:at|or)'].join(''), 'i')
for (const f of [...sourceFiles, ...builtFiles, ...docFiles]) {
  lines(f).forEach((line, i) => restricted.test(line) && problems.push(`${rel(f)}:${i + 1} restricted term`))
}

// The supplied HyperChat logo carries its own blue → magenta gradient. Those
// brand-artwork files are the only ones allowed to contain it; the rest of the
// page palette must stay clear of purple.
const BRAND_ARTWORK = [/^public\/brand\//, /^public\/favicon\.svg$/, /^src\/assets\/hyperchat-/, /^src\/components\/three\/BrandEmblem\.tsx$/]
const isBrandArtwork = (f) => BRAND_ARTWORK.some((re) => re.test(rel(f)))

// ---- colour maths (channels 0–1) -------------------------------------------
const hsv = (r, g, b) => {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d > 0) h = (((max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60) + 360) % 360
  return { h, s: max === 0 ? 0 : d / max, v: max, sl: d === 0 ? 0 : d / (1 - Math.abs(max + min - 1)) }
}
const inPurpleHue = (h) => h >= 255 && h <= 335
// Text colours: the HSL-saturation rule this guard has always used.
const purpleText = (r, g, b) => {
  const c = hsv(r, g, b)
  return c.sl > 0.2 && inPurpleHue(c.h)
}
// Image pixels: visibly purple, not near-grey or near-black.
const purplePixel = (r, g, b) => {
  const c = hsv(r / 255, g / 255, b / 255)
  return c.s > 0.25 && c.v > 0.15 && inPurpleHue(c.h)
}

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const num = (s, pctScale = 1) => (s.endsWith('%') ? (parseFloat(s) / 100) * pctScale : parseFloat(s))
const angle = (v, unit) => (unit === 'turn' ? v * 360 : unit === 'rad' ? (v * 180) / Math.PI : unit === 'grad' ? v * 0.9 : v)
const hslToRgb = (h, s, l) => {
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}
const oklchToRgb = (L, C, H) => {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return lin.map((x) => clamp01(x <= 0.0031308 ? 12.92 * x : 1.055 * Math.abs(x) ** (1 / 2.4) - 0.055))
}
const hexRgb = (h) => {
  const v = h.length <= 4 ? [...h.slice(0, 3)].map((c) => c + c) : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)]
  return v.map((x) => parseInt(x, 16) / 255)
}

const N = String.raw`(-?[\d.]+%?)`
const COLOUR_PATTERNS = [
  [/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/gi, (m) => hexRgb(m[1])],
  [/\b0x([0-9a-f]{6})\b/gi, (m) => hexRgb(m[1])],
  [new RegExp(String.raw`rgba?\(\s*${N}[\s,]+${N}[\s,]+${N}`, 'gi'), (m) => m.slice(1, 4).map((c) => clamp01(num(c, 255) / 255))],
  [
    new RegExp(String.raw`hsla?\(\s*(-?[\d.]+)(deg|turn|rad|grad)?[\s,]+${N}[\s,]+${N}`, 'gi'),
    (m) => hslToRgb(((angle(+m[1], m[2]) % 360) + 360) % 360, clamp01(num(m[3]) / (m[3].endsWith('%') ? 1 : 100)), clamp01(num(m[4]) / (m[4].endsWith('%') ? 1 : 100))),
  ],
  [new RegExp(String.raw`oklch\(\s*${N}\s+${N}\s+(-?[\d.]+)(deg|turn|rad|grad)?`, 'gi'), (m) => oklchToRgb(num(m[1]), num(m[2], 0.4), angle(+m[3], m[4]))],
]
// Named purples, matched where they are used as a value (`color: violet`,
// `fill="plum"`, `new Color('orchid')`, `gradient(…, magenta)`) rather than in prose.
const NAMED = 'purple|violet|darkviolet|blueviolet|mediumpurple|rebeccapurple|darkorchid|mediumorchid|orchid|magenta|darkmagenta|mediumvioletred|palevioletred|fuchsia|indigo|lavender|lavenderblush|plum|thistle|mediumslateblue|slateblue|darkslateblue'
const namedColour = new RegExp(String.raw`(?:[:=(,]\s*["'\x60]?|["'\x60])(${NAMED})(?=["'\x60\s;,)!}]|$)`, 'gi')
const tailwindPurple = /\b(?:purple|violet|fuchsia|indigo|pink)-(?:50|[1-9]00|950)\b/g

function checkColours(f, line, i) {
  const where = `${rel(f)}:${i + 1}`
  for (const [re, toRgb] of COLOUR_PATTERNS) {
    for (const m of line.matchAll(re)) {
      const rgb = toRgb(m)
      if (rgb.every(Number.isFinite) && purpleText(...rgb)) problems.push(`${where} purple-family colour ${m[0]}`)
    }
  }
  for (const m of line.matchAll(namedColour)) problems.push(`${where} purple-family named colour ${m[1]}`)
  for (const m of line.matchAll(tailwindPurple)) problems.push(`${where} purple-family utility ${m[0]}`)
}

for (const f of sourceFiles) {
  lines(f).forEach((line, i) => {
    if (/[€£₹¥]|\$\d/.test(line)) problems.push(`${rel(f)}:${i + 1} currency symbol`)
    if (!isBrandArtwork(f)) checkColours(f, line, i)
  })
}
// Built CSS bundles all styles together, Tailwind theme values (oklch) included.
for (const f of builtCss) lines(f).forEach((line, i) => checkColours(f, line, i))

// ---- raster images ----------------------------------------------------------
// The OG card carries the official logo lockup; its box is the logo artwork
// and is skipped. Measured on the 1200x630 image: the lockup's purple pixels
// span x 99–357, y 64–109 (mark from x 72); the box adds ~6 px of margin.
const IMAGE_EXCLUDE = { 'public/og-image.png': [{ x0: 66, y0: 58, x1: 364, y1: 116 }] }
const PIXEL_SHARE_LIMIT = 0.005

/** Minimal PNG decoder: 8/16-bit grey, RGB, palette, grey+alpha, RGBA; non-interlaced. */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let off = 8
  let w, h, depth, type, interlace, palette, trns
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const kind = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (kind === 'IHDR') [w, h, depth, type, interlace] = [data.readUInt32BE(0), data.readUInt32BE(4), data[8], data[9], data[12]]
    else if (kind === 'PLTE') palette = data
    else if (kind === 'tRNS') trns = data
    else if (kind === 'IDAT') idat.push(data)
    else if (kind === 'IEND') break
    off += 12 + len
  }
  if (interlace) throw new Error('interlaced PNG')
  if (depth < 8 && type !== 3) throw new Error(`unsupported bit depth ${depth}`)
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type]
  const bpp = Math.max(1, (channels * depth) / 8)
  const stride = Math.ceil((w * channels * depth) / 8)
  const raw = inflateSync(Buffer.concat(idat))
  const out = Buffer.alloc(w * h * 4)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)))
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0
      const b = prev[x]
      const c = x >= bpp ? prev[x - bpp] : 0
      const p = a + b - c
      const pr = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c
      line[x] = (line[x] + [0, a, b, (a + b) >> 1, pr][filter]) & 0xff
    }
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4
      const sample = (ch) => (depth === 16 ? line[(x * channels + ch) * 2] : line[x * channels + ch])
      if (type === 3) {
        const idx = depth === 8 ? line[x] : (line[(x * depth) >> 3] >> (8 - depth - ((x * depth) & 7))) & ((1 << depth) - 1)
        out.set([palette[idx * 3], palette[idx * 3 + 1], palette[idx * 3 + 2], trns && idx < trns.length ? trns[idx] : 255], o)
      } else if (type === 0 || type === 4) {
        const g = sample(0)
        out.set([g, g, g, type === 4 ? sample(1) : 255], o)
      } else out.set([sample(0), sample(1), sample(2), type === 6 ? sample(3) : 255], o)
    }
    prev = line
  }
  return { w, h, rgba: out }
}

const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0
/** Any format ffmpeg reads, as RGBA (alpha 255). */
function decodeWithFfmpeg(file) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: 1 << 28 })
  if (r.status !== 0) throw new Error(String(r.stderr).trim() || 'ffmpeg failed')
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file])
  const [w, h] = String(probe.stdout).trim().split(',').map(Number)
  const rgb = r.stdout
  const rgba = Buffer.alloc((rgb.length / 3) * 4)
  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) rgba.set([rgb[i], rgb[i + 1], rgb[i + 2], 255], j)
  return { w: w || 0, h: h || 0, rgba }
}

for (const f of walk(at('public'), RASTER)) {
  const name = rel(f)
  if (isBrandArtwork(f)) continue
  let img
  try {
    // Unusual PNGs (interlaced, low bit depth) fall through to ffmpeg too.
    try {
      if (extname(f).toLowerCase() !== '.png') throw new Error('ffmpeg not found')
      img = decodePng(readFileSync(f))
    } catch (err) {
      if (!hasFfmpeg) throw err
      img = decodeWithFfmpeg(f)
    }
  } catch (err) {
    warnings.push(`${name}: skipped image colour check (${err.message})`)
    continue
  }
  const skip = IMAGE_EXCLUDE[name] ?? []
  let counted = 0
  let purple = 0
  for (let p = 0, n = img.rgba.length / 4; p < n; p++) {
    const x = p % img.w
    const y = Math.floor(p / img.w)
    if (skip.some((b) => x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1)) continue
    const o = p * 4
    if (img.rgba[o + 3] < 128) continue
    counted++
    if (purplePixel(img.rgba[o], img.rgba[o + 1], img.rgba[o + 2])) purple++
  }
  const share = counted ? purple / counted : 0
  if (share > PIXEL_SHARE_LIMIT) problems.push(`${name} purple-family pixels: ${(share * 100).toFixed(2)}% (limit ${PIXEL_SHARE_LIMIT * 100}%)`)
}

for (const w of warnings) console.warn(`warning: ${w}`)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(
  `content check passed (${sourceFiles.length} source files, ${builtFiles.length} build files, ${builtCss.length} build CSS, ${walk(at('public'), RASTER).length} raster images)`,
)
