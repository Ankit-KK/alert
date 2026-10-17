import * as THREE from 'three'
import { SOUND_PADS, type PadTone } from '@/content/site'

/**
 * Canvas textures for the stage. UI surfaces (cards, alerts, the voice panel,
 * pad legends, the sticker) are drawn at runtime from the brand palette at 2×
 * resolution; the broadcast and the two media clips composite original game
 * stills from /public/media under that chrome. Images and webfonts load
 * asynchronously: every texture paints a finished-looking state immediately
 * and repaints itself once its assets arrive, so nothing blocks first render.
 */

export const PALETTE = {
  obsidian: '#080C0F',
  graphite: '#11191E',
  raised: '#1B252B',
  line: '#26333A',
  ivory: '#F3F1E9',
  mist: '#A4B0B6',
  cyan: '#38DDE8',
  teal: '#0B838C',
  signal: '#FF7048',
  mint: '#B6E8D8',
} as const

const DISPLAY = '"Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif'
const BODY = '"Inter Variable", "Inter", system-ui, sans-serif'

/** Largest canvas edge uploaded to the GPU. */
const MAX_EDGE = 2048
/**
 * Supersampling for text-bearing surfaces. The stage lowers it on the low
 * quality tier before any texture is created (about a third of the GPU memory).
 */
export const textureQuality = { supersample: 2 }

const base = import.meta.env.BASE_URL
/** Original illustrative game stills made for this page. */
export const MEDIA = {
  stream: `${base}media/stream-frame.webp`,
  boost: `${base}media/clip-boost.webp`,
  arena: `${base}media/clip-arena.webp`,
} as const

type Ctx = CanvasRenderingContext2D
type Draw = (ctx: Ctx, w: number, h: number) => void

/* ------------------------------------------------------------------ assets */

const FONT_PROBES = [`700 40px "Space Grotesk Variable"`, `600 40px "Inter Variable"`]
let fontsPromise: Promise<void> | null = null

const fontsLoaded = () => typeof document === 'undefined' || !document.fonts || FONT_PROBES.every((f) => document.fonts.check(f))

function whenFontsReady() {
  fontsPromise ??= Promise.all(FONT_PROBES.map((f) => document.fonts.load(f))).then(
    () => undefined,
    () => undefined,
  )
  return fontsPromise
}

interface ImageEntry {
  img: HTMLImageElement
  ready: boolean
  promise: Promise<boolean>
}
const imageCache = new Map<string, ImageEntry>()

/** Starts (once per URL) an async load + decode. Resolves false on error. */
function requestImage(url: string): ImageEntry {
  const cached = imageCache.get(url)
  if (cached) return cached
  const img = new Image()
  img.decoding = 'async'
  const entry: ImageEntry = { img, ready: false, promise: Promise.resolve(false) }
  img.src = url
  entry.promise = img.decode().then(
    () => (entry.ready = true),
    () => false,
  )
  imageCache.set(url, entry)
  return entry
}

const readyImage = (url: string) => {
  const entry = imageCache.get(url)
  return entry?.ready ? entry.img : null
}

/**
 * A CanvasTexture whose `draw` works in logical units; the backing canvas is
 * supersampled (capped at MAX_EDGE). It repaints once fonts and any listed
 * images have loaded, and never after it has been disposed.
 */
function canvasTexture(width: number, height: number, draw: Draw, options: { scale?: number; images?: readonly string[] } = {}) {
  const scale = Math.min(options.scale ?? textureQuality.supersample, MAX_EDGE / width, MAX_EDGE / height)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  let disposed = false
  texture.addEventListener('dispose', () => {
    disposed = true
  })

  const paint = () => {
    if (!ctx || disposed) return
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.save()
    draw(ctx, width, height)
    ctx.restore()
    texture.needsUpdate = true
  }
  paint()

  if (!fontsLoaded()) void whenFontsReady().then(paint)
  for (const url of options.images ?? []) {
    const entry = requestImage(url)
    if (!entry.ready) void entry.promise.then((ok) => ok && paint())
  }
  return texture
}

/* ----------------------------------------------------------------- helpers */

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function circle(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
}

/** Sets a font, shrinking it until `text` fits `maxWidth`. */
function fitFont(ctx: Ctx, text: string, weight: number, family: string, size: number, maxWidth: number) {
  let s = size
  ctx.font = `${weight} ${s}px ${family}`
  while (s > size * 0.6 && ctx.measureText(text).width > maxWidth) {
    s -= 1
    ctx.font = `${weight} ${s}px ${family}`
  }
  return s
}

/** Draws text vertically centred on `cy` by its real ink bounds (caps-friendly). */
function centredText(ctx: Ctx, text: string, x: number, cy: number) {
  ctx.textBaseline = 'alphabetic'
  const m = ctx.measureText(text)
  ctx.fillText(text, x, cy + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2)
}

function tracking(ctx: Ctx, px: number) {
  ctx.letterSpacing = `${px}px`
}

/** Image drawn like CSS object-fit: cover, with a focal point. */
function drawCover(ctx: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number, fx = 0.5, fy = 0.5) {
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  const s = Math.max(w / iw, h / ih)
  const sw = w / s
  const sh = h / s
  const sx = (iw - sw) * fx
  const sy = (ih - sh) * fy
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

const initials = (handle: string) =>
  handle
    .split(/[_.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')

/* Lucide icon geometry (24-unit grid, 2-unit stroke), drawn with Path2D. */
const ICON_PATHS = {
  chat: ['M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z'],
  voice: ['M12 19v3', 'M19 10v2a7 7 0 0 1-14 0v-2', 'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0z'],
  sound: [
    'M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z',
    'M16 9a5 5 0 0 1 0 6',
    'M19.364 18.364a9 9 0 0 0 0-12.728',
  ],
  media: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M11 9a2 2 0 1 1-4 0a2 2 0 1 1 4 0z', 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'],
  play: ['M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z'],
  sparkle: [
    'M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z',
  ],
} as const
type IconName = keyof typeof ICON_PATHS
const iconCache = new Map<IconName, Path2D[]>()

/** Lucide icon centred on (cx, cy). `fill` draws solid glyphs (play, sparkle). */
function icon(ctx: Ctx, name: IconName, cx: number, cy: number, size: number, color: string, mode: 'stroke' | 'fill' = 'stroke', weight = 2) {
  let paths = iconCache.get(name)
  if (!paths) {
    paths = ICON_PATHS[name].map((d) => new Path2D(d))
    iconCache.set(name, paths)
  }
  ctx.save()
  ctx.translate(cx - size / 2, cy - size / 2)
  ctx.scale(size / 24, size / 24)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = weight
  ctx.strokeStyle = color
  ctx.fillStyle = color
  for (const p of paths) {
    if (mode === 'fill') ctx.fill(p)
    else ctx.stroke(p)
  }
  ctx.restore()
}

/* --------------------------------------------------------------- broadcast */

function liveBadge(ctx: Ctx, x: number, y: number, height: number) {
  const size = height * 0.5
  ctx.font = `700 ${size}px ${DISPLAY}`
  tracking(ctx, size * 0.08)
  const textW = ctx.measureText('LIVE').width
  const dot = height * 0.13
  const padX = height * 0.36
  const w = padX * 2 + dot * 2 + height * 0.22 + textW
  rr(ctx, x, y, w, height, height * 0.24)
  ctx.fillStyle = PALETTE.signal
  ctx.fill()
  circle(ctx, x + padX + dot, y + height / 2, dot)
  ctx.fillStyle = PALETTE.obsidian
  ctx.fill()
  ctx.textAlign = 'left'
  centredText(ctx, 'LIVE', x + padX + dot * 2 + height * 0.22, y + height / 2)
  tracking(ctx, 0)
}

/**
 * The creator's broadcast: the race-footage still with stream chrome on top.
 * The still's HUD keeps its own minimap top-left, so the LIVE badge sits just
 * beside it; the top-right of the frame is open sky, reserved for alerts.
 */
export function makeScreenTexture() {
  return canvasTexture(
    1600,
    900,
    (ctx, w, h) => {
      const img = readyImage(MEDIA.stream)
      if (img) {
        ctx.drawImage(img, 0, 0, w, h)
      } else {
        // Loading / unavailable: a dusk-toned frame in the footage's colours.
        const sky = ctx.createLinearGradient(0, 0, 0, h)
        sky.addColorStop(0, '#0E3B40')
        sky.addColorStop(0.45, '#1D3A3A')
        sky.addColorStop(0.62, '#3A2A22')
        sky.addColorStop(1, PALETTE.obsidian)
        ctx.fillStyle = sky
        ctx.fillRect(0, 0, w, h)
        const sun = ctx.createRadialGradient(w * 0.36, h * 0.28, 0, w * 0.36, h * 0.28, w * 0.4)
        sun.addColorStop(0, 'rgba(255,170,120,0.55)')
        sun.addColorStop(1, 'rgba(255,112,72,0)')
        ctx.fillStyle = sun
        ctx.fillRect(0, 0, w, h)
      }

      // Broadcast vignette.
      const v = ctx.createRadialGradient(w / 2, h * 0.5, h * 0.42, w / 2, h * 0.5, w * 0.62)
      v.addColorStop(0, 'rgba(8,12,15,0)')
      v.addColorStop(1, 'rgba(8,12,15,0.38)')
      ctx.fillStyle = v
      ctx.fillRect(0, 0, w, h)

      liveBadge(ctx, 188, 34, 54)
    },
    { scale: 1, images: [MEDIA.stream] },
  )
}

/* ----------------------------------------------------------- interactions */

export type InteractionKind = 'chat' | 'voice' | 'sound' | 'media'

export interface EngineMessage {
  user: string
  text: string
  kind: InteractionKind
}

/** Sample interactions that orbit the core. Fictional handles. */
export const ENGINE_MESSAGES: EngineMessage[] = [
  { user: 'nova_frames', text: 'that clutch was unreal', kind: 'chat' },
  { user: 'kitecat', text: 'voice message · 0:04', kind: 'voice' },
  { user: 'lowpoly_lu', text: 'play the HYPE pad!', kind: 'sound' },
  { user: 'orbit.jay', text: 'sent a reaction clip', kind: 'media' },
  { user: 'mossbyte', text: 'GG chat, GG', kind: 'chat' },
]

const KIND_COLOR: Record<InteractionKind, string> = {
  chat: PALETTE.ivory,
  voice: PALETTE.cyan,
  sound: PALETTE.signal,
  media: PALETTE.mint,
}

const KIND_LABEL: Record<InteractionKind, string> = {
  chat: 'CHAT',
  voice: 'VOICE',
  sound: 'SOUND',
  media: 'CLIP',
}

/** Avatar colours per sample handle; [disc, initials]. */
const AVATAR: Record<string, [string, string]> = {
  kitecat: [PALETTE.cyan, PALETTE.obsidian],
  nova_frames: [PALETTE.signal, PALETTE.obsidian],
  mossbyte: [PALETTE.mint, PALETTE.obsidian],
  'orbit.jay': [PALETTE.ivory, PALETTE.obsidian],
  lowpoly_lu: [PALETTE.teal, PALETTE.ivory],
}

function avatar(ctx: Ctx, handle: string, cx: number, cy: number, r: number) {
  const [disc, ink] = AVATAR[handle] ?? [PALETTE.mist, PALETTE.obsidian]
  circle(ctx, cx, cy, r)
  ctx.fillStyle = disc
  ctx.fill()
  // Soft top light so the disc reads as a token, not a flat dot.
  const sheen = ctx.createLinearGradient(0, cy - r, 0, cy + r)
  sheen.addColorStop(0, 'rgba(255,255,255,0.22)')
  sheen.addColorStop(0.55, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fill()
  const text = initials(handle)
  ctx.fillStyle = ink
  ctx.font = `700 ${r * (text.length > 1 ? 0.78 : 0.92)}px ${DISPLAY}`
  ctx.textAlign = 'center'
  centredText(ctx, text, cx, cy)
}

/** Deterministic voice-note waveform heights (0…1). */
const WAVE = Array.from({ length: 30 }, (_, i) => 0.22 + 0.78 * Math.abs(Math.sin(i * 1.37) * Math.cos(i * 0.41 + 0.6)))

function voiceNote(ctx: Ctx, x: number, cy: number, w: number, duration: string, scale = 1) {
  const r = 21 * scale
  circle(ctx, x + r, cy, r)
  ctx.fillStyle = PALETTE.cyan
  ctx.fill()
  icon(ctx, 'play', x + r + 1.5 * scale, cy, 20 * scale, PALETTE.obsidian, 'fill')

  ctx.font = `600 ${25 * scale}px ${BODY}`
  ctx.textAlign = 'right'
  ctx.fillStyle = PALETTE.mist
  centredText(ctx, duration, x + w, cy)
  const timeW = ctx.measureText(duration).width

  const barsX = x + r * 2 + 16 * scale
  const barsW = w - (barsX - x) - timeW - 18 * scale
  const n = WAVE.length
  const pitch = barsW / n
  const bw = Math.max(2, pitch * 0.52)
  for (let i = 0; i < n; i++) {
    const bh = Math.max(bw, WAVE[i] * 44 * scale)
    rr(ctx, barsX + i * pitch, cy - bh / 2, bw, bh, bw / 2)
    ctx.fillStyle = i < n * 0.42 ? PALETTE.cyan : 'rgba(164,176,182,0.55)'
    ctx.fill()
  }
}

function clipThumb(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.save()
  rr(ctx, x, y, w, h, r)
  ctx.clip()
  const img = readyImage(MEDIA.boost)
  if (img) drawCover(ctx, img, x, y, w, h, 0.5, 0.62)
  else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h)
    g.addColorStop(0, PALETTE.teal)
    g.addColorStop(1, '#3A2A22')
    ctx.fillStyle = g
    ctx.fillRect(x, y, w, h)
  }
  ctx.restore()
  rr(ctx, x, y, w, h, r)
  ctx.strokeStyle = 'rgba(243,241,233,0.22)'
  ctx.lineWidth = 2
  ctx.stroke()
  circle(ctx, x + w / 2, y + h / 2, h * 0.24)
  ctx.fillStyle = 'rgba(8,12,15,0.62)'
  ctx.fill()
  icon(ctx, 'play', x + w / 2 + 1.5, y + h / 2, h * 0.26, PALETTE.ivory, 'fill')
}

/** A chat / interaction card: avatar with kind badge, handle, kind label, content. */
export function makeMessageTexture(message: EngineMessage) {
  const kind = message.kind
  return canvasTexture(
    640,
    168,
    (ctx, w, h) => {
      // Card face.
      rr(ctx, 2, 2, w - 4, h - 4, 24)
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, 'rgba(32,44,51,0.97)')
      bg.addColorStop(1, 'rgba(15,22,27,0.97)')
      ctx.fillStyle = bg
      ctx.fill()
      ctx.strokeStyle = 'rgba(243,241,233,0.12)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Avatar + kind badge.
      const ax = 78
      const ay = h / 2
      avatar(ctx, message.user, ax, ay, 46)
      const bx = ax + 34
      const by = ay + 34
      circle(ctx, bx, by, 20)
      ctx.fillStyle = KIND_COLOR[kind]
      ctx.fill()
      ctx.strokeStyle = '#141D22'
      ctx.lineWidth = 5
      ctx.stroke()
      icon(ctx, kind, bx, by, 21, PALETTE.obsidian, 'stroke', 2.4)

      const tx = 150
      const right = w - 30
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.mist
      ctx.font = `600 26px ${BODY}`
      centredText(ctx, message.user, tx, 52)

      if (kind === 'media') {
        const tw = 132
        const th = 104
        clipThumb(ctx, right - tw + 6, (h - th) / 2, tw, th, 14)
        ctx.fillStyle = PALETTE.ivory
        fitFont(ctx, message.text, 600, DISPLAY, 36, right - tw - 18 - tx)
        centredText(ctx, message.text, tx, 108)
        return
      }

      ctx.textAlign = 'right'
      ctx.fillStyle = KIND_COLOR[kind]
      ctx.font = `700 19px ${DISPLAY}`
      tracking(ctx, 2.5)
      centredText(ctx, KIND_LABEL[kind], right, 52)
      tracking(ctx, 0)

      if (kind === 'voice') {
        voiceNote(ctx, tx, 110, right - tx, message.text.split('·').pop()?.trim() ?? '')
        return
      }
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.ivory
      fitFont(ctx, message.text, 600, DISPLAY, 38, right - tx)
      centredText(ctx, message.text, tx, 108)
    },
    { images: kind === 'media' ? [MEDIA.boost] : [] },
  )
}

const ALERT_COPY: Record<InteractionKind, [string, string]> = {
  chat: ['CHAT HIGHLIGHT', 'Message pinned to stream'],
  voice: ['VOICE MESSAGE', 'Read aloud on air'],
  sound: ['SOUNDBOARD', 'Sound pad played on air'],
  media: ['MEDIA', 'Reaction clip on screen'],
}

/** On-stream alert that slides onto the broadcast when an interaction lands. */
export function makeAlertTexture(kind: InteractionKind) {
  return canvasTexture(760, 170, (ctx, w, h) => {
    const color = KIND_COLOR[kind]
    rr(ctx, 4, 4, w - 8, h - 8, 30)
    const bg = ctx.createLinearGradient(0, 0, 0, h)
    bg.addColorStop(0, 'rgba(27,37,43,0.96)')
    bg.addColorStop(1, 'rgba(8,12,15,0.96)')
    ctx.fillStyle = bg
    ctx.fill()
    ctx.lineWidth = 3
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.9
    ctx.stroke()
    ctx.globalAlpha = 1

    const tile = h - 48
    rr(ctx, 24, 24, tile, tile, 24)
    ctx.fillStyle = color
    ctx.fill()
    icon(ctx, kind, 24 + tile / 2, h / 2, tile * 0.5, PALETTE.obsidian, 'stroke', 2.2)

    const tx = 24 + tile + 30
    const [title, body] = ALERT_COPY[kind]
    ctx.textAlign = 'left'
    ctx.fillStyle = color
    ctx.font = `700 26px ${DISPLAY}`
    tracking(ctx, 3)
    centredText(ctx, title, tx, 62)
    tracking(ctx, 0)
    ctx.fillStyle = PALETTE.ivory
    fitFont(ctx, body, 600, BODY, 38, w - tx - 36)
    centredText(ctx, body, tx, 112)
  })
}

/* --------------------------------------------------------------- soundboard */

const TONE_COLOR: Record<PadTone, string> = { cyan: PALETTE.cyan, signal: PALETTE.signal, mint: PALETTE.mint }

/** Pad legend: centred label, key hint and a tone-coloured LED bar. */
export function makePadLabelTexture(label: string, key = '', tone: PadTone = 'cyan') {
  return canvasTexture(256, 256, (ctx, w, h) => {
    if (key) {
      ctx.fillStyle = PALETTE.mist
      ctx.font = `600 28px ${BODY}`
      ctx.textAlign = 'left'
      centredText(ctx, key, 34, 40)
    }
    ctx.fillStyle = PALETTE.ivory
    ctx.textAlign = 'center'
    fitFont(ctx, label, 700, DISPLAY, label.length > 4 ? 52 : 66, w * 0.78)
    tracking(ctx, 1)
    centredText(ctx, label, w / 2 + 0.5, h / 2 + 2)
    tracking(ctx, 0)
    rr(ctx, w / 2 - 24, h * 0.73, 48, 7, 3.5)
    ctx.fillStyle = TONE_COLOR[tone]
    ctx.fill()
  })
}

export const padLabels = () => SOUND_PADS.map((p) => makePadLabelTexture(p.label, p.key, p.tone))

/* ------------------------------------------------------------------- media */

function mediaFallback(ctx: Ctx, w: number, h: number, glyph: IconName) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#123238')
  g.addColorStop(1, PALETTE.graphite)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  icon(ctx, glyph, w / 2, h / 2, 64, 'rgba(164,176,182,0.45)', 'stroke', 1.6)
}

function bottomShade(ctx: Ctx, w: number, h: number, from: number, alpha: number) {
  const g = ctx.createLinearGradient(0, h * from, 0, h)
  g.addColorStop(0, 'rgba(8,12,15,0)')
  g.addColorStop(1, `rgba(8,12,15,${alpha})`)
  ctx.fillStyle = g
  ctx.fillRect(0, h * from, w, h * (1 - from))
}

/** Dark glass pill with an optional leading glyph — the badge style for media. */
function chip(ctx: Ctx, x: number, y: number, label: string, color: string, glyph?: IconName) {
  const hgt = 44
  ctx.font = `700 21px ${DISPLAY}`
  tracking(ctx, 2)
  const tw = ctx.measureText(label).width
  const lead = glyph ? 28 : 0
  const w = 32 + lead + tw
  rr(ctx, x, y, w, hgt, 12)
  ctx.fillStyle = 'rgba(8,12,15,0.72)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(243,241,233,0.16)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  if (glyph) icon(ctx, glyph, x + 16 + 10, y + hgt / 2, 19, color, 'fill')
  ctx.fillStyle = glyph ? PALETTE.ivory : color
  ctx.textAlign = 'left'
  centredText(ctx, label, x + 16 + lead, y + hgt / 2)
  tracking(ctx, 0)
}

/** Replay clip: the boost-gate shot, with clip chrome and a scrub bar. */
function makeClipTexture() {
  return canvasTexture(
    512,
    384,
    (ctx, w, h) => {
      const img = readyImage(MEDIA.boost)
      if (img) drawCover(ctx, img, 0, 0, w, h, 0.5, 0.66)
      else mediaFallback(ctx, w, h, 'play')
      bottomShade(ctx, w, h, 0.58, 0.85)

      chip(ctx, 16, 16, 'CLIP', PALETTE.signal, 'play')

      // Sender + timecode.
      avatar(ctx, 'orbit.jay', 32, h - 52, 14)
      ctx.textAlign = 'left'
      ctx.fillStyle = PALETTE.ivory
      ctx.font = `600 17px ${BODY}`
      centredText(ctx, 'orbit.jay', 54, h - 52)
      ctx.textAlign = 'right'
      ctx.fillStyle = PALETTE.mist
      ctx.font = `600 16px ${BODY}`
      centredText(ctx, '0:06 / 0:14', w - 18, h - 52)

      // Scrub bar.
      const x0 = 18
      const x1 = w - 18
      const y = h - 24
      const p = 0.43
      rr(ctx, x0, y - 2.5, x1 - x0, 5, 2.5)
      ctx.fillStyle = 'rgba(243,241,233,0.26)'
      ctx.fill()
      rr(ctx, x0, y - 2.5, (x1 - x0) * p, 5, 2.5)
      ctx.fillStyle = PALETTE.signal
      ctx.fill()
      circle(ctx, x0 + (x1 - x0) * p, y, 7)
      ctx.fillStyle = PALETTE.ivory
      ctx.fill()
    },
    { images: [MEDIA.boost] },
  )
}

/** Looping GIF: the aerial canyon shot with a classic GIF tag on the calm rock. */
function makeGifTexture() {
  return canvasTexture(
    512,
    384,
    (ctx, w, h) => {
      const img = readyImage(MEDIA.arena)
      if (img) drawCover(ctx, img, 0, 0, w, h, 0.5, 0.42)
      else mediaFallback(ctx, w, h, 'media')
      bottomShade(ctx, w, h, 0.7, 0.45)

      const bw = 80
      const bh = 44
      rr(ctx, 16, h - 16 - bh, bw, bh, 11)
      ctx.fillStyle = PALETTE.ivory
      ctx.fill()
      ctx.fillStyle = PALETTE.obsidian
      ctx.font = `700 24px ${DISPLAY}`
      tracking(ctx, 1.5)
      ctx.textAlign = 'center'
      centredText(ctx, 'GIF', 16 + bw / 2 + 0.75, h - 16 - bh / 2)
      tracking(ctx, 0)
    },
    { images: [MEDIA.arena] },
  )
}

/** Reaction sticker: die-cut "GG" lettering on a halftone burst. */
function makeStickerTexture() {
  return canvasTexture(512, 384, (ctx, w, h) => {
    const cx = w / 2
    const cy = h / 2

    // Teal burst backdrop.
    const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.66)
    bg.addColorStop(0, '#14A9B3')
    bg.addColorStop(0.5, PALETTE.teal)
    bg.addColorStop(1, '#063A40')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(cx, cy)
    const rays = 22
    for (let i = 0; i < rays; i += 2) {
      const a0 = (i / rays) * Math.PI * 2
      const a1 = ((i + 1) / rays) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, w, a0, a1)
      ctx.closePath()
      ctx.fillStyle = 'rgba(182,232,216,0.11)'
      ctx.fill()
    }
    ctx.restore()

    // Halftone dots growing toward the corners.
    const maxD = Math.hypot(cx, cy)
    ctx.fillStyle = 'rgba(8,12,15,0.32)'
    for (let y = 6; y < h; y += 13) {
      const off = (Math.round(y / 13) % 2) * 6.5
      for (let x = 6 + off; x < w; x += 13) {
        const d = Math.hypot(x - cx, y - cy) / maxD
        const r = Math.max(0, (d - 0.45) * 9.5)
        if (r < 0.4) continue
        circle(ctx, x, y, Math.min(r, 5.6))
        ctx.fill()
      }
    }

    // Sticker lettering.
    ctx.save()
    ctx.translate(cx, cy - 14)
    ctx.rotate(-0.07)
    ctx.transform(1, 0, -0.16, 1, 0, 0)
    ctx.font = `700 186px ${DISPLAY}`
    tracking(ctx, -4)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    const m = ctx.measureText('GG')
    const by = (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
    ctx.lineJoin = 'round'
    ctx.miterLimit = 2

    // Drop shadow under the die-cut.
    ctx.fillStyle = 'rgba(4,22,26,0.55)'
    ctx.strokeStyle = 'rgba(4,22,26,0.55)'
    ctx.lineWidth = 40
    ctx.strokeText('GG', 7, by + 10)
    // Die-cut ivory border, then the cyan keyline.
    ctx.strokeStyle = PALETTE.ivory
    ctx.lineWidth = 40
    ctx.strokeText('GG', 0, by)
    ctx.strokeStyle = PALETTE.cyan
    ctx.lineWidth = 22
    ctx.strokeText('GG', 0, by)
    ctx.strokeStyle = PALETTE.obsidian
    ctx.lineWidth = 9
    ctx.strokeText('GG', 0, by)
    // Extruded depth.
    ctx.fillStyle = '#B9432A'
    ctx.fillText('GG', 4, by + 6)
    // Face: signal orange with a warm highlight.
    const face = ctx.createLinearGradient(0, by - m.actualBoundingBoxAscent, 0, by)
    face.addColorStop(0, '#FFB59E')
    face.addColorStop(0.42, PALETTE.signal)
    face.addColorStop(1, '#F2552C')
    ctx.fillStyle = face
    ctx.fillText('GG', 0, by)
    tracking(ctx, 0)
    ctx.restore()

    // "WELL PLAYED" ribbon.
    ctx.save()
    ctx.translate(cx + 6, cy + 106)
    ctx.rotate(-0.07)
    ctx.font = `700 24px ${DISPLAY}`
    tracking(ctx, 5)
    const rw = ctx.measureText('WELL PLAYED').width + 48
    rr(ctx, -rw / 2, -24, rw, 48, 24)
    ctx.fillStyle = PALETTE.obsidian
    ctx.fill()
    ctx.strokeStyle = PALETTE.ivory
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = PALETTE.ivory
    ctx.textAlign = 'center'
    centredText(ctx, 'WELL PLAYED', 2.5, 0)
    tracking(ctx, 0)
    ctx.restore()

    // Sparkles.
    icon(ctx, 'sparkle', 92, 84, 52, PALETTE.ivory, 'fill')
    icon(ctx, 'sparkle', 424, 296, 40, PALETTE.mint, 'fill')
    icon(ctx, 'sparkle', 436, 92, 26, PALETTE.cyan, 'fill')
    icon(ctx, 'sparkle', 70, 300, 22, PALETTE.mint, 'fill')
  })
}

/** The media station's three pieces: [looping GIF, replay clip, reaction sticker]. */
export function makeMediaTextures() {
  return [makeGifTexture(), makeClipTexture(), makeStickerTexture()]
}

/* ------------------------------------------------------------------- voice */

/** Face of the floating voice module. */
export function makeVoicePanelTexture() {
  return canvasTexture(1024, 576, (ctx, w, h) => {
    // Header: sender and on-air state.
    avatar(ctx, 'kitecat', 100, 96, 40)
    ctx.textAlign = 'left'
    ctx.fillStyle = PALETTE.ivory
    ctx.font = `600 34px ${DISPLAY}`
    centredText(ctx, 'kitecat', 162, 80)
    icon(ctx, 'voice', 174, 122, 24, PALETTE.cyan, 'stroke', 2.2)
    ctx.fillStyle = PALETTE.mist
    ctx.font = `500 24px ${BODY}`
    centredText(ctx, 'Voice message · 0:04', 196, 122)

    ctx.font = `700 20px ${DISPLAY}`
    tracking(ctx, 3)
    const label = 'ON AIR'
    const lw = ctx.measureText(label).width
    const pw = lw + 62
    const px = w - 64 - pw
    rr(ctx, px, 76, pw, 42, 21)
    ctx.fillStyle = 'rgba(56,221,232,0.12)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(56,221,232,0.7)'
    ctx.lineWidth = 2
    ctx.stroke()
    circle(ctx, px + 24, 97, 6)
    ctx.fillStyle = PALETTE.cyan
    ctx.fill()
    centredText(ctx, label, px + 40, 97)
    tracking(ctx, 0)

    // Divider.
    ctx.fillStyle = 'rgba(243,241,233,0.1)'
    ctx.fillRect(64, 168, w - 128, 2)

    // The message itself.
    ctx.fillStyle = PALETTE.ivory
    ctx.font = `600 58px ${DISPLAY}`
    centredText(ctx, '“Run it back one', 64, 240)
    centredText(ctx, 'more time!”', 64, 312)

    // Playhead.
    const y = h - 78
    const x0 = 148
    const x1 = w - 148
    const p = 0.38
    ctx.font = `500 24px ${BODY}`
    ctx.fillStyle = PALETTE.mist
    ctx.textAlign = 'left'
    centredText(ctx, '0:01', 64, y)
    ctx.textAlign = 'right'
    centredText(ctx, '0:04', w - 64, y)
    rr(ctx, x0, y - 4, x1 - x0, 8, 4)
    ctx.fillStyle = 'rgba(164,176,182,0.28)'
    ctx.fill()
    rr(ctx, x0, y - 4, (x1 - x0) * p, 8, 4)
    ctx.fillStyle = PALETTE.cyan
    ctx.fill()
    circle(ctx, x0 + (x1 - x0) * p, y, 12)
    ctx.fillStyle = PALETTE.ivory
    ctx.fill()
  })
}
