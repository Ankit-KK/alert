import { useRef } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { FINAL_CTA } from '@/content/site'
import { useReveal } from '@/hooks/useReveal'

/** Section 09 — closing call to action over a calm, re-docked engine. */
export function FinalCta() {
  const root = useRef<HTMLElement>(null)
  useReveal(root, 'top 80%')

  return (
    <section
      id="get-started"
      ref={root}
      data-scene
      aria-labelledby="cta-title"
      className="relative flex min-h-[85svh] items-end px-4 pt-28 pb-20 sm:px-6 md:items-center lg:px-10"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="cta-title" data-reveal className="display-lg uppercase">
            {FINAL_CTA.heading}
          </h2>
          <p data-reveal className="lede mx-auto mt-6">
            {FINAL_CTA.description}
          </p>
          <div data-reveal className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={FINAL_CTA.primary.href} className="btn btn-primary">
              {FINAL_CTA.primary.label}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </a>
            <a href={FINAL_CTA.secondary.href} className="btn btn-ghost">
              {FINAL_CTA.secondary.label}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <p data-reveal className="mt-6 text-sm text-mist">
            “Get Started” opens hyperchat.space.
          </p>
        </div>
      </div>
    </section>
  )
}
