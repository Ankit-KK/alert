import { useEffect, useId, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { VOICE_SAMPLES } from '@/content/site'
import { useSpeechPreview } from '@/lib/audio/useSpeechPreview'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Waveform } from './Waveform'

const VISUAL_PREVIEW_SECONDS = 4

/**
 * Voice message preview. Uses the browser's own speech engine when present
 * and says so; otherwise offers a clearly labelled visual-only preview. The
 * component is self-contained so a real voice backend can replace
 * `useSpeechPreview` later without touching the layout.
 */
export function VoiceDemo() {
  const reduced = useReducedMotion()
  const { status, speak, stop } = useSpeechPreview()
  const [selected, setSelected] = useState(VOICE_SAMPLES[0].id)
  const [visualPreview, setVisualPreview] = useState(false)
  const visualTimer = useRef(0)
  const groupName = useId()
  const sample = VOICE_SAMPLES.find((s) => s.id === selected) ?? VOICE_SAMPLES[0]

  const canSpeak = status !== 'unsupported' && status !== 'failed'
  const speaking = status === 'speaking'
  const active = speaking || visualPreview

  const stopVisual = () => {
    window.clearTimeout(visualTimer.current)
    setVisualPreview(false)
    sceneStore.voiceActive = false
  }

  useEffect(() => () => window.clearTimeout(visualTimer.current), [])

  // Fake word boundaries for the visual-only preview so the waveform moves.
  useEffect(() => {
    if (!visualPreview) return
    const id = window.setInterval(() => {
      sceneStore.voiceWord = now()
      sceneStore.invalidate?.(20)
    }, 320)
    return () => window.clearInterval(id)
  }, [visualPreview])

  const onToggle = () => {
    if (speaking || status === 'starting') return stop()
    if (visualPreview) return stopVisual()
    if (canSpeak) {
      speak(`${sample.user} says: ${sample.text}`)
      return
    }
    setVisualPreview(true)
    sceneStore.voiceActive = true
    sceneStore.lastPulse = now()
    visualTimer.current = window.setTimeout(stopVisual, VISUAL_PREVIEW_SECONDS * 1000)
  }

  const pick = (id: string) => {
    if (speaking || status === 'starting') stop()
    if (visualPreview) stopVisual()
    setSelected(id)
  }

  const buttonLabel = active || status === 'starting' ? 'Stop preview' : canSpeak ? 'Play voice preview' : 'Play visual preview'

  const statusText = (() => {
    if (status === 'starting') return 'Starting your browser’s speech engine…'
    if (speaking) return 'Speaking now with your browser’s built-in voice.'
    if (visualPreview) return 'Visual preview — no audio is playing.'
    if (status === 'failed') return 'Your browser didn’t start speech. You can still watch a visual preview.'
    if (status === 'unsupported') return 'Speech isn’t available in this browser. A visual preview is shown instead.'
    return 'Ready. Choose a message and press play.'
  })()

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2 font-display text-sm font-semibold text-ivory">
          <span className={`h-2 w-2 rounded-full ${active ? 'animate-live bg-cyan' : 'bg-mist/50'}`} aria-hidden="true" />
          Voice message
        </span>
        <span className="chip">Preview</span>
      </div>

      <fieldset className="px-5 pt-5">
        <legend className="mb-3 text-sm font-medium text-mist">Sample message</legend>
        <div className="grid gap-2">
          {VOICE_SAMPLES.map((s) => (
            <label
              key={s.id}
              className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cyan ${
                selected === s.id ? 'border-cyan/60 bg-raised' : 'border-line hover:border-mist/40'
              }`}
            >
              <input type="radio" name={groupName} value={s.id} checked={selected === s.id} onChange={() => pick(s.id)} className="sr-only" />
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${
                  selected === s.id ? 'bg-cyan text-obsidian' : 'bg-raised text-mist'
                }`}
              >
                {s.user[0].toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block text-sm text-mist">{s.user}</span>
                <span className="block text-[0.95rem] leading-snug text-ivory">“{s.text}”</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="px-5 pt-5 pb-5">
        <Waveform active={active} reduced={reduced} />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button type="button" onClick={onToggle} className="btn btn-primary" aria-describedby="voice-status">
            {active || status === 'starting' ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
            {buttonLabel}
          </button>
          <p id="voice-status" role="status" aria-live="polite" className="min-w-0 flex-1 text-sm text-mist">
            {statusText}
          </p>
        </div>
        <p className="mt-4 border-t border-line pt-4 text-[0.8125rem] leading-relaxed text-mist">
          This preview runs entirely in your browser using its built-in speech voice. It illustrates a message being read aloud — HyperChat’s
          own voice options may sound different.
        </p>
      </div>
    </div>
  )
}
