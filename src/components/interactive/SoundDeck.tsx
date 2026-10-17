import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { SOUND_PADS, type PadTone } from '@/content/site'
import { SFX_URLS, soundEngine } from '@/lib/audio/soundEngine'
import { useSoundMuted } from '@/lib/audio/useSoundMuted'
import { hitPad, sceneStore } from '@/lib/three/sceneStore'

const TONE_CLASS: Record<PadTone, string> = {
  cyan: 'data-[hit=true]:bg-cyan data-[hit=true]:text-obsidian',
  signal: 'data-[hit=true]:bg-signal data-[hit=true]:text-obsidian',
  mint: 'data-[hit=true]:bg-mint data-[hit=true]:text-obsidian',
}

const warmPads = () => soundEngine.warm(SOUND_PADS.map((p) => SFX_URLS[p.id]))

/**
 * The soundboard control deck. Real buttons drive both the pad sounds
 * and the 3D pads, so mouse, touch, and keyboard all get the same experience.
 * Keys 1–6 strike pads while focus is inside the deck.
 */
export function SoundDeck() {
  const [muted, toggleMute] = useSoundMuted()
  const [hit, setHit] = useState<number | null>(null)
  const [last, setLast] = useState<string | null>(null)
  const hitTimer = useRef(0)
  const padRefs = useRef<(HTMLButtonElement | null)[]>([])
  const audioOk = soundEngine.supported

  useEffect(() => () => window.clearTimeout(hitTimer.current), [])

  const strike = (i: number) => {
    const pad = SOUND_PADS[i]
    hitPad(i)
    if (!muted && audioOk) void soundEngine.play(pad.id)
    setHit(i)
    setLast(pad.label)
    window.clearTimeout(hitTimer.current)
    hitTimer.current = window.setTimeout(() => setHit(null), 420)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const i = SOUND_PADS.findIndex((p) => p.key === e.key)
    if (i < 0) return
    e.preventDefault()
    padRefs.current[i]?.focus()
    strike(i)
  }

  const statusText = !audioOk
    ? last
      ? `${last} — visual only (audio isn’t supported in this browser).`
      : 'Audio isn’t supported here, so pads are a visual demonstration.'
    : last
      ? muted
        ? `${last} — muted, visual only.`
        : `Played ${last}.`
      : 'Tap a pad, or press keys 1–6.'

  return (
    <div className="panel p-5 sm:p-6" onKeyDown={onKeyDown} onPointerEnter={warmPads} onFocus={warmPads}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <span className="font-display text-sm font-semibold text-ivory">Sound pads</span>
        {audioOk ? (
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-mist transition-colors hover:border-mist/50 hover:text-ivory"
          >
            {muted ? <VolumeX aria-hidden="true" className="h-4 w-4" /> : <Volume2 aria-hidden="true" className="h-4 w-4" />}
            {muted ? 'Sound off' : 'Sound on'}
          </button>
        ) : (
          <span className="chip">Visual demo</span>
        )}
      </div>

      <div role="group" aria-label="Soundboard pads" className="grid grid-cols-3 gap-3 sm:gap-4">
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
            className={`group relative flex aspect-[1/0.82] flex-col justify-between rounded-2xl border border-line bg-raised p-3 text-left text-ivory shadow-[0_6px_0_0_#0d1418,0_12px_24px_-10px_rgba(0,0,0,0.8)] transition-[transform,box-shadow,background-color,color] duration-150 ease-[var(--ease-press)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_#0d1418,0_16px_28px_-10px_rgba(0,0,0,0.8)] active:translate-y-[5px] active:shadow-[0_1px_0_0_#0d1418,0_4px_10px_-6px_rgba(0,0,0,0.8)] data-[hit=true]:translate-y-[5px] data-[hit=true]:shadow-[0_1px_0_0_#0d1418] sm:p-4 ${TONE_CLASS[pad.tone]}`}
          >
            <span className="font-sans text-xs font-medium opacity-60" aria-hidden="true">
              {pad.key}
            </span>
            <span className="font-display text-lg font-bold tracking-tight sm:text-2xl">
              {pad.label}
              <span className="sr-only">, {pad.description}</span>
            </span>
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
        {statusText}
      </p>
      <p className="mt-3 border-t border-line pt-4 text-[0.8125rem] leading-relaxed text-mist">
        Pad sounds are original effects generated with ElevenLabs for this demo, trimmed short and level-matched. One plays at a time, at a
        gentle volume.
      </p>
    </div>
  )
}
