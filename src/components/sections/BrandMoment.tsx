import { useLayoutEffect, useRef } from 'react'
import { LogoMark } from '@/components/brand/Logo'
import { gsap } from '@/lib/motion/gsap'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * Section 08 — full-screen brand moment. The stage goes brand-solo (phase H):
 * the engine folds away and the extruded HC mark rises, large, behind the
 * giant type. The flat mark above the heading is the stand-in for when the 3D
 * stage isn't running, and fades out once it is. Type is sticky inside a
 * taller section; its two statements are scrubbed in sequence. The sticky
 * element is plain CSS — no ScrollTrigger pin.
 */
export function BrandMoment() {
  const root = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced || !root.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'bottom bottom', scrub: 0.6 },
      })
      tl.from('[data-brand-mark]', { autoAlpha: 0, scale: 0.8, duration: 0.6 })
        .from('[data-brand-a] > span', { yPercent: 60, autoAlpha: 0, stagger: 0.12, duration: 1 }, 0.1)
        .from('[data-brand-b]', { yPercent: 40, autoAlpha: 0, duration: 1 }, 0.9)
        .to({}, { duration: 0.6 })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="story" ref={root} data-scene aria-labelledby="story-title" className="relative md:min-h-[190svh]">
      <div className="flex min-h-svh flex-col items-center justify-center px-4 py-28 text-center sm:px-6 md:sticky md:top-0 md:h-svh md:py-0">
        {/* Sized to hold the 3D mark, which the stage frames into this slot. */}
        <span data-brand-mark className="mb-6 flex h-28 items-center justify-center md:mb-4 md:h-[200px]">
          <span className="brand-flat-mark block transition-opacity duration-700">
            <LogoMark height={64} className="h-12 w-auto sm:h-16" />
          </span>
        </span>
        <h2 id="story-title" className="font-display leading-[0.9] font-bold tracking-[-0.04em] uppercase">
          <span data-brand-a className="block text-[clamp(2.75rem,11vw,11rem)]">
            <span className="inline-block">Every stream</span> <span className="inline-block">has a story.</span>
          </span>
          <span data-brand-b className="mt-6 block text-[clamp(1.5rem,4.6vw,4.25rem)] tracking-[-0.03em] text-cyan">
            Make yours unforgettable.
          </span>
        </h2>
      </div>
    </section>
  )
}
