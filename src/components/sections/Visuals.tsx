import { useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { VisualStateDemo } from '@/components/interactive/VisualStateDemo'

/** Section 05 — visual interactions (phase F: the camera rises to the media frames). */
export function Visuals() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  return (
    <section
      id="visuals"
      ref={root}
      data-scene
      aria-labelledby="visuals-title"
      className="relative px-4 py-28 sm:px-6 md:py-40 lg:px-10"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-3xl">
          <p data-reveal className="eyebrow mb-5">
            Visuals
          </p>
          <h2 id="visuals-title" data-reveal className="display-lg uppercase">
            Make the moment visible.
          </h2>
          <p data-reveal className="lede mt-6">
            GIFs, media, and stream overlays turn a reaction into something your whole audience can see.
          </p>
        </div>
        <div data-reveal className="mt-14 md:mt-20">
          <VisualStateDemo />
        </div>
      </div>
    </section>
  )
}
