# HyperChat — V2 homepage

A cinematic, interactive marketing homepage for HyperChat: livestream interactions (voice, sound, visuals, creator control) told through a single real-time 3D scene — the **Interaction Engine** — choreographed by scroll.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build → dist/
npm run preview    # serve dist/ on http://localhost:4173
npm run check      # lint + build + content/colour guard
```

QA query flags: `?webgl=0` (static fallback), `?quality=low|high` (force render tier), `?motion=reduce` (reduced-motion mode).

`VITE_SITE_URL` (in `.env`) sets the canonical / Open Graph origin. It defaults to `https://hyperchat.space`; override it per deployment.

## Stack

Vite 7 · React 19 · TypeScript · Tailwind CSS 4 · three.js r186 · React Three Fiber 9 · Drei 10 · @react-three/postprocessing · GSAP 3 + ScrollTrigger · Lenis · lucide-react · Space Grotesk + Inter (self-hosted via Fontsource, OFL).

## How it fits together

```
src/
  content/site.ts            all copy, demo data, nav + CTA destinations
  lib/motion/                Lenis + ScrollTrigger provider, scene director, camera keyframes
  lib/three/                 shared scene store (DOM ⇄ WebGL bridge), world layout, device tiers
  lib/audio/                 Web Audio soundboard synth, browser speech preview hook
  components/three/          the single WebGL stage and every engine part
  components/sections/       the nine page sections, in narrative order
  components/interactive/    voice demo, sound deck, visual-state demo, creator studio preview
  components/navigation/     header + accessible mobile menu
  components/layout/         fixed stage layer, footer
  components/brand/Logo.tsx  the only place the logo is drawn
scripts/check-content.mjs    blocks restricted wording, currency symbols and purple-family colours
```

- **One scroll authority.** Lenis drives window scroll from GSAP's ticker; ScrollTrigger listens to it. With reduced motion Lenis is never created and native scroll is used.
- **One canvas.** A fixed, `pointer-events: none` canvas sits under all content. Every control is a DOM element; the 3D mirrors their state through `sceneStore` (no per-frame React state).
- **Deterministic choreography.** `useSceneDirector` measures each `section[data-scene]` and blends the two camera keyframes whose sections straddle the viewport centre (`lib/motion/keyframes.ts`). Any scroll position — including nav jumps — maps to exactly one camera state.
- **Lazy 3D.** three.js/R3F load in a dynamic chunk after first paint and font load; the post-processing stack is a further lazy chunk used on the high tier only. A static SVG rendition shows while loading and whenever WebGL is unavailable.

## Product claims and demos

The public site (hyperchat.space) and the V2 preview were not reachable from the build environment, so copy is written at the level of the product brief and the repository's earlier soundboard / alert-overlay work. Nothing on the page claims specific shipped V2 behaviour, numbers, customers or endorsements.

| Demo | What actually happens |
| --- | --- |
| Voice | Speaks the sample with the **browser's built-in speech engine** and says so. Falls back to a labelled visual-only preview when speech is unavailable. |
| Soundboard | Six original cues synthesized live with Web Audio (no samples), one at a time, through a limiter, with a persisted mute toggle. |
| Visuals | Local three-state composition (message → media → overlay), labelled "Illustrative composition — not a product screenshot". |
| Creator studio | Local state only, labelled "Concept preview · sample data". No backend calls anywhere on the page. |

## Brand assets

The official HyperChat logo file was not available to this build. `components/brand/Logo.tsx`, `public/brand/hyperchat-mark.svg` and `public/favicon.svg` hold a self-authored stand-in mark. Replace those three (and regenerate `public/og-image.png` / `public/brand/apple-touch-icon.png`) to apply the official logo everywhere.
