import { useCallback, useEffect, useRef, useState } from 'react'
import { now, sceneStore } from '@/lib/three/sceneStore'

export type SpeechStatus = 'unsupported' | 'idle' | 'starting' | 'speaking' | 'failed'

/**
 * Speaks sample text with the browser's built-in speech synthesis.
 *
 * This is deliberately *not* presented as HyperChat's voice technology: it is
 * a local preview of the idea of a message being read aloud. The status only
 * reports "speaking" after the engine fires `onstart`, so the UI never claims
 * playback that isn't happening. Word boundaries feed `wordPulse`, which the
 * waveforms use to stay in step with the speech.
 */
export function useSpeechPreview() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  const [status, setStatus] = useState<SpeechStatus>(supported ? 'idle' : 'unsupported')
  const wordPulse = useRef(-10)
  const startTimer = useRef(0)

  const stop = useCallback(() => {
    window.clearTimeout(startTimer.current)
    if (supported) window.speechSynthesis.cancel()
    sceneStore.voiceActive = false
    setStatus((s) => (s === 'unsupported' ? s : 'idle'))
  }, [supported])

  const speak = useCallback(
    (text: string) => {
      if (!supported) return
      const synth = window.speechSynthesis
      synth.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1
      utterance.pitch = 1
      utterance.volume = 0.9
      const voices = synth.getVoices()
      const english = voices.find((v) => v.lang?.startsWith('en') && v.localService) ?? voices.find((v) => v.lang?.startsWith('en'))
      if (english) utterance.voice = english

      utterance.onstart = () => {
        window.clearTimeout(startTimer.current)
        sceneStore.voiceActive = true
        sceneStore.lastPulse = now()
        sceneStore.invalidate?.(60)
        setStatus('speaking')
      }
      utterance.onboundary = () => {
        wordPulse.current = now()
        sceneStore.voiceWord = wordPulse.current
        sceneStore.invalidate?.(30)
      }
      utterance.onend = () => {
        sceneStore.voiceActive = false
        setStatus('idle')
      }
      utterance.onerror = (event) => {
        sceneStore.voiceActive = false
        setStatus(event.error === 'canceled' || event.error === 'interrupted' ? 'idle' : 'failed')
      }

      setStatus('starting')
      synth.speak(utterance)
      // Some browsers queue silently with no voices installed — surface that
      // instead of pretending.
      startTimer.current = window.setTimeout(() => {
        if (!synth.speaking) {
          synth.cancel()
          setStatus('failed')
        }
      }, 2500)
    },
    [supported],
  )

  useEffect(() => stop, [stop])

  return { status, speak, stop, wordPulse }
}
