import { useEffect, useRef } from 'react'
import { sceneStore } from '@/lib/three/sceneStore'

const BARS = 44

/**
 * DOM waveform that mirrors the same signals the 3D ribbons use. Bars are
 * animated with direct style writes from a rAF loop that only runs while
 * `active` is true — no React state per frame.
 */
export function Waveform({ active, reduced }: { active: boolean; reduced: boolean }) {
  const barsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = barsRef.current
    if (!el) return
    const bars = Array.from(el.children) as HTMLElement[]
    const rest = () =>
      bars.forEach((b, i) => {
        b.style.transform = `scaleY(${0.12 + 0.08 * Math.abs(Math.sin(i * 0.7))})`
      })
    if (!active) {
      rest()
      return
    }

    let raf = 0
    let level = 0
    const step = () => {
      const t = performance.now() / 1000
      const word = Math.exp(-(t - sceneStore.voiceWord) * 5)
      const target = sceneStore.voiceActive ? 0.45 + word * 0.55 : 0.1
      level += (target - level) * 0.2
      bars.forEach((b, i) => {
        const u = i / BARS
        const shape = Math.sin(u * Math.PI)
        const wobble = reduced ? 0.6 : 0.5 + 0.5 * Math.sin(u * 19 + t * 8) * Math.sin(u * 7 - t * 5)
        b.style.transform = `scaleY(${Math.max(0.08, Math.min(1, (0.15 + wobble * 0.85) * shape * level + 0.06))})`
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(raf)
      rest()
    }
  }, [active, reduced])

  return (
    <div ref={barsRef} aria-hidden="true" className="flex h-16 items-center gap-[3px]">
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          className={`h-full flex-1 origin-center rounded-full transition-colors duration-300 ${active ? 'bg-cyan' : 'bg-mist/40'}`}
          style={{ transform: 'scaleY(0.12)' }}
        />
      ))}
    </div>
  )
}
