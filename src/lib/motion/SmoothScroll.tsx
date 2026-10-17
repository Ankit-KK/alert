import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface SmoothScrollApi {
  /** Scroll to `#id` (or top for `#top`) and move focus to the target for keyboard/AT users. */
  scrollToHash: (hash: string) => void
  /** Freeze page scrolling, e.g. while the mobile menu is open. */
  lock: () => void
  unlock: () => void
}

const SmoothScrollContext = createContext<SmoothScrollApi | null>(null)

/**
 * The page's single scroll authority.
 *
 * Lenis smooths native window scrolling and is ticked from GSAP's ticker so
 * ScrollTrigger and Lenis share one animation loop. With reduced motion,
 * Lenis is never created and the browser's native scrolling is used as-is.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (reduced) return

    const lenis = new Lenis({ lerp: 0.11, smoothWheel: true, autoRaf: false })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [reduced])

  // Web fonts change text metrics; re-measure every trigger once they land.
  useEffect(() => {
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh()
    })
    return () => {
      cancelled = true
    }
  }, [])

  const scrollToHash = useCallback(
    (hash: string) => {
      const target = hash === '#top' ? null : document.querySelector<HTMLElement>(hash)
      if (hash !== '#top' && !target) return

      const focusTarget = () => {
        const el = target ?? document.getElementById('top')
        if (!el) return
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
        el.focus({ preventScroll: true })
      }

      if (window.location.hash !== hash) history.pushState(null, '', hash)

      const lenis = lenisRef.current
      if (lenis) {
        lenis.scrollTo(target ?? 0, { duration: 1.4, onComplete: focusTarget })
      } else {
        if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
        else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
        focusTarget()
      }
    },
    [reduced],
  )

  // One delegated handler gives every in-page link the same behaviour.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]')
      if (!anchor) return
      const hash = anchor.getAttribute('href')
      if (!hash || hash === '#') return
      event.preventDefault()
      scrollToHash(hash)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [scrollToHash])

  const api = useMemo<SmoothScrollApi>(
    () => ({
      scrollToHash,
      lock: () => {
        lenisRef.current?.stop()
        document.documentElement.style.overflow = 'hidden'
      },
      unlock: () => {
        document.documentElement.style.overflow = ''
        lenisRef.current?.start()
      },
    }),
    [scrollToHash],
  )

  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSmoothScroll(): SmoothScrollApi {
  const ctx = useContext(SmoothScrollContext)
  if (!ctx) throw new Error('useSmoothScroll must be used inside SmoothScrollProvider')
  return ctx
}
