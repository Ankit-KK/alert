import { useEffect, useRef, type RefObject } from 'react'
import { ScrollTrigger } from './gsap'
import { DESKTOP_KEYFRAMES, MOBILE_KEYFRAMES, isMobileAspect, lerpRig } from './keyframes'
import { sceneStore } from '@/lib/three/sceneStore'
import type { SectionId } from '@/content/site'

const smoothstep = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

/**
 * Drives the shared 3D stage from page scroll.
 *
 * Every `<section data-scene>` contributes one keyframe (see keyframes.ts). A
 * single ScrollTrigger spanning the document re-measures section centres on
 * refresh (resize, font load, layout change) and, on every scroll update,
 * blends the two keyframes whose sections straddle the viewport centre. The
 * result is deterministic for any scroll position, including jumps from nav
 * links, so there are no ordering issues between overlapping scrubbed tweens.
 */
export function useSceneDirector(options: {
  dimRef: RefObject<HTMLDivElement | null>
  veilRef: RefObject<HTMLDivElement | null>
  onActiveChange?: (id: SectionId) => void
}) {
  const { dimRef, veilRef } = options
  const onActiveRef = useRef(options.onActiveChange)
  useEffect(() => {
    onActiveRef.current = options.onActiveChange
  })

  useEffect(() => {
    let ids: SectionId[] = []
    let anchors: number[] = []
    let active: SectionId | null = null
    let covered = false

    const measure = () => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>('section[data-scene]'))
      ids = sections.map((s) => s.id as SectionId)
      anchors = sections.map((s) => {
        const r = s.getBoundingClientRect()
        return r.top + window.scrollY + Math.min(r.height, window.innerHeight * 1.6) / 2
      })
    }

    const update = () => {
      if (anchors.length === 0) return
      const keyframes = isMobileAspect(window.innerWidth, window.innerHeight) ? MOBILE_KEYFRAMES : DESKTOP_KEYFRAMES
      const centre = window.scrollY + window.innerHeight / 2

      let k = 0
      while (k < anchors.length - 2 && centre >= anchors[k + 1]) k++
      const span = anchors[k + 1] - anchors[k]
      const raw = span > 0 ? (centre - anchors[k]) / span : 0
      // Hold each keyframe while its section is centred, travel in between.
      const t = smoothstep(0.18, 0.82, raw)

      const from = keyframes[ids[k]]
      const to = keyframes[ids[Math.min(k + 1, ids.length - 1)]]
      if (from && to) lerpRig(from, to, t, sceneStore.rig)

      if (dimRef.current) dimRef.current.style.opacity = sceneStore.rig.dim.toFixed(3)
      if (veilRef.current) veilRef.current.style.opacity = sceneStore.rig.veil.toFixed(3)
      // No point rendering a stage nobody can see.
      const nowCovered = sceneStore.rig.dim > 0.995
      if (nowCovered !== covered) {
        covered = nowCovered
        sceneStore.setCovered?.(covered)
      }

      const next = raw < 0.5 ? ids[k] : ids[k + 1]
      if (next && next !== active) {
        active = next
        onActiveRef.current?.(next)
      }
    }

    const trigger = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: update,
      onRefresh: () => {
        measure()
        update()
      },
    })
    measure()
    update()

    // Sections can change height without a window resize (fonts, images,
    // interactive panels), so watch them directly.
    let pending = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(pending)
      pending = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    })
    document.querySelectorAll('section[data-scene]').forEach((s) => ro.observe(s))

    return () => {
      window.clearTimeout(pending)
      ro.disconnect()
      trigger.kill()
    }
  }, [dimRef, veilRef])
}
