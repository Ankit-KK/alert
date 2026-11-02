import { useCallback, useEffect, useRef, useState } from 'react'
import { SOUND_PADS, type PadTone } from '@/content/site'
import { SFX_URLS, soundEngine, type PlayResult } from '@/lib/audio/soundEngine'
import { hitPad, sceneStore } from '@/lib/three/sceneStore'
import { DemoSoundsToggle } from './DemoSoundsToggle'

const TONE_CLASS: Record<PadTone, string> = {
  cyan: 'data-[hit=true]:bg-cyan data-[hit=true]:text-obsidian',
  signal: 'data-[hit=true]:bg-signal data-[hit=true]:text-obsidian',
  mint: 'data-[hit=true]:bg-mint data-[hit=true]:text-obsidian',
}

const warmPads = () => soundEngine.warm(SOUND_PADS.map((p) => SFX_URLS[p.id]))

// Pad shortcuts stand aside while someone is typing or using a form control.
const FORM_FIELD = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

const OUTCOME: Record<PlayResult, (label: string) => string> = {
  played: (label) => `Played ${label}.`,
  muted: (label) => `${label} — visual only, demo sounds are muted.`,
  failed: (label) => `${label} didn’t load. Check your connection and try again.`,
  superseded: (label) => `${label} was cut off by another sound.`,
}

/**
 * The soundboard control deck. Real buttons drive both the pad sounds
 * and the 3D pads, so mouse, touch, and keyboard all get the same experience.
 * Keys 1–6 strike pads while focus is in the deck or the pads are on screen,
 * unless focus is in a form field or outside the page content (the site menu). The status line only says
 * a pad played once its sound has actually started.
 */
export function SoundDeck() {
  const [hit, setHit] = useState<number | null>(null)
  // Keyed by press, so pressing the same pad again is announced again.
  const [status, setStatus] = useState({ press: 0, text: '' })
  const hitTimer = useRef(0)
  const loadTimer = useRef(0)
  const presses = useRef(0)
  const deckRef = useRef<HTMLDivElement>(null)
  const padsRef = useRef<HTMLDivElement>(null)
  const padRefs = useRef<(HTMLButtonElement | null)[]>([])
  const audioOk = soundEngine.supported

  useEffect(
    () => () => {
      window.clearTimeout(hitTimer.current)
      window.clearTimeout(loadTimer.current)
    },
    [],
  )

  const strike = useCallback(
    (i: number) => {
      const pad = SOUND_PADS[i]
      const press = ++presses.current
      const say = (text: string) => setStatus({ press, text })
      hitPad(i)
      setHit(i)
      window.clearTimeout(hitTimer.current)
      hitTimer.current = window.setTimeout(() => setHit(null), 420)
      window.clearTimeout(loadTimer.current)
      if (!audioOk) return say(`${pad.label} — visual only (audio isn’t supported in this browser).`)
      // Cached clips settle at once; only a slow first load shows an interim line.
      loadTimer.current = window.setTimeout(() => say(`Loading ${pad.label}…`), 150)
      void soundEngine.play(pad.id).then((result) => {
        // A newer press owns the status line.
        if (press !== presses.current) return
        window.clearTimeout(loadTimer.current)
        say(OUTCOME[result](pad.label))
      })
    },
    [audioOk],
  )

  useEffect(() => {
    const pads = padsRef.current
    if (!pads) return
    let onScreen = false
    const io = new IntersectionObserver(([entry]) => (onScreen = entry.isIntersecting), { threshold: 0.5 })
    io.observe(pads)
    const onKey = (e: KeyboardEvent) => {
      const inDeck = !!deckRef.current?.contains(document.activeElement)
      if (!(onScreen || inDeck) || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.isComposing) return
      const i = SOUND_PADS.findIndex((p) => p.key === e.key)
      if (i < 0) return
      const target = e.target
      const inPage = target === document.body || (target instanceof Element && !!target.closest('main') && !target.closest(FORM_FIELD))
      if (!inPage) return
      e.preventDefault()
      // A held key auto-repeats keydown: one press, one sound.
      if (e.repeat) return
      // Focus follows the struck pad within the deck, but is never pulled in from elsewhere.
      if (inDeck) padRefs.current[i]?.focus()
      strike(i)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      io.disconnect()
      window.removeEventListener('keydown', onKey)
    }
  }, [strike])

  const statusText =
    status.text || (audioOk ? 'Tap a pad, or press keys 1–6.' : 'Audio isn’t supported here, so pads are a visual demonstration.')

  return (
    <div ref={deckRef} className="panel p-5 sm:p-6" onPointerEnter={warmPads} onFocus={warmPads}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <span className="font-display text-sm font-semibold text-ivory">Sound pads</span>
        {audioOk ? <DemoSoundsToggle /> : <span className="chip">Visual demo</span>}
      </div>

      <div ref={padsRef} role="group" aria-label="Soundboard pads" className="grid grid-cols-3 gap-3 sm:gap-4">
        {SOUND_PADS.map((pad, i) => (
          <button
            key={pad.id}
            ref={(el) => {
              padRefs.current[i] = el
            }}
            type="button"
            data-hit={hit === i}
            onClick={() => strike(i)}
            onPointerEnter={() => (sceneStore.padHover = i)}
            onPointerLeave={() => (sceneStore.padHover = -1)}
            onFocus={() => (sceneStore.padHover = i)}
            onBlur={() => (sceneStore.padHover = -1)}
            aria-keyshortcuts={pad.key}
            aria-label={`${pad.label}, ${pad.description}`}
            className={`group @container relative flex aspect-[1/0.82] flex-col justify-between rounded-2xl border border-line bg-raised p-3 text-left text-ivory shadow-[0_6px_0_0_#0d1418,0_12px_24px_-10px_rgba(0,0,0,0.8)] transition-[transform,box-shadow,background-color,color] duration-150 ease-[var(--ease-press)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#0d1418,0_16px_28px_-10px_rgba(0,0,0,0.8)] active:translate-y-[5px] active:shadow-[0_1px_0_0_#0d1418,0_4px_10px_-6px_rgba(0,0,0,0.8)] data-[hit=true]:translate-y-[5px] data-[hit=true]:shadow-[0_1px_0_0_#0d1418] sm:p-4 ${TONE_CLASS[pad.tone]}`}
          >
            <span className="font-sans text-xs font-medium opacity-60" aria-hidden="true">
              {pad.key}
            </span>
            {/* Sized to the pad, not the viewport: the deck sits in a narrow column at tablet widths. */}
            <span className="font-display text-[length:clamp(0.875rem,26cqi,1.5rem)] font-bold tracking-tight">{pad.label}</span>
            {hit === i && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 h-full w-full rounded-2xl border-2 border-current motion-safe:animate-[hc-ring_0.6s_ease-out_forwards]"
              />
            )}
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" className="mt-5 text-sm text-mist">
        <span key={status.press}>{statusText}</span>
      </p>
      <p className="mt-3 border-t border-line pt-4 text-[0.8125rem] leading-relaxed text-mist">
        Pad sounds are original effects generated with ElevenLabs for this demo, trimmed short and level-matched. One plays at a time, at a
        gentle volume.
      </p>
    </div>
  )
}
