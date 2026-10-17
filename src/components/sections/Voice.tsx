import { useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { VoiceDemo } from '@/components/interactive/VoiceDemo'

/** Section 03 — voice experiences. The 3D voice station sits to the right (phase D). */
export function Voice() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  return (
    <section
      id="experience"
      ref={root}
      data-scene
      aria-labelledby="voice-title"
      className="relative px-4 py-28 sm:px-6 md:py-40 lg:px-10"
    >
      <div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-12">
        <div className="md:col-span-6 lg:col-span-5">
          <p data-reveal className="eyebrow mb-5">
            Voice
          </p>
          <h2 id="voice-title" data-reveal className="display-lg uppercase">
            Let every message be heard.
          </h2>
          <p data-reveal className="lede mt-6">
            Bring a new layer of expression to your stream with voice-powered interactions.
          </p>
          <div data-reveal className="mt-10">
            <VoiceDemo />
          </div>
        </div>
      </div>
    </section>
  )
}
