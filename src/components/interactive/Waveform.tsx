import { useEffect, useRef } from 'react'
import { soundEngine } from '@/lib/audio/soundEngine'

/**
 * Waveform of a voice clip. Bar heights are the clip's real loudness
 * envelope; while it plays, a cyan layer sweeps across with playback and the
 * bars breathe with the live spectrum from the audio output. Updates are
 * direct style writes from a rAF loop that only runs while `active`.
 */
export function Waveform({
  peaks,
  active,
  reduced,
  startedAt,
  duration,
}: {
  peaks: number[]
  active: boolean
  reduced: boolean
  /** performance.now() timestamp when playback (or the visual preview) began. */
  startedAt: number
  duration: number
}) {
  const baseRef = useRef<HTMLDivElement>(null)
  const playedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const base = baseRef.current
    const played = playedRef.current
    if (!base || !played) return
    const layers = [Array.from(base.children), Array.from(played.children)] as HTMLElement[][]
    const setHeights = (fn: (i: number) => number) =>
      layers.forEach((bars) => bars.forEach((b, i) => (b.style.transform = `scaleY(${fn(i).toFixed(3)})`)))

    if (!active) {
      setHeights((i) => 0.12 + peaks[i] * 0.88)
      played.style.clipPath = 'inset(0 100% 0 0)'
      return
    }

    const bands = new Float32Array(peaks.length)
    let raf = 0
    const step = () => {
      const progress = Math.min(1, (performance.now() - startedAt) / 1000 / duration)
      played.style.clipPath = `inset(0 ${((1 - progress) * 100).toFixed(2)}% 0 0)`
      const live = !reduced && soundEngine.readBands(bands)
      setHeights((i) => {
        const p = 0.12 + peaks[i] * 0.88
        return live ? Math.min(1, p * (0.7 + bands[i % bands.length] * 0.6)) : p
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [active, reduced, peaks, startedAt, duration])

  const bars = (className: string) =>
    peaks.map((p, i) => (
      <span key={i} className={`h-full flex-1 origin-center rounded-full ${className}`} style={{ transform: `scaleY(${0.12 + p * 0.88})` }} />
    ))

  return (
    <div aria-hidden="true" className="relative h-16">
      <div ref={baseRef} className="absolute inset-0 flex items-center gap-[3px]">
        {bars('bg-mist/35')}
      </div>
      <div ref={playedRef} className="absolute inset-0 flex items-center gap-[3px]" style={{ clipPath: 'inset(0 100% 0 0)' }}>
        {bars('bg-cyan')}
      </div>
    </div>
  )
}
