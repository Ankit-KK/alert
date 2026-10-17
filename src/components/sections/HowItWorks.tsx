import { useRef } from 'react'
import { AudioLines, Image, Send, Volume2 } from 'lucide-react'
import { StreamFrameImage, LiveBadge } from '@/components/interactive/StreamViewport'
import { STEPS } from '@/content/site'
import { useReveal } from '@/hooks/useReveal'

// Loudness envelope for the small voice-clip waveform in step 3.
const VOICE_WAVE = [0.3, 0.55, 0.8, 0.5, 1, 0.7, 0.9, 0.45, 0.65, 0.85, 0.4, 0.6, 0.3, 0.5, 0.25]

const TOGGLES = [
  { icon: AudioLines, label: 'Voice', hint: 'Short recorded messages' },
  { icon: Volume2, label: 'Sounds', hint: 'Pads your chat can trigger' },
  { icon: Image, label: 'Media', hint: 'GIFs and clips with alerts' },
]

const PADS = [
  { label: 'HYPE', key: '1', className: 'bg-signal text-obsidian' },
  { label: 'WOW', key: '2', className: 'bg-cyan text-obsidian' },
  { label: 'GG', key: '3', className: 'bg-mint text-obsidian' },
]

/** Small UI fragments that illustrate each step. Decorative; the text carries the meaning. */
function StepArt({ index }: { index: number }) {
  if (index === 0) {
    // A creator page: banner, initials avatar, bio and the interactions this channel accepts.
    return (
      <div className="overflow-hidden rounded-2xl border border-line bg-graphite shadow-[0_30px_60px_-34px_rgba(0,0,0,0.9)]">
        <div className="relative h-32 overflow-hidden bg-obsidian">
          <img
            src="/media/clip-arena.webp"
            alt=""
            width={720}
            height={720}
            decoding="async"
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
          />
          <span className="absolute inset-0 bg-linear-to-t from-graphite via-graphite/5 to-transparent" />
        </div>
        <div className="relative px-4 pb-4">
          <div className="-mt-9 flex items-end gap-3">
            <span className="grid h-[4.25rem] w-[4.25rem] shrink-0 place-items-center rounded-full border-4 border-graphite bg-[linear-gradient(140deg,#FFA284,#FF7048_55%,#D9583A)] font-display text-xl font-bold tracking-tight text-obsidian">
              LL
            </span>
            <span className="mb-1 min-w-0">
              <span className="block truncate font-display text-lg leading-tight font-semibold text-ivory">lowpoly_lu</span>
              <span className="block truncate text-xs text-mist">Hover racing · Canyon tracks</span>
            </span>
          </div>
          <p className="mt-3 text-[0.8125rem] leading-snug text-[#C9D1D4]">Late-night time trials and low-poly racing lines. Say hi on stream.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {TOGGLES.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1 text-xs font-medium text-ivory">
                <Icon className="h-3.5 w-3.5 text-cyan" />
                {label}
              </span>
            ))}
          </div>
          <span className="mt-4 flex h-10 items-center justify-center gap-2 rounded-full bg-ivory font-display text-sm font-semibold text-obsidian">
            <Send className="h-3.5 w-3.5" />
            Send an interaction
          </span>
        </div>
      </div>
    )
  }
  if (index === 1) {
    // Interaction settings: toggles, alert volume, and the soundboard pads viewers can play.
    return (
      <div className="rounded-2xl border border-line bg-graphite p-4 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.9)]">
        <div className="flex flex-col gap-1.5">
          {TOGGLES.map(({ icon: Icon, label, hint }) => (
            <div key={label} className="flex items-center gap-3 rounded-lg bg-raised px-3 py-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-obsidian text-cyan">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm leading-tight font-medium text-ivory">{label}</span>
                <span className="block truncate text-[11px] leading-tight text-mist">{hint}</span>
              </span>
              <span className="ml-auto flex h-5 w-9 shrink-0 items-center justify-end rounded-full border border-cyan/70 bg-teal px-0.5">
                <span className="h-3.5 w-3.5 rounded-full bg-ivory" />
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-line px-3 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-ivory">
              <Volume2 className="h-3.5 w-3.5 text-mist" />
              Alert volume
            </span>
            <span className="font-display font-semibold text-mist tabular-nums">70%</span>
          </div>
          <div className="relative mt-2.5 h-1.5 rounded-full bg-obsidian">
            <span className="absolute inset-y-0 left-0 w-[70%] rounded-full bg-cyan" />
            <span className="absolute top-1/2 left-[70%] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cyan bg-ivory" />
          </div>
        </div>

        <div className="mt-4">
          <span className="font-display text-[11px] font-semibold tracking-[0.08em] text-mist uppercase">Soundboard</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PADS.map((pad) => (
              <span
                key={pad.label}
                className={`relative grid h-11 place-items-center rounded-lg font-display text-sm font-bold tracking-[0.06em] shadow-[inset_0_-3px_0_rgba(8,12,15,0.25)] ${pad.className}`}
              >
                {pad.label}
                <span className="absolute top-1 right-1.5 font-display text-[11px] leading-none font-semibold opacity-60">{pad.key}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }
  // On air: the sample broadcast with a voice-message alert in the overlay.
  return (
    <div className="rounded-2xl border border-line bg-graphite p-1.5 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.9)]">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-obsidian">
        <StreamFrameImage />
        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,15,0.5)_0%,rgba(8,12,15,0)_28%,rgba(8,12,15,0)_55%,rgba(8,12,15,0.75)_100%)]" />
        <LiveBadge className="absolute top-2.5 left-2.5" />
        <span className="absolute bottom-2.5 left-2.5 flex max-w-[80%] items-center gap-2.5 rounded-lg border border-cyan/80 bg-obsidian/92 py-1.5 pr-3 pl-1.5 shadow-[0_0_24px_-6px_rgba(56,221,232,0.6)] sm:max-w-[70%]">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-cyan font-display text-xs font-bold text-obsidian">KC</span>
          <span className="min-w-0">
            <span className="block truncate text-xs leading-tight">
              <span className="font-display font-semibold text-ivory">kitecat</span>
              <span className="text-mist"> · voice message</span>
            </span>
            <span className="mt-1 flex h-3 items-center gap-[2px]">
              {VOICE_WAVE.map((h, i) => (
                <span key={i} className={`w-[3px] rounded-full ${i < 6 ? 'bg-cyan' : 'bg-cyan/45'}`} style={{ height: `${Math.round(h * 100)}%` }} />
              ))}
              <span className="ml-1.5 font-display text-[11px] leading-none font-semibold text-mist tabular-nums">0:04</span>
            </span>
          </span>
        </span>
      </div>
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
