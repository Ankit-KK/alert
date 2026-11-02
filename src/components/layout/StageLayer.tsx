import { lazy, Suspense, useEffect, useState, type RefObject } from 'react'
import { getCapabilities } from '@/lib/three/capabilities'
import { sceneStore } from '@/lib/three/sceneStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { StaticStage } from '@/components/three/StaticStage'
import { StageErrorBoundary } from './StageErrorBoundary'

// three.js + R3F live in their own chunks and load after first paint.
const Stage = lazy(() => import('@/components/three/Stage'))

/**
 * Load hand-off. The two stages are different compositions, so they never
 * cross-dissolve: the static stage clears first, then the canvas fades up.
 */
const STATIC_OUT_MS = 300
const STAGE_IN_DELAY_MS = 250
const STAGE_IN_MS = 700

/**
 * Fixed background layer: the WebGL stage (or its static fallback) plus the
 * readability layers the scene director drives. Rendered at the app root,
 * outside any transformed ancestor, and never interactive.
 *
 * The 3D stage is optional decoration. If its chunk fails to load, WebGL
 * can't start, or frames stay too slow, it is dropped for the static stage
 * and the rest of the page carries on.
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
  const [failure, setFailure] = useState<'error' | 'slow' | null>(null)
  const [mountStage, setMountStage] = useState(false)
  const [staticDone, setStaticDone] = useState(false)
  const live = ready && !failure

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
    if (live) document.documentElement.dataset.stage = 'ready'
    return () => {
      delete document.documentElement.dataset.stage
    }
  }, [live])

  // Once the canvas has faded up the static stage is never seen again, so it
  // unmounts (with its animations and observers). It comes back if the 3D does not last.
  useEffect(() => {
    if (!live) return
    const id = window.setTimeout(() => setStaticDone(true), STATIC_OUT_MS + STAGE_IN_DELAY_MS + STAGE_IN_MS + 100)
    return () => window.clearTimeout(id)
  }, [live])

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

  const fail = (reason: 'error' | 'slow') => {
    sceneStore.ready = false
    setFailure(reason)
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      data-fallback={failure ?? (caps.software && !caps.webgl ? 'software' : undefined)}
    >
      {(!live || !staticDone) && <StaticStage visible={!live} fadeMs={live ? STATIC_OUT_MS : 700} />}
      {mountStage && !failure && (
        <div
          className="absolute inset-0"
          style={{ opacity: live ? 1 : 0, transition: `opacity ${STAGE_IN_MS}ms ease-out ${STAGE_IN_DELAY_MS}ms` }}
        >
          <StageErrorBoundary onError={() => fail('error')}>
            <Suspense fallback={null}>
              <Stage
                tier={caps.tier}
                reduced={reduced}
                parallax={!caps.coarsePointer}
                budget={!caps.forced}
                onReady={() => setReady(true)}
                onFallback={() => fail('slow')}
              />
            </Suspense>
          </StageErrorBoundary>
        </div>
      )}
      {/*
        Readability layers. The director writes their opacities, and the veil's
        solid width (--veil-edge: the measured text column plus a little), so
        it covers the copy exactly and has faded out where the subject begins.
        Below md the layout is a single column; the director dims content
        sections there instead.
      */}
      <div
        ref={veilRef}
        className="absolute inset-0 hidden md:block"
        style={{
          opacity: 0,
          backgroundImage:
            'linear-gradient(90deg, #080C0F var(--veil-edge, 40%), rgba(8,12,15,0) calc(var(--veil-edge, 40%) + 48px))',
        }}
      />
      <div ref={dimRef} className="absolute inset-0 bg-obsidian" style={{ opacity: 0 }} />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-obsidian to-transparent" />
    </div>
  )
}
