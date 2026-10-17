import { useEffect, useId, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { VOICE_SAMPLES } from '@/content/site'
import { soundEngine } from '@/lib/audio/soundEngine'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { Waveform } from './Waveform'

type Status = 'idle' | 'loading' | 'playing' | 'visual' | 'failed'

const formatTime = (s: number) => `0:${String(Math.round(s)).padStart(2, '0')}`

/**
 * Voice message preview. Plays pre-recorded sample clips (generated once with
 * ElevenLabs stock voices for this page) through the shared sound engine.
 * Status only reports "playing" once audio has actually started. Without Web
 * Audio, it offers a clearly labelled visual-only preview instead.
 */
export function VoiceDemo() {
  const reduced = useReducedMotion()
  const audioOk = soundEngine.supported
  const [selected, setSelected] = useState(VOICE_SAMPLES[0].id)
  const [status, setStatus] = useState<Status>('idle')
  const [startedAt, setStartedAt] = useState(0)
  const [duration, setDuration] = useState(VOICE_SAMPLES[0].duration)
  const visualTimer = useRef(0)
  const groupName = useId()
  const sample = VOICE_SAMPLES.find((s) => s.id === selected) ?? VOICE_SAMPLES[0]
  const active = status === 'playing' || status === 'visual'

  useEffect(() => () => window.clearTimeout(visualTimer.current), [])

  // The visual-only preview has no audio to analyse, so pulse the 3D voice module on a steady beat.
  useEffect(() => {
    if (status !== 'visual') return
    const id = window.setInterval(() => {
      sceneStore.voiceWord = now()
      sceneStore.invalidate?.(20)
    }, 280)
    return () => window.clearInterval(id)
  }, [status])

  const stop = () => {
    window.clearTimeout(visualTimer.current)
    sceneStore.voiceActive = false
    soundEngine.stop()
    setStatus('idle')
  }

  const startVisual = () => {
    setDuration(sample.duration)
    setStartedAt(performance.now())
    setStatus('visual')
    sceneStore.voiceActive = true
    sceneStore.lastPulse = now()
    visualTimer.current = window.setTimeout(stop, sample.duration * 1000)
  }

  const onToggle = () => {
    if (status === 'playing' || status === 'loading' || status === 'visual') return stop()
    if (!audioOk) return startVisual()
    setStatus('loading')
    void soundEngine.playVoice(sample.src, {
      onStart: (d) => {
        setDuration(d)
        setStartedAt(performance.now())
        setStatus('playing')
      },
      onEnd: () => setStatus('idle'),
      onError: () => setStatus('failed'),
    })
  }

  const pick = (id: string) => {
    if (status !== 'idle' && status !== 'failed') stop()
    setSelected(id)
    setDuration(VOICE_SAMPLES.find((s) => s.id === id)?.duration ?? duration)
    soundEngine.warm([VOICE_SAMPLES.find((s) => s.id === id)?.src ?? ''])
  }

  const busy = status === 'playing' || status === 'loading' || status === 'visual'
  const buttonLabel = busy ? 'Stop' : audioOk ? 'Play voice message' : 'Play visual preview'

  const statusText = (() => {
    if (status === 'loading') return 'Loading the sample…'
    if (status === 'playing') return `Playing ${sample.user}’s message.`
    if (status === 'visual') return 'Visual preview — audio isn’t available in this browser.'
    if (status === 'failed') return 'The sample didn’t load. Check your connection and try again.'
    if (!audioOk) return 'Audio isn’t available in this browser. A visual preview is shown instead.'
    return 'Ready. Choose a message and press play.'
  })()

  return (
    <div className="panel overflow-hidden" onPointerEnter={() => soundEngine.warm([sample.src])} onFocus={() => soundEngine.warm([sample.src])}>
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="flex items-center gap-2 font-display text-sm font-semibold text-ivory">
          <span className={`h-2 w-2 rounded-full ${active ? 'animate-live bg-cyan' : 'bg-mist/50'}`} aria-hidden="true" />
          Voice message
        </span>
        <span className="chip">Sample audio</span>
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
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3 text-sm text-mist">
                  <span>{s.user}</span>
                  <span className="font-mono text-xs tabular-nums" aria-hidden="true">
                    {formatTime(s.duration)}
                  </span>
                </span>
                <span className="block text-[0.95rem] leading-snug text-ivory">“{s.text}”</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="px-5 pt-5 pb-5">
        <Waveform peaks={sample.peaks} active={active} reduced={reduced} startedAt={startedAt} duration={duration} />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button type="button" onClick={onToggle} className="btn btn-primary" aria-describedby="voice-status">
            {busy ? <Pause aria-hidden="true" className="h-4 w-4" /> : <Play aria-hidden="true" className="h-4 w-4" />}
            {buttonLabel}
          </button>
          <p id="voice-status" role="status" aria-live="polite" className="min-w-0 flex-1 text-sm text-mist">
            {statusText}
          </p>
        </div>
        <p className="mt-4 border-t border-line pt-4 text-[0.8125rem] leading-relaxed text-mist">
          Sample messages voiced with ElevenLabs stock voices ({VOICE_SAMPLES.map((s) => s.voice).join(', ')}) and pre-recorded for this
          page. Nothing you do here is sent anywhere, and HyperChat’s own voice options may sound different.
        </p>
      </div>
    </div>
  )
}
