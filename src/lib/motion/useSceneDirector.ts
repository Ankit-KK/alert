import { useEffect, useRef, type RefObject } from 'react'
import { ScrollTrigger } from './gsap'
import {
  DESKTOP_SHOTS,
  MOBILE_SHOTS,
  fovFor,
  frameShot,
  isMobileLayout,
  lerpRig,
  reducedShots,
  type Region,
  type Shot,
} from './keyframes'
import { sceneStore, type RigState } from '@/lib/three/sceneStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { SectionId } from '@/content/site'

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

const REDUCED_DESKTOP = reducedShots(DESKTOP_SHOTS)
const REDUCED_MOBILE = reducedShots(MOBILE_SHOTS)

/** Clear space between the hero copy's last glyph or button and the hero subject (px). */
const HERO_CLEARANCE = 48
/** Clear space between a section's text column and its subject (px). */
const COLUMN_GAP = 64
/**
 * Narrowest share of the viewport a column subject may be fitted into. A text
 * column that leaves less (e.g. Features on a portrait tablet) keeps the stage
 * covered for that section rather than showing a cropped sliver of the subject.
 */
const MIN_COLUMN_SHARE = 0.3
/** Shortest band above the hero eyebrow worth framing the engine into (px). Below it the hero has no stage. */
const MIN_HERO_BAND = 110
/** The veil stays solid this far past the text column, then fades out before the subject region begins. */
const VEIL_PAD = 16

interface Layout {
  vw: number
  vh: number
  /** Bottom of the fixed header. */
  nav: number
  /** Side margin subjects keep from the viewport edges. */
  edge: number
  /** Beside the hero copy, in viewport px (the hero is at the top of the page). */
  heroBeside: Region
  /** Above the hero eyebrow, in document px; it scrolls away with the copy. */
  heroBand: Region
  heroMode: 'beside' | 'band' | 'none'
  /** Right edge of each section's text column (the hero's is its rightmost glyph or button). */
  columns: Partial<Record<SectionId, number>>
  slot: HTMLElement | null
}

/** Rightmost painted glyph inside `el`. Block boxes span the whole column; glyphs don't. */
function textRight(el: Element | null) {
  let right = 0
  if (!el) return right
  const range = document.createRange()
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    if (!walker.currentNode.textContent?.trim()) continue
    range.selectNodeContents(walker.currentNode)
    for (const r of range.getClientRects()) right = Math.max(right, r.right)
  }
  return right
}

/** Document-space top of `el`, ignoring any translate an entrance animation has applied to it. */
function layoutTop(el: Element) {
  const t = getComputedStyle(el).transform
  const shift = t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0
  return el.getBoundingClientRect().top + window.scrollY - shift
}

/** Shrinks `r` about its centre to `fill` of its size, and to at most `maxW`×`maxH`. */
function cap(r: Region, maxW: number, maxH: number, fill = 1): Region {
  const w = Math.min((r.right - r.left) * fill, maxW)
  const h = Math.min((r.bottom - r.top) * fill, maxH)
  const cx = (r.left + r.right) / 2
  const cy = (r.top + r.bottom) / 2
  return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 }
}

/** Scale (px per world unit) at which `s` fits `r`. */
const fitScale = (r: Region, s: Shot) => Math.min((r.right - r.left) / (2 * s.extent[0]), (r.bottom - r.top) / (2 * s.extent[1]))

const capHero = (r: Region, vw: number, vh: number) => cap(r, vw * 0.5, vh * 0.78)

function measureLayout(): Layout {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const nav = document.querySelector('header')?.getBoundingClientRect().bottom ?? 72
  const edge = Math.max(16, vw * 0.025)

  const hero = document.getElementById('top')
  let copyRight = 0
  if (hero) {
    for (const sel of ['[data-hero-eyebrow]', 'h1', '[data-hero-copy]']) copyRight = Math.max(copyRight, textRight(hero.querySelector(sel)))
    hero.querySelectorAll('[data-hero-cta] > *').forEach((b) => (copyRight = Math.max(copyRight, b.getBoundingClientRect().right)))
  }
  const eyebrow = hero?.querySelector('[data-hero-eyebrow]') ?? hero?.querySelector('h1')
  const eyebrowTop = eyebrow ? layoutTop(eyebrow) : vh * 0.45

  const heroBeside: Region = { left: copyRight + HERO_CLEARANCE, right: vw - edge, top: nav + 8, bottom: vh - 32 }
  const heroBand: Region = { left: edge, right: vw - edge, top: nav + 4, bottom: eyebrowTop - 20 }
  const shot = DESKTOP_SHOTS.top
  let heroMode: Layout['heroMode'] =
    !isMobileLayout(vw) && fitScale(capHero(heroBeside, vw, vh), shot) >= fitScale(heroBand, shot) ? 'beside' : 'band'
  if (heroMode === 'band' && heroBand.bottom - heroBand.top < MIN_HERO_BAND) heroMode = 'none'

  const columns: Layout['columns'] = { top: copyRight }
  document.querySelectorAll<HTMLElement>('section[data-scene]').forEach((s) => {
    const column = s.querySelector('h2')?.parentElement
    if (column) columns[s.id as SectionId] = column.getBoundingClientRect().right
  })

  return { vw, vh, nav, edge, heroBeside, heroBand, heroMode, columns, slot: document.querySelector<HTMLElement>('[data-brand-mark]') }
}

/** The screen region `shot` is fitted into right now, whether it follows the page scroll, and any extra dim. */
function regionFor(shot: Shot, id: SectionId, L: Layout): { region: Region; tracked: boolean; dim: number } {
  const { vw, vh, nav, edge } = L
  switch (shot.region) {
    case 'hero': {
      if (L.heroMode === 'beside') return { region: capHero(L.heroBeside, vw, vh), tracked: false, dim: 0 }
      // Above the eyebrow, scrolling away with the copy. On short phones the
      // copy fills the screen and there is no room for the engine anywhere, so
      // the hero goes without rather than drawing it behind text.
      const y = window.scrollY
      const band = { ...L.heroBand, top: L.heroBand.top - y, bottom: L.heroBand.bottom - y }
      return { region: band, tracked: true, dim: L.heroMode === 'none' ? 1 : 0 }
    }
    case 'column': {
      const right = vw - edge
      const clear = (L.columns[id] ?? vw * 0.45) + COLUMN_GAP
      const left = Math.min(clear, right - vw * MIN_COLUMN_SHARE)
      return { region: cap({ left, right, top: nav + 8, bottom: vh - 32 }, vw * 0.4, vh * 0.7, 0.92), tracked: false, dim: left < clear ? 1 : 0 }
    }
    case 'slot': {
      const r = L.slot?.getBoundingClientRect()
      if (!r) return { region: cap({ left: 0, right: vw, top: vh * 0.15, bottom: vh * 0.45 }, vh * 0.3, vh * 0.3), tracked: false, dim: 0 }
      // The slot is as wide as the flat stand-in mark; the 3D mark and halo
      // fill its height. In the brand moment itself the mark stays out from
      // under the header, shrinking to the part of the slot below it (short
      // landscape screens); arriving and leaving with the neighbouring
      // sections it keeps its full size.
      const h = id === 'story' ? Math.max(24, Math.min(r.height, r.bottom - (nav + 8))) : r.height
      const cx = (r.left + r.right) / 2
      return { region: { left: cx - h / 2, right: cx + h / 2, top: r.bottom - h, bottom: r.bottom }, tracked: true, dim: 0 }
    }
  }
}

const makeRig = (): RigState => ({ cam: [0, 0, 0], target: [0, 0, 0], sep: 0, focus: [0, 0, 0], dim: 0, veil: 0, solo: 0 })

/**
 * Drives the shared 3D stage from page scroll.
 *
 * Every `<section data-scene>` contributes one shot (see keyframes.ts). A
 * single ScrollTrigger spanning the document re-measures section centres and
 * the layout the shots are framed against on refresh (resize, font load,
 * layout change) and, on every scroll update, frames the two shots whose
 * sections straddle the viewport centre and blends them. The result is
 * deterministic for any scroll position, including jumps from nav links, so
 * there are no ordering issues between overlapping scrubbed tweens.
 *
 * It also writes the readability layers: the dim layer's opacity, the veil's
 * opacity and solid width (`--veil-edge`, from the measured text column), and,
 * on the stage layer, the hero band the static fallback is placed in
 * (`--hero-band-*`).
 */
export function useSceneDirector(options: {
  dimRef: RefObject<HTMLDivElement | null>
  veilRef: RefObject<HTMLDivElement | null>
  onActiveChange?: (id: SectionId) => void
}) {
  const { dimRef, veilRef } = options
  const reduced = useReducedMotion()
  const onActiveRef = useRef(options.onActiveChange)
  useEffect(() => {
    onActiveRef.current = options.onActiveChange
  })

  useEffect(() => {
    let ids: SectionId[] = []
    let anchors: number[] = []
    let layout: Layout | null = null
    let active: SectionId | null = null
    let covered = false
    let veilEdge = -1
    let bandShift = 1
    const rigA = makeRig()
    const rigB = makeRig()

    const measure = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-scene]'))
      ids = sections.map((s) => s.id as SectionId)
      anchors = sections.map((s) => {
        const r = s.getBoundingClientRect()
        return r.top + window.scrollY + Math.min(r.height, window.innerHeight * 1.6) / 2
      })
      layout = measureLayout()

      // The static fallback frames its hero composition into the same band on phones.
      const layer = veilRef.current?.parentElement
      if (layer) {
        const band = layout.heroBand
        layer.style.setProperty('--hero-band-top', `${band.top.toFixed(1)}px`)
        layer.style.setProperty('--hero-band-h', `${Math.max(0, band.bottom - band.top).toFixed(1)}px`)
        layer.style.setProperty('--hero-band-show', layout.heroMode === 'none' ? '0' : '1')
        bandShift = 1
      }
    }

    const update = () => {
      const L = layout
      if (anchors.length === 0 || !L) return
      const mobile = isMobileLayout(L.vw)
      const shots = reduced ? (mobile ? REDUCED_MOBILE : REDUCED_DESKTOP) : mobile ? MOBILE_SHOTS : DESKTOP_SHOTS
      const fov = fovFor(L.vw)
      const centre = window.scrollY + window.innerHeight / 2

      let k = 0
      while (k < anchors.length - 2 && centre >= anchors[k + 1]) k++
      const span = anchors[k + 1] - anchors[k]
      const raw = span > 0 ? (centre - anchors[k]) / span : 0
      // Hold each shot while its section is centred, travel in between.
      const t = smoothstep(0.18, 0.82, raw)

      const idA = ids[k]
      const idB = ids[Math.min(k + 1, ids.length - 1)]
      const a = shots[idA]
      const b = shots[idB]
      if (a && b) {
        const ra = regionFor(a, idA, L)
        const rb = regionFor(b, idB, L)
        frameShot(a, ra.region, L.vw, L.vh, fov, rigA)
        frameShot(b, rb.region, L.vw, L.vh, fov, rigB)
        rigA.dim = Math.max(rigA.dim, ra.dim)
        rigB.dim = Math.max(rigB.dim, rb.dim)
        lerpRig(rigA, rigB, t, sceneStore.rig)
        // Big fades cover early and reveal late, so a half-dimmed stage never
        // sits behind copy that is arriving or leaving.
        const dd = rigB.dim - rigA.dim
        if (Math.abs(dd) > 0.3) sceneStore.rig.dim = rigA.dim + dd * smoothstep(dd > 0 ? 0.25 : 0.38, dd > 0 ? 0.7 : 0.88, raw)
        sceneStore.track = (ra.tracked ? 1 - t : 0) + (rb.tracked ? t : 0)

        const edgeA = L.columns[idA] ?? L.vw * 0.45
        const edgeB = L.columns[idB] ?? L.vw * 0.45
        const edge = Math.round(edgeA + (edgeB - edgeA) * t + VEIL_PAD)
        if (veilRef.current && edge !== veilEdge) {
          veilEdge = edge
          veilRef.current.style.setProperty('--veil-edge', `${edge}px`)
        }
      }

      if (dimRef.current) dimRef.current.style.opacity = sceneStore.rig.dim.toFixed(3)
      if (veilRef.current) veilRef.current.style.opacity = sceneStore.rig.veil.toFixed(3)
      // Keeps the static fallback's hero band attached to the hero copy; stops once it has scrolled away.
      const shift = -Math.round(Math.min(window.scrollY, L.heroBand.bottom + 40))
      const layer = veilRef.current?.parentElement
      if (layer && shift !== bandShift) {
        bandShift = shift
        layer.style.setProperty('--hero-band-shift', `${shift}px`)
      }

      // No point rendering a stage nobody can see.
      const nowCovered = sceneStore.rig.dim > 0.995
      if (nowCovered !== covered) {
        covered = nowCovered
        sceneStore.setCovered?.(covered)
      }
      // Reduced motion renders on demand: draw the new framing.
      if (reduced && !covered) sceneStore.invalidate?.(2)

      const next = raw < 0.5 ? ids[k] : ids[k + 1]
      if (next && next !== active) {
        active = next
        onActiveRef.current?.(next)
      }
    }

    const refresh = () => {
      measure()
      update()
    }
    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: update,
      onRefresh: refresh,
    })
    refresh()

    // Sections can change height without a window resize (fonts, images,
    // interactive panels), so watch them directly. Web fonts also change the
    // hero copy's width, which the hero framing is measured from.
    let pending = 0
    let live = true
    const schedule = () => {
      window.clearTimeout(pending)
      pending = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    }
    const ro = new ResizeObserver(schedule)
    document.querySelectorAll('section[data-scene]').forEach((s) => ro.observe(s))
    document.fonts?.ready.then(() => live && refresh())

    return () => {
      live = false
      window.clearTimeout(pending)
      ro.disconnect()
      trigger.kill()
    }
  }, [dimRef, veilRef, reduced])
}
