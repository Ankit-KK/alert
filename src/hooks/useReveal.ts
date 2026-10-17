import { useLayoutEffect, type RefObject } from 'react'
import { gsap } from '@/lib/motion/gsap'
import { useReducedMotion } from './useReducedMotion'

/**
 * Scroll-entry reveal for `[data-reveal]` children of a section. One timeline
 * per section, scoped with gsap.context so it is fully reverted on unmount.
 * Content is visible by default; the animation only runs when motion is OK.
 */
export function useReveal(scope: RefObject<HTMLElement | null>, start = 'top 72%') {
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    if (reduced || !scope.current) return
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]')
      if (items.length === 0) return
      gsap.from(items, {
        y: 36,
        autoAlpha: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: scope.current, start, once: true },
      })
    }, scope)
    return () => ctx.revert()
  }, [scope, reduced, start])
}
