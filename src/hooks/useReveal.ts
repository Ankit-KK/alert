import { useLayoutEffect, type RefObject } from 'react'
import { gsap } from '@/lib/motion/gsap'
import { useReducedMotion } from './useReducedMotion'

/**
 * Scroll-entry reveal for `[data-reveal]` children of a section. One tween per
 * section, scoped with gsap.context so it is fully reverted on unmount.
 *
 * Only opacity and y are animated — never visibility — so content waiting to
 * be revealed stays in the tab order and the accessibility tree. If focus
 * lands inside the section before its trigger fires (keyboard, screen reader,
 * find-in-page), the reveal completes at once so a focus ring is never drawn
 * on invisible content. With reduced motion nothing is hidden at all.
 */
export function useReveal(scope: RefObject<HTMLElement | null>, start = 'top 72%') {
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    const el = scope.current
    if (reduced || !el) return
    let reveal: (() => void) | undefined
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('[data-reveal]')
      if (items.length === 0) return
      const tween = gsap.from(items, {
        y: 36,
        opacity: 0,
        duration: 0.9,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start, once: true },
      })
      reveal = () => {
        tween.progress(1)
        tween.scrollTrigger?.kill(false, true)
      }
    }, scope)
    const onFocusIn = () => reveal?.()
    el.addEventListener('focusin', onFocusIn)
    return () => {
      el.removeEventListener('focusin', onFocusIn)
      ctx.revert()
    }
  }, [scope, reduced, start])
}
