import { now, sceneStore } from '@/lib/three/sceneStore'

/**
 * Plays the homepage's demo audio: short pad effects and pre-generated voice
 * samples, all static files in /public/audio (made once with ElevenLabs for
 * this page — nothing is generated or streamed at runtime).
 *
 * Playback is always user-triggered and one clip at a time: a new clip cuts
 * whatever is sounding. Everything runs through a gentle limiter at a
 * conservative master level, and an analyser mirrors the output into the
 * scene store so the 3D stage and DOM waveforms react to the real signal.
 */

export const SFX_URLS: Record<string, string> = {
  hype: '/audio/sfx/hype.mp3',
  wow: '/audio/sfx/wow.mp3',
  gg: '/audio/sfx/gg.mp3',
  clutch: '/audio/sfx/clutch.mp3',
  bruh: '/audio/sfx/bruh.mp3',
  cheer: '/audio/sfx/cheer.mp3',
  alert: '/audio/sfx/alert.mp3',
}

const MASTER_LEVEL = 0.7
const MUTE_KEY = 'hc:sound-muted'

type Channel = 'sfx' | 'voice'

interface Playing {
  source: AudioBufferSourceNode
  gain: GainNode
  channel: Channel
  onEnd?: () => void
}

export interface VoiceHandlers {
  onStart?: (duration: number) => void
  onEnd?: () => void
  onError?: () => void
}

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private timeData: Uint8Array<ArrayBuffer> | null = null
  private freqData: Uint8Array<ArrayBuffer> | null = null
  private bytes = new Map<string, Promise<ArrayBuffer | null>>()
  private buffers = new Map<string, Promise<AudioBuffer | null>>()
  private current: Playing | null = null
  private token = 0
  private raf = 0
  private activeUntil = 0
  private envelope = 0
  private listeners = new Set<() => void>()
  muted = typeof window !== 'undefined' ? readMuted() : false

  get supported() {
    return typeof window !== 'undefined' && 'AudioContext' in window && 'fetch' in window
  }

  /** Mute applies to pad sounds and the visuals chime; voice previews are an explicit play. */
  setMuted(muted: boolean) {
    this.muted = muted
    try {
      window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
    } catch {
      /* storage unavailable: keep in-memory state */
    }
    if (muted && this.current?.channel === 'sfx') this.stop()
    this.listeners.forEach((l) => l())
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => void this.listeners.delete(listener)
  }

  /** Starts downloading clips (no decoding, no AudioContext) so the first press is instant. */
  warm(urls: string[]) {
    if (!this.supported) return
    for (const url of urls) this.fetchBytes(url)
  }

  private fetchBytes(url: string) {
    let p = this.bytes.get(url)
    if (!p) {
      p = fetch(url)
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .catch(() => null)
      this.bytes.set(url, p)
    }
    return p
  }

  private decode(ctx: AudioContext, url: string) {
    let p = this.buffers.get(url)
    if (!p) {
      p = this.fetchBytes(url).then((data) => (data ? ctx.decodeAudioData(data.slice(0)).catch(() => null) : null))
      // Let a failed load be retried on the next press.
      void p.then((b) => {
        if (b) return
        this.buffers.delete(url)
        this.bytes.delete(url)
      })
      this.buffers.set(url, p)
    }
    return p
  }

  private ensure(): AudioContext | null {
    if (!this.supported) return null
    if (!this.ctx) {
      const ctx = new AudioContext()
      const limiter = ctx.createDynamicsCompressor()
      limiter.threshold.value = -10
      limiter.knee.value = 6
      limiter.ratio.value = 12
      limiter.attack.value = 0.003
      limiter.release.value = 0.12
      const master = ctx.createGain()
      master.gain.value = MASTER_LEVEL
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.72
      master.connect(limiter).connect(analyser).connect(ctx.destination)
      this.ctx = ctx
      this.master = master
      this.analyser = analyser
      this.timeData = new Uint8Array(new ArrayBuffer(analyser.fftSize))
      this.freqData = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  /**
   * Creates/resumes the audio context. Call it inside a click handler when a
   * sound will follow on a timer, so strict autoplay policies still allow it.
   */
  unlock() {
    this.ensure()
  }

  /** Fades out and releases whatever is playing. */
  stop() {
    this.token++
    const cur = this.current
    this.current = null
    if (!cur || !this.ctx) return
    cur.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.02)
    const { source, onEnd } = cur
    source.onended = null
    window.setTimeout(() => {
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
      cur.gain.disconnect()
    }, 140)
    if (cur.channel === 'voice') sceneStore.voiceActive = false
    onEnd?.()
  }

  private async start(url: string, channel: Channel, handlers: VoiceHandlers = {}): Promise<number> {
    const ctx = this.ensure()
    if (!ctx || !this.master) {
      handlers.onError?.()
      return 0
    }
    this.stop()
    const token = this.token
    const buffer = await this.decode(ctx, url)
    // A newer press (or a stop) arrived while this clip was loading.
    if (token !== this.token) return 0
    if (!buffer) {
      handlers.onError?.()
      return 0
    }

    const gain = ctx.createGain()
    gain.connect(this.master)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(gain)
    const playing: Playing = { source, gain, channel, onEnd: handlers.onEnd }
    source.onended = () => {
      if (this.current !== playing) return
      this.current = null
      gain.disconnect()
      if (channel === 'voice') sceneStore.voiceActive = false
      handlers.onEnd?.()
    }
    this.current = playing
    source.start(ctx.currentTime + 0.005)

    if (channel === 'voice') sceneStore.voiceActive = true
    sceneStore.lastPulse = now()
    sceneStore.invalidate?.(60)
    this.activeUntil = performance.now() + (buffer.duration + 0.3) * 1000
    this.watchLevel()
    handlers.onStart?.(buffer.duration)
    return buffer.duration
  }

  /** Plays a pad or interface effect by id (respects mute). Resolves to its length in seconds. */
  play(id: string): Promise<number> {
    const url = SFX_URLS[id]
    if (!url || this.muted) return Promise.resolve(0)
    return this.start(url, 'sfx')
  }

  /** Plays a voice sample. Handlers fire only for real playback, never optimistically. */
  playVoice(url: string, handlers: VoiceHandlers) {
    return this.start(url, 'voice', handlers)
  }

  /**
   * Fills `out` with 0–1 band energies (log-spaced, speech-weighted) from the
   * live output. Returns false when nothing is playing.
   */
  readBands(out: Float32Array): boolean {
    const analyser = this.analyser
    const data = this.freqData
    if (!analyser || !data || !this.current || !this.ctx) return false
    analyser.getByteFrequencyData(data)
    const nyquist = this.ctx.sampleRate / 2
    const lo = 90
    const hi = 7000
    for (let i = 0; i < out.length; i++) {
      const f0 = lo * Math.pow(hi / lo, i / out.length)
      const f1 = lo * Math.pow(hi / lo, (i + 1) / out.length)
      const b0 = Math.floor((f0 / nyquist) * data.length)
      const b1 = Math.max(b0 + 1, Math.floor((f1 / nyquist) * data.length))
      let peak = 0
      for (let b = b0; b < b1; b++) peak = Math.max(peak, data[b])
      out[i] = Math.pow(peak / 255, 1.6)
    }
    return true
  }

  /**
   * Mirrors output loudness into the scene store while a clip is sounding.
   * For voice, syllable onsets (a jump above the running envelope) become
   * `voiceWord` pulses, so the 3D voice module moves with the actual speech.
   */
  private watchLevel() {
    if (this.raf) return
    const step = () => {
      const analyser = this.analyser
      const data = this.timeData
      if (analyser && data) {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const level = Math.min(1, Math.sqrt(sum / data.length) * 4)
        sceneStore.audioLevel = Math.max(sceneStore.audioLevel * 0.85, level)
        if (sceneStore.voiceActive && level > 0.12 && level > this.envelope * 1.35) sceneStore.voiceWord = now()
        this.envelope = this.envelope * 0.9 + level * 0.1
        sceneStore.invalidate?.(2)
      }
      if (performance.now() < this.activeUntil) {
        this.raf = requestAnimationFrame(step)
      } else {
        this.raf = 0
        this.envelope = 0
        sceneStore.audioLevel = 0
      }
    }
    this.raf = requestAnimationFrame(step)
  }
}

export const soundEngine = new SoundEngine()
