import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { RotateCcw, Volume2, VolumeX } from 'lucide-react'
import { VISUAL_STATES } from '@/content/site'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { soundEngine } from '@/lib/audio/soundEngine'
import { useSoundMuted } from '@/lib/audio/useSoundMuted'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { StreamViewport } from './StreamViewport'

/**
 * Message → media → overlay, as a three-state composition with depth.
 * Tabs switch the state; "Play sequence" steps through all three. Layers that
 * are not the focus of the current state recede (blur + fade) to read as a
 * shallow depth of field. The overlay lands with a short alert chime unless
 * sound is switched off (shared with the soundboard's toggle).
 */
export function VisualStateDemo() {
  const reduced = useReducedMotion()
  const [state, setState] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, toggleMute] = useSoundMuted()
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const select = (i: number) => {
    setState(i)
    sceneStore.lastPulse = now()
    sceneStore.invalidate?.(60)
    if (i === 2) void soundEngine.play('alert')
  }

  const play = () => {
    clearTimers()
    soundEngine.unlock()
    setPlaying(true)
    select(0)
    const step = reduced ? 1800 : 1600
    timers.current.push(window.setTimeout(() => select(1), step))
    timers.current.push(window.setTimeout(() => select(2), step * 2))
    timers.current.push(window.setTimeout(() => setPlaying(false), step * 2 + 200))
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = -1
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % VISUAL_STATES.length
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + VISUAL_STATES.length) % VISUAL_STATES.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = VISUAL_STATES.length - 1
    if (next < 0) return
    e.preventDefault()
    clearTimers()
    setPlaying(false)
    select(next)
    tabs.current[next]?.focus()
  }

  const current = VISUAL_STATES[state]
  const layer = (visibleFrom: number, focusAt: number) => {
    const visible = state >= visibleFrom
    const focused = state === focusAt
    return {
      opacity: visible ? (focused ? 1 : 0.5) : 0,
      filter: visible && !focused ? 'blur(1.5px)' : 'none',
    }
  }

  return (
    <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-5">
        <div role="tablist" aria-label="Interaction stages" aria-orientation="vertical" className="flex flex-col gap-2">
          {VISUAL_STATES.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => {
                tabs.current[i] = el
              }}
              role="tab"
              id={`visual-tab-${s.id}`}
              aria-selected={state === i}
              aria-controls="visual-panel"
              tabIndex={state === i ? 0 : -1}
              onClick={() => {
                clearTimers()
                setPlaying(false)
                select(i)
              }}
              onKeyDown={(e) => onTabKey(e, i)}
              className={`group flex min-h-14 items-center gap-4 rounded-2xl border px-5 py-3 text-left transition-colors ${
                state === i ? 'border-cyan/50 bg-raised text-ivory' : 'border-line text-mist hover:border-mist/40 hover:text-ivory'
              }`}
            >
              <span className={`font-display text-sm font-semibold ${state === i ? 'text-cyan' : ''}`}>{s.step}</span>
              <span className="font-display text-lg font-semibold tracking-tight">{s.label}</span>
              <span
                aria-hidden="true"
                className={`ml-auto h-1.5 w-1.5 rounded-full transition-colors ${state === i ? 'bg-cyan' : state > i ? 'bg-mist' : 'bg-line'}`}
              />
            </button>
          ))}
        </div>

        <div id="visual-panel" role="tabpanel" aria-labelledby={`visual-tab-${current.id}`} className="mt-8 min-h-[7.5rem]">
          <h3 className="display-md">{current.title}</h3>
          <p className="mt-3 max-w-md text-[1.0625rem] leading-relaxed text-mist">{current.body}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" onClick={play} disabled={playing} className="btn btn-ghost disabled:opacity-50">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {playing ? 'Playing sequence…' : 'Play sequence'}
          </button>
          {soundEngine.supported && (
            <button
              type="button"
              onClick={toggleMute}
              aria-pressed={!muted}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium text-mist transition-colors hover:border-mist/50 hover:text-ivory"
            >
              {muted ? <VolumeX aria-hidden="true" className="h-4 w-4" /> : <Volume2 aria-hidden="true" className="h-4 w-4" />}
              Alert chime
            </button>
          )}
        </div>
      </div>

      {/* Composition */}
      <div className="lg:col-span-7" aria-hidden="true">
        <div className="relative mx-auto max-w-[44rem] [perspective:1600px]">
          <div
            className="relative transition-transform duration-700 ease-[var(--ease-out-expo)] [transform-style:preserve-3d]"
            style={{ transform: `rotateY(${-10 + state * 4}deg) rotateX(5deg)` }}
          >
            <div
              className={`rounded-2xl border p-2 transition-colors duration-500 ${
                state === 2 ? 'border-signal/70 shadow-[0_0_0_1px_rgba(255,112,72,0.25),0_40px_80px_-40px_rgba(255,112,72,0.35)]' : 'border-line'
              } bg-graphite`}
            >
              <StreamViewport label="Simulated stream with an on-screen alert">
                {/* Overlay alert inside the broadcast */}
                <div
                  className="absolute bottom-[7%] left-[4%] flex w-[56%] items-center gap-3 rounded-xl border-2 border-signal bg-obsidian/92 px-3 py-2 transition-all duration-500 ease-[var(--ease-out-expo)] sm:px-4 sm:py-3"
                  style={{ opacity: state === 2 ? 1 : 0, transform: `translateX(${state === 2 ? 0 : -24}px)` }}
                >
                  <span className="h-8 w-1.5 shrink-0 rounded-full bg-signal" />
                  <span className="min-w-0">
                    <span className="block font-display text-[0.7rem] font-bold tracking-[0.08em] text-signal sm:text-xs">NEW MOMENT</span>
                    <span className="block truncate text-xs text-ivory sm:text-sm">orbit.jay sent a reaction</span>
                  </span>
                </div>
                {/* Particles respond with the overlay */}
                {[12, 26, 41, 58, 73, 86].map((x, i) => (
                  <span
                    key={x}
                    className="absolute h-1.5 w-1.5 rounded-full bg-mint transition-opacity duration-700 motion-safe:animate-[hc-drift_3s_ease-in-out_infinite_alternate]"
                    style={{ left: `${x}%`, top: `${30 + ((i * 17) % 40)}%`, opacity: state === 2 ? 0.7 : 0, animationDelay: `${i * 0.4}s` }}
                  />
                ))}
              </StreamViewport>
            </div>

            {/* Message card */}
            <div
              className="absolute -top-6 -left-2 w-[58%] rounded-2xl border border-line bg-raised p-3 shadow-2xl transition-all duration-700 ease-[var(--ease-out-expo)] sm:-left-8 sm:p-4"
              style={{ ...layer(0, 0), transform: `translateZ(70px) translateY(${state === 0 ? 0 : -8}px)` }}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(140deg,#B6E8D8,#38DDE8)] font-display text-[0.8125rem] font-bold tracking-tight text-obsidian ring-2 ring-graphite">
                  OJ
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-xs text-mist">
                    <span className="font-display font-semibold text-ivory/90">orbit.jay</span>
                    <span className="h-1 w-1 shrink-0 rounded-full bg-mist/60" />
                    <span>now</span>
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-medium text-ivory sm:text-base">that ring-gate boost though</span>
                </span>
              </div>
            </div>

            {/* Media card */}
            <div
              className="absolute -right-2 -bottom-8 w-[34%] overflow-hidden rounded-2xl border border-line bg-raised shadow-2xl transition-all duration-700 ease-[var(--ease-out-expo)] sm:-right-8"
              style={{ ...layer(1, 1), transform: `translateZ(110px) scale(${state >= 1 ? 1 : 0.85})` }}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-obsidian">
                <img
                  src="/media/clip-boost.webp"
                  alt=""
                  width={720}
                  height={720}
                  decoding="async"
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover object-[50%_60%]"
                />
                <span className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-obsidian/70 to-transparent" />
                <span className="absolute top-2 left-2 rounded-[5px] bg-obsidian/85 px-1.5 py-[3px] font-display text-[11px] leading-none font-bold tracking-[0.12em] text-mint">
                  CLIP
                </span>
                <span className="absolute right-2 bottom-2 rounded-[5px] bg-obsidian/80 px-1.5 py-[3px] font-display text-[11px] leading-none font-semibold text-ivory tabular-nums">
                  0:06
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2 px-2.5 py-2 sm:px-3">
                <span className="h-5 w-0.5 shrink-0 rounded-full bg-mint" />
                <span className="min-w-0">
                  <span className="block truncate font-display text-[11px] font-semibold text-mist sm:text-xs">orbit.jay</span>
                  <span className="block truncate text-[11px] font-medium text-ivory sm:text-[0.8125rem]">ring gate boost</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-14 text-center text-[0.8125rem] text-mist">Illustrative composition — not a product screenshot.</p>
      </div>
    </div>
  )
}
