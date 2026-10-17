import { useRef } from 'react'
import { useReveal } from '@/hooks/useReveal'
import { SoundDeck } from '@/components/interactive/SoundDeck'

/** Section 04 — soundboard. The 3D pad station mirrors this deck (phase E). */
export function Soundboard() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  return (
    <section
      id="soundboard"
      ref={root}
      data-scene
      aria-labelledby="soundboard-title"
      className="relative px-4 py-28 sm:px-6 md:py-40 lg:px-10"
    >
      <div className="mx-auto grid max-w-[1440px] gap-12 md:grid-cols-12">
        <div className="md:col-span-6 lg:col-span-5">
          <p data-reveal className="eyebrow mb-5">
            Soundboard
          </p>
          <h2 id="soundboard-title" data-reveal className="display-lg uppercase">
            Your stream has a soundtrack.
          </h2>
          <p data-reveal className="lede mt-6">
            Give your community a set of sounds to react with — hype moments, big plays, and inside jokes, played right into the stream.
          </p>
          <div data-reveal className="mt-10">
            <SoundDeck />
          </div>
        </div>
      </div>
    </section>
  )
}
