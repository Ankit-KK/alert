import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/index.css'
import App from './App'

// Always start at the hero on reload; in-page hashes are handled by the app.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// `?motion=reduce` forces reduced motion for QA. useReducedMotion covers the JS
// side; this attribute lets the CSS (reduced-motion rules, Tailwind's motion
// variants) follow it from the first frame.
if (new URLSearchParams(window.location.search).get('motion') === 'reduce') document.documentElement.dataset.motion = 'reduce'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
