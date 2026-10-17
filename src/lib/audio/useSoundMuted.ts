import { useCallback, useSyncExternalStore } from 'react'
import { soundEngine } from './soundEngine'

/** Shared, persisted mute state for the pad sounds and interface chime. */
export function useSoundMuted() {
  const muted = useSyncExternalStore(
    (cb) => soundEngine.subscribe(cb),
    () => soundEngine.muted,
    () => false,
  )
  const toggle = useCallback(() => soundEngine.setMuted(!soundEngine.muted), [])
  return [muted, toggle] as const
}
