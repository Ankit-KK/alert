import { sceneStore } from '@/lib/three/sceneStore'

/**
 * Procedural soundboard cues, synthesized live with the Web Audio API.
 *
 * There are no audio files: every cue is built from oscillators and filtered
 * noise at play time, so nothing here is a third-party sample. Playback is
 * always user-triggered, one cue at a time (a new cue cuts the previous one),
 * and runs through a gentle limiter at a conservative master level.
 */

type CueBuilder = (ctx: AudioContext, out: AudioNode, t: number) => number

const MASTER_LEVEL = 0.32

function envGain(ctx: AudioContext, out: AudioNode, t: number, attack: number, hold: number, release: number, peak = 1) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.setValueAtTime(peak, t + attack + hold)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release)
  g.connect(out)
  return g
}

function osc(ctx: AudioContext, type: OscillatorType, freq: number, t: number, dur: number, dest: AudioNode) {
  const o = ctx.createOscillator()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  o.connect(dest)
  o.start(t)
  o.stop(t + dur + 0.05)
  return o
}

let noiseBuffer: AudioBuffer | null = null
function noise(ctx: AudioContext, t: number, dur: number, dest: AudioNode) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer
  src.connect(dest)
  src.start(t)
  src.stop(t + dur + 0.05)
  return src
}

const CUES: Record<string, CueBuilder> = {
  // Rising filtered saw sweep with a noise riser underneath.
  hype(ctx, out, t) {
    const dur = 0.85
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(400, t)
    lp.frequency.exponentialRampToValueAtTime(6000, t + dur)
    lp.connect(envGain(ctx, out, t, 0.04, dur - 0.3, 0.3, 0.55))
    for (const detune of [-8, 8]) {
      const o = osc(ctx, 'sawtooth', 196, t, dur, lp)
      o.detune.value = detune
      o.frequency.exponentialRampToValueAtTime(784, t + dur * 0.8)
    }
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.setValueAtTime(1500, t)
    hp.frequency.exponentialRampToValueAtTime(7000, t + dur)
    hp.connect(envGain(ctx, out, t, 0.5, 0.1, 0.25, 0.18))
    noise(ctx, t, dur, hp)
    return dur
  },
  // Two voices bending up then down — a vowel-like "wo-ow".
  wow(ctx, out, t) {
    const dur = 0.9
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 3
    bp.frequency.setValueAtTime(500, t)
    bp.frequency.linearRampToValueAtTime(1400, t + 0.35)
    bp.frequency.linearRampToValueAtTime(700, t + dur)
    bp.connect(envGain(ctx, out, t, 0.06, 0.45, 0.35, 0.9))
    for (const [f, type] of [[220, 'sawtooth'], [330, 'triangle']] as const) {
      const o = osc(ctx, type, f, t, dur, bp)
      o.frequency.linearRampToValueAtTime(f * 1.5, t + 0.35)
      o.frequency.linearRampToValueAtTime(f * 0.9, t + dur)
    }
    return dur
  },
  // Two bright chime notes.
  gg(ctx, out, t) {
    const notes: [number, number][] = [
      [784, 0],
      [1175, 0.18],
    ]
    for (const [f, offset] of notes) {
      const g = envGain(ctx, out, t + offset, 0.005, 0.02, 0.6, 0.45)
      osc(ctx, 'sine', f, t + offset, 0.7, g)
      const g2 = envGain(ctx, out, t + offset, 0.005, 0.01, 0.25, 0.12)
      osc(ctx, 'sine', f * 2.01, t + offset, 0.3, g2)
    }
    return 0.85
  },
  // Kick-style thump, noise snap, and a short bright chord stab.
  clutch(ctx, out, t) {
    const kick = osc(ctx, 'sine', 160, t, 0.35, envGain(ctx, out, t, 0.003, 0.05, 0.25, 0.9))
    kick.frequency.exponentialRampToValueAtTime(48, t + 0.3)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 2500
    hp.connect(envGain(ctx, out, t + 0.02, 0.002, 0.02, 0.12, 0.35))
    noise(ctx, t + 0.02, 0.2, hp)
    const stab = envGain(ctx, out, t + 0.08, 0.005, 0.08, 0.35, 0.22)
    for (const f of [523.25, 659.25, 783.99]) osc(ctx, 'square', f, t + 0.08, 0.5, stab)
    return 0.6
  },
  // Low wobbling buzz that slides down.
  bruh(ctx, out, t) {
    const dur = 0.7
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 900
    lp.Q.value = 4
    lp.connect(envGain(ctx, out, t, 0.03, 0.35, 0.3, 0.6))
    const o = osc(ctx, 'sawtooth', 130, t, dur, lp)
    o.frequency.linearRampToValueAtTime(82, t + dur)
    const lfo = ctx.createOscillator()
    const depth = ctx.createGain()
    lfo.frequency.value = 7
    depth.gain.value = 9
    lfo.connect(depth).connect(o.frequency)
    lfo.start(t)
    lfo.stop(t + dur + 0.05)
    return dur
  },
  // Airy noise swell with a sparkle arpeggio.
  cheer(ctx, out, t) {
    const dur = 1.2
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1800
    bp.Q.value = 0.7
    bp.connect(envGain(ctx, out, t, 0.35, 0.3, 0.5, 0.3))
    noise(ctx, t, dur, bp)
    ;[1047, 1319, 1568, 2093].forEach((f, i) => {
      const at = t + 0.1 + i * 0.09
      osc(ctx, 'triangle', f, at, 0.3, envGain(ctx, out, at, 0.004, 0.02, 0.25, 0.16))
    })
    return dur
  },
}

class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private analyser: AnalyserNode | null = null
  private current: GainNode | null = null
  private levelData: Uint8Array<ArrayBuffer> | null = null
  private raf = 0
  private activeUntil = 0

  get supported() {
    return typeof window !== 'undefined' && 'AudioContext' in window
  }

  private ensure(): AudioContext | null {
    if (!this.supported) return null
    if (!this.ctx) {
      const ctx = new AudioContext()
      const limiter = ctx.createDynamicsCompressor()
      limiter.threshold.value = -14
      limiter.ratio.value = 8
      const master = ctx.createGain()
      master.gain.value = MASTER_LEVEL
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      master.connect(limiter).connect(analyser).connect(ctx.destination)
      this.ctx = ctx
      this.master = master
      this.analyser = analyser
      this.levelData = new Uint8Array(new ArrayBuffer(analyser.fftSize))
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  /** Plays a cue, cutting any cue already sounding. Returns its length in seconds. */
  play(id: string): number {
    const ctx = this.ensure()
    const build = CUES[id]
    if (!ctx || !this.master || !build) return 0

    if (this.current) {
      const prev = this.current
      prev.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.015)
      window.setTimeout(() => prev.disconnect(), 120)
    }
    const bus = ctx.createGain()
    bus.connect(this.master)
    this.current = bus

    const t = ctx.currentTime + 0.01
    const dur = build(ctx, bus, t)
    this.activeUntil = performance.now() + (dur + 0.25) * 1000
    this.watchLevel()
    return dur
  }

  /** Mirrors output loudness into the scene store while a cue is sounding. */
  private watchLevel() {
    if (this.raf) return
    const step = () => {
      const analyser = this.analyser
      const data = this.levelData
      if (analyser && data) {
        analyser.getByteTimeDomainData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / data.length)
        sceneStore.audioLevel = Math.max(sceneStore.audioLevel * 0.85, Math.min(1, rms * 4))
      }
      if (performance.now() < this.activeUntil) {
        this.raf = requestAnimationFrame(step)
      } else {
        this.raf = 0
        sceneStore.audioLevel = 0
      }
    }
    this.raf = requestAnimationFrame(step)
  }
}

export const soundEngine = new SoundEngine()
