import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

const getSnapshot = () => window.matchMedia(QUERY).matches

/** Live `prefers-reduced-motion` flag. `?motion=reduce` forces it for QA. */
export function useReducedMotion(): boolean {
  const media = useSyncExternalStore(subscribe, getSnapshot, () => false)
  return media || new URLSearchParams(window.location.search).get('motion') === 'reduce'
}
