import * as THREE from 'three'
import { SOUND_PADS } from '@/content/site'

/**
 * Procedural canvas textures for the stage. Everything is drawn at runtime
 * from the brand palette — no image files, no network requests.
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

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) draw(ctx, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** The simulated broadcast shown on the central display. */
export function makeScreenTexture() {
  return canvasTexture(1024, 576, (ctx, w, h) => {
    ctx.fillStyle = '#0D171C'
    ctx.fillRect(0, 0, w, h)

    // Soft horizon light — same-family teal only.
    const glow = ctx.createRadialGradient(w * 0.55, h * 0.62, 10, w * 0.55, h * 0.62, w * 0.6)
    glow.addColorStop(0, 'rgba(11,131,140,0.6)')
    glow.addColorStop(1, 'rgba(11,131,140,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, w, h)

    // Layered ridgelines: an abstract "game world".
    const ridges = [
      { y: 0.6, amp: 40, color: '#1A3238' },
      { y: 0.71, amp: 30, color: '#132A30' },
      { y: 0.82, amp: 22, color: '#0E1E23' },
    ]
    ridges.forEach((r, i) => {
      ctx.beginPath()
      ctx.moveTo(0, h)
      for (let x = 0; x <= w; x += 8) {
        const y = h * r.y + Math.sin(x * 0.011 + i * 1.7) * r.amp + Math.sin(x * 0.031 + i) * r.amp * 0.35
        ctx.lineTo(x, y)
      }
      ctx.lineTo(w, h)
      ctx.closePath()
      ctx.fillStyle = r.color
      ctx.fill()
    })

    // Perspective floor lines.
    ctx.strokeStyle = 'rgba(56,221,232,0.10)'
    ctx.lineWidth = 1.5
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath()
      ctx.moveTo(w / 2 + i * 18, h * 0.86)
      ctx.lineTo(w / 2 + i * 120, h)
      ctx.stroke()
    }

    // LIVE badge.
    pill(ctx, 36, 34, 104, 40, 10)
    ctx.fillStyle = PALETTE.signal
    ctx.fill()
    ctx.fillStyle = PALETTE.obsidian
    ctx.font = `700 22px ${DISPLAY}`
    ctx.textBaseline = 'middle'
    ctx.fillText('● LIVE', 52, 55)

    // Facecam frame with an abstract silhouette.
    const fx = w - 250
    const fy = h - 196
    pill(ctx, fx, fy, 214, 160, 16)
    ctx.fillStyle = '#16232A'
    ctx.fill()
    ctx.strokeStyle = 'rgba(243,241,233,0.25)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#2A3A42'
    ctx.beginPath()
    ctx.arc(fx + 107, fy + 66, 30, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(fx + 107, fy + 160, 66, 52, 0, Math.PI, 0)
    ctx.fill()

    // Scanline texture for a broadcast feel.
    ctx.fillStyle = 'rgba(255,255,255,0.018)'
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1)
  })
}

export type InteractionKind = 'chat' | 'voice' | 'sound' | 'media'

export interface EngineMessage {
  user: string
  text: string
  kind: InteractionKind
}

/** Sample interactions that orbit the core. Fictional handles. */
export const ENGINE_MESSAGES: EngineMessage[] = [
  { user: 'nova_frames', text: 'that clutch was unreal', kind: 'chat' },
  { user: 'kitecat', text: 'voice message · 0:06', kind: 'voice' },
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

export function makeMessageTexture(message: EngineMessage) {
  return canvasTexture(640, 168, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    // Avatar disc.
    ctx.fillStyle = KIND_COLOR[message.kind]
    ctx.beginPath()
    ctx.arc(70, h / 2, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = PALETTE.obsidian
    ctx.font = `700 34px ${DISPLAY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(message.user[0].toUpperCase(), 70, h / 2 + 2)

    ctx.textAlign = 'left'
    ctx.fillStyle = PALETTE.mist
    ctx.font = `600 26px ${BODY}`
    ctx.fillText(message.user, 128, 58)
    ctx.fillStyle = PALETTE.ivory
    ctx.font = `600 34px ${DISPLAY}`
    ctx.fillText(message.text, 128, 108)
  })
}

const ALERT_COPY: Record<InteractionKind, [string, string]> = {
  chat: ['HIGHLIGHT', 'Message pinned to stream'],
  voice: ['VOICE', 'Message read aloud on air'],
  sound: ['SOUND', 'HYPE pad played'],
  media: ['MEDIA', 'Reaction clip on screen'],
}

export function makeAlertTexture(kind: InteractionKind) {
  return canvasTexture(768, 168, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    pill(ctx, 4, 4, w - 8, h - 8, 28)
    ctx.fillStyle = 'rgba(8,12,15,0.92)'
    ctx.fill()
    ctx.lineWidth = 4
    ctx.strokeStyle = KIND_COLOR[kind]
    ctx.stroke()
    // Accent stripe.
    pill(ctx, 28, 36, 10, h - 72, 5)
    ctx.fillStyle = KIND_COLOR[kind]
    ctx.fill()
    const [title, body] = ALERT_COPY[kind]
    ctx.fillStyle = KIND_COLOR[kind]
    ctx.font = `700 30px ${DISPLAY}`
    ctx.textBaseline = 'middle'
    ctx.fillText(title, 64, 62)
    ctx.fillStyle = PALETTE.ivory
    ctx.font = `600 34px ${BODY}`
    ctx.fillText(body, 64, 112)
  })
}

export function makePadLabelTexture(label: string) {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = PALETTE.ivory
    const size = label.length > 4 ? 46 : 64
    ctx.font = `700 ${size}px ${DISPLAY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, w / 2, h / 2 + 4)
  })
}

export const padLabels = () => SOUND_PADS.map((p) => makePadLabelTexture(p.label))

/** Three abstract "media" pieces standing in for GIFs and clips. */
export function makeMediaTextures() {
  const rings = canvasTexture(512, 384, (ctx, w, h) => {
    ctx.fillStyle = '#121C21'
    ctx.fillRect(0, 0, w, h)
    for (let i = 7; i > 0; i--) {
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.55, i * 26, 0, Math.PI * 2)
      ctx.strokeStyle = i % 2 ? PALETTE.signal : PALETTE.ivory
      ctx.globalAlpha = 0.25 + (7 - i) * 0.1
      ctx.lineWidth = 7
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  })

  const type = canvasTexture(512, 384, (ctx, w, h) => {
    ctx.fillStyle = PALETTE.ivory
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = PALETTE.obsidian
    ctx.font = `700 200px ${DISPLAY}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('GG', w / 2, h / 2 + 10)
    ctx.fillStyle = PALETTE.signal
    ctx.fillRect(w * 0.2, h * 0.8, w * 0.6, 12)
  })

  const burst = canvasTexture(512, 384, (ctx, w, h) => {
    ctx.fillStyle = '#0D2A2E'
    ctx.fillRect(0, 0, w, h)
    ctx.translate(w / 2, h / 2)
    for (let i = 0; i < 16; i++) {
      ctx.rotate((Math.PI * 2) / 16)
      ctx.fillStyle = i % 2 ? PALETTE.mint : PALETTE.cyan
      ctx.globalAlpha = 0.85
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(220, -18)
      ctx.lineTo(220, 18)
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = '#0D2A2E'
    ctx.beginPath()
    ctx.arc(0, 0, 64, 0, Math.PI * 2)
    ctx.fill()
  })

  return [rings, type, burst]
}

/** Face of the floating voice module. */
export function makeVoicePanelTexture() {
  return canvasTexture(1024, 576, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = PALETTE.cyan
    ctx.font = `700 34px ${DISPLAY}`
    ctx.textBaseline = 'middle'
    ctx.fillText('VOICE MESSAGE', 64, 76)
    ctx.fillStyle = PALETTE.mist
    ctx.font = `500 30px ${BODY}`
    ctx.fillText('from kitecat', 64, 124)
    ctx.fillStyle = PALETTE.ivory
    ctx.font = `600 52px ${DISPLAY}`
    ctx.fillText('“Run it back one', 64, 210)
    ctx.fillText('more time!”', 64, 272)
    // Playhead track.
    pill(ctx, 64, h - 92, w - 128, 8, 4)
    ctx.fillStyle = 'rgba(164,176,182,0.3)'
    ctx.fill()
    pill(ctx, 64, h - 92, (w - 128) * 0.38, 8, 4)
    ctx.fillStyle = PALETTE.cyan
    ctx.fill()
  })
}
