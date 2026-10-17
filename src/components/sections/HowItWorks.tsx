import { useRef } from 'react'
import { AudioLines, Image, Radio } from 'lucide-react'
import { STEPS } from '@/content/site'
import { useReveal } from '@/hooks/useReveal'

/** Small UI fragments that illustrate each step. Decorative; the text carries the meaning. */
function StepArt({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="rounded-2xl border border-line bg-obsidian p-4">
        <div className="h-14 rounded-lg bg-[linear-gradient(120deg,#14262C,#0B1317)]" />
        <div className="-mt-6 ml-3 grid h-12 w-12 place-items-center rounded-full border-4 border-obsidian bg-ivory font-display font-bold text-obsidian">
          Y
        </div>
        <div className="mt-2 h-2.5 w-28 rounded-full bg-ivory/80" />
        <div className="mt-2 h-2 w-40 rounded-full bg-mist/40" />
        <div className="mt-4 flex gap-2">
          <span className="h-7 flex-1 rounded-md bg-raised" />
          <span className="h-7 flex-1 rounded-md bg-raised" />
          <span className="h-7 w-10 rounded-md bg-cyan/80" />
        </div>
      </div>
    )
  }
  if (index === 1) {
    const rows = [
      { icon: AudioLines, label: 'Voice', on: true },
      { icon: Radio, label: 'Sounds', on: true },
      { icon: Image, label: 'Media', on: false },
    ]
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-obsidian p-4">
        {rows.map(({ icon: Icon, label, on }) => (
          <div key={label} className="flex items-center gap-3 rounded-lg bg-raised px-3 py-2.5">
            <Icon className="h-4 w-4 text-mist" />
            <span className="text-sm text-ivory">{label}</span>
            <span className={`ml-auto flex h-5 w-9 items-center rounded-full px-0.5 ${on ? 'justify-end bg-teal' : 'bg-line'}`}>
              <span className={`h-4 w-4 rounded-full ${on ? 'bg-ivory' : 'bg-mist'}`} />
            </span>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-[#0B1317]">
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#14262C] [clip-path:polygon(0_40%,30%_10%,55%_35%,80%_5%,100%_30%,100%_100%,0_100%)]" />
      <span className="absolute top-3 left-3 rounded-md bg-signal px-2 py-0.5 font-display text-xs font-bold text-obsidian">LIVE</span>
      <span className="absolute right-3 bottom-3 left-3 flex items-center gap-2 rounded-lg border border-cyan bg-obsidian/90 px-3 py-2">
        <span className="h-4 w-1 rounded-full bg-cyan" />
        <span className="h-2 w-24 rounded-full bg-ivory/80" />
      </span>
    </div>
  )
}

// Steps step down the page on wide screens, echoing a timeline.
const STAGGER = ['', 'md:mt-10', 'md:mt-20']

/** Section 07 — how HyperChat fits into a stream. Readable with or without motion. */
export function HowItWorks() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  return (
    <section
      id="how-it-works"
      ref={root}
      data-scene
      aria-labelledby="how-title"
      className="relative px-4 py-28 sm:px-6 md:py-40 lg:px-10"
    >
      <div className="mx-auto max-w-[1440px]">
        <p data-reveal className="eyebrow mb-5">
          How it works
        </p>
        <h2 id="how-title" data-reveal className="display-lg max-w-4xl uppercase">
          Built for the way you stream.
        </h2>

        <ol className="relative mt-16 grid gap-12 md:mt-20 md:grid-cols-3 md:gap-8">
          {/* Connecting rail */}
          <span aria-hidden="true" className="absolute top-5 right-0 left-0 hidden h-px bg-line md:block" />
          {STEPS.map((step, i) => (
            <li key={step.index} data-reveal className={`relative flex flex-col ${STAGGER[i]}`}>
              <span
                className={`relative z-10 grid h-10 w-10 place-items-center rounded-full border font-display text-sm font-bold ${
                  i === 2 ? 'border-signal bg-signal text-obsidian' : 'border-line bg-graphite text-ivory'
                }`}
                aria-hidden="true"
              >
                {step.index}
              </span>
              <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-ivory sm:text-3xl">
                <span className="sr-only">Step {step.index}: </span>
                {step.title}
              </h3>
              <p className="mt-3 max-w-sm text-[1.0625rem] leading-relaxed text-mist">{step.body}</p>
              <div className="mt-8 max-w-sm" aria-hidden="true">
                <StepArt index={i} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
