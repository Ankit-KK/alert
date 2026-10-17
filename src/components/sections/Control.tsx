import { useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { ControlPreview } from '@/components/interactive/ControlPreview'

/**
 * Section 06 — creator control. The pace changes here: the stage pulls back
 * and dims (phase G) and a calm product interface takes the foreground.
 */
export function Control() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  return (
    <section
      id="control"
      ref={root}
      data-scene
      aria-labelledby="control-title"
      className="relative px-4 py-28 sm:px-6 md:py-40 lg:px-10"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p data-reveal className="eyebrow mb-5">
              Creator control
            </p>
            <h2 id="control-title" data-reveal className="display-lg uppercase">
              Your space. <br className="hidden sm:block" />
              Your rules.
            </h2>
          </div>
          <p data-reveal className="lede md:col-span-5 md:pb-2">
            Decide what your audience can do, how it looks on stream, and what gets reviewed before it airs.
          </p>
        </div>
        <div data-reveal className="mt-14 md:mt-16">
          <ControlPreview />
        </div>
      </div>
    </section>
  )
}
