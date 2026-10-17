import { useLayoutEffect, useRef } from 'react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { HERO } from '@/content/site'
import { gsap } from '@/lib/motion/gsap'
import { sceneStore } from '@/lib/three/sceneStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Section 01 — cinematic hero.
 *
 * Entrance (≈1.6s, never blocks interaction):
 *   0.00  stage reveal begins (sceneStore.intro 0 → 1, read by the 3D engine)
 *   0.20  headline lines rise out of their masks
 *   0.65  supporting copy
 *   0.85  calls to action
 *   1.10  scroll cue; engine settles into its idle loop
 */
export function Hero() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced) {
      sceneStore.intro = 1
      return
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
      tl.to(sceneStore, { intro: 1, duration: 2.2, ease: 'power3.out' }, 0)
        .from('[data-hero-line] > span', { yPercent: 105, duration: 1.1, stagger: 0.09 }, 0.2)
        .from('[data-hero-eyebrow]', { autoAlpha: 0, y: 12, duration: 0.8 }, 0.3)
        .from('[data-hero-copy]', { autoAlpha: 0, y: 20, duration: 0.9 }, 0.65)
        .from('[data-hero-cta] > *', { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.08 }, 0.85)
        .from('[data-hero-cue]', { autoAlpha: 0, duration: 0.8 }, 1.1)
    }, root)
    return () => {
      ctx.revert()
      sceneStore.intro = 1
    }
  }, [reduced])

  return (
    <section
      id="top"
      ref={root}
      data-scene
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col justify-end px-4 pt-28 pb-24 sm:px-6 md:justify-center md:pb-16 lg:px-10"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <p data-hero-eyebrow className="eyebrow mb-5 flex items-center gap-2.5">
          <span className="animate-live inline-block h-2 w-2 rounded-full bg-signal" aria-hidden="true" />
          {HERO.eyebrow}
        </p>
        <h1 id="hero-title" className="display-xl max-w-[11ch] uppercase md:max-w-[12ch]">
          {HERO.headline.map((line, i) => (
            <span key={line} data-hero-line className="block overflow-hidden pb-[0.06em]">
              <span className={`block ${i === 1 ? 'text-cyan' : ''}`}>{line}</span>
            </span>
          ))}
        </h1>
        <p data-hero-copy className="lede mt-6 max-w-[34rem] md:mt-8">
          {HERO.description}
        </p>
        <div data-hero-cta className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href={HERO.primary.href} className="btn btn-primary">
            {HERO.primary.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
          <a href={HERO.secondary.href} className="btn btn-ghost">
            {HERO.secondary.label}
          </a>
        </div>
      </div>

      <a
        href="#features"
        data-hero-cue
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-mist md:flex"
        aria-label="Scroll to features"
      >
        <span className="text-xs font-medium tracking-[0.12em] uppercase">Scroll</span>
        <span className="relative h-10 w-px overflow-hidden bg-line" aria-hidden="true">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-ivory motion-safe:animate-[hc-scroll-cue_2.2s_var(--ease-out-expo)_infinite]" />
        </span>
        <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
      </a>
    </section>
  )
}
