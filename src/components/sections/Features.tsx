import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { CAPABILITIES } from '@/content/site'
import { useReveal } from '@/hooks/useReveal'

/**
 * Section 02 — scroll into the experience. While this section crosses the
 * viewport the camera pushes in on the engine and the feature modules
 * separate to their stations (phase B/C in keyframes.ts). The capability
 * index doubles as an in-page table of contents.
 */
export function Features() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  return (
    <section
      id="features"
      ref={root}
      data-scene
      aria-labelledby="features-title"
      className="relative px-4 py-28 sm:px-6 md:min-h-[150svh] md:py-40 lg:px-10"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-xl rounded-3xl bg-obsidian/70 p-6 backdrop-blur-sm sm:p-8 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <p data-reveal className="eyebrow mb-5">
            The interaction engine
          </p>
          <h2 id="features-title" data-reveal className="display-lg uppercase">
            More than <br /> a message.
          </h2>
          <p data-reveal className="lede mt-6">
            Bring voices, sounds, and visuals into the moments that make a livestream worth watching.
          </p>

          <ol className="mt-12 border-t border-line" aria-label="What HyperChat brings to a stream">
            {CAPABILITIES.map((c) => (
              <li key={c.index} data-reveal className="border-b border-line">
                <a href={c.href} className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 py-5 sm:grid-cols-[3rem_9rem_1fr_auto]">
                  <span className="font-display text-sm font-semibold text-mist">{c.index}</span>
                  <span className="font-display text-2xl font-semibold tracking-tight text-ivory transition-colors group-hover:text-cyan">
                    {c.title}
                  </span>
                  <span className="col-start-2 row-start-2 mt-1 text-[0.95rem] leading-relaxed text-mist sm:col-start-3 sm:row-start-1 sm:mt-0">
                    {c.body}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="col-start-3 row-start-1 h-4 w-4 self-center text-mist transition-transform group-hover:translate-x-1 group-hover:text-cyan sm:col-start-4"
                  />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
