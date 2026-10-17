import { lazy, Suspense, useEffect, useState, type RefObject } from 'react'
import { getCapabilities } from '@/lib/three/capabilities'
import { sceneStore } from '@/lib/three/sceneStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { StaticStage } from '@/components/three/StaticStage'

// three.js + R3F live in their own chunks and load after first paint.
const Stage = lazy(() => import('@/components/three/Stage'))

/**
 * Fixed background layer: the WebGL stage (or its static fallback) plus a dim
 * veil the scene director fades in under content-heavy sections. Rendered at
 * the app root, outside any transformed ancestor, and never interactive.
 */
export function StageLayer({
  dimRef,
  veilRef,
}: {
  dimRef: RefObject<HTMLDivElement | null>
  veilRef: RefObject<HTMLDivElement | null>
}) {
  const reduced = useReducedMotion()
  const [caps] = useState(getCapabilities)
  const [ready, setReady] = useState(false)
  const [mountStage, setMountStage] = useState(false)

  // Defer the 3D download until the browser is idle after first paint, and
  // until web fonts are ready so canvas-drawn labels use the brand faces.
  useEffect(() => {
    if (!caps.webgl) return
    let cancelled = false
    const start = () => {
      document.fonts?.ready.finally(() => {
        if (!cancelled) setMountStage(true)
      })
    }
    const idle = window.requestIdleCallback?.(start, { timeout: 900 }) ?? window.setTimeout(start, 200)
    return () => {
      cancelled = true
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      else window.clearTimeout(idle)
    }
  }, [caps.webgl])

  // Lets CSS hand off DOM stand-ins (e.g. the brand moment's flat mark) once the 3D stage is live.
  useEffect(() => {
    if (ready) document.documentElement.dataset.stage = 'ready'
    return () => {
      delete document.documentElement.dataset.stage
    }
  }, [ready])

  // Pointer parallax input (fine pointers only).
  useEffect(() => {
    if (caps.coarsePointer || reduced) return
    const onMove = (e: PointerEvent) => {
      sceneStore.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      sceneStore.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [caps.coarsePointer, reduced])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <StaticStage visible={!ready} />
      {mountStage && (
        <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: ready ? 1 : 0 }}>
          <Suspense fallback={null}>
            <Stage tier={caps.tier} reduced={reduced} parallax={!caps.coarsePointer} onReady={() => setReady(true)} />
          </Suspense>
        </div>
      )}
      {/* Readability layers. Opacities are written directly by the scene director. */}
      <div
        ref={veilRef}
        className="absolute inset-0 hidden bg-[linear-gradient(90deg,#080C0F_0%,rgba(8,12,15,0.97)_40%,rgba(8,12,15,0)_62%)] md:block"
        style={{ opacity: 0 }}
      />
      <div ref={dimRef} className="absolute inset-0 bg-obsidian" style={{ opacity: 0 }} />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-obsidian to-transparent" />
    </div>
  )
}
