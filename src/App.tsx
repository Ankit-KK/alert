import { useRef, useState } from 'react'
import { SmoothScrollProvider } from '@/lib/motion/SmoothScroll'
import { useSceneDirector } from '@/lib/motion/useSceneDirector'
import type { SectionId } from '@/content/site'
import { StageLayer } from '@/components/layout/StageLayer'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteNav } from '@/components/navigation/SiteNav'
import { Hero } from '@/components/sections/Hero'
import { Features } from '@/components/sections/Features'
import { Voice } from '@/components/sections/Voice'
import { Soundboard } from '@/components/sections/Soundboard'
import { Visuals } from '@/components/sections/Visuals'
import { Control } from '@/components/sections/Control'
import { HowItWorks } from '@/components/sections/HowItWorks'
import { BrandMoment } from '@/components/sections/BrandMoment'
import { FinalCta } from '@/components/sections/FinalCta'

/**
 * Stacking order (no transformed ancestors around fixed layers):
 *   z-0   StageLayer — fixed WebGL canvas / static fallback + dim veil, inert
 *   z-10  main content — all text and controls
 *   z-50  navigation
 *   z-60  film grain (pointer-events: none)
 */
function Homepage() {
  const dimRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<SectionId>('top')
  useSceneDirector({ dimRef, veilRef, onActiveChange: setActive })

  return (
    <>
      <StageLayer dimRef={dimRef} veilRef={veilRef} />
      <SiteNav active={active} />
      <main id="main" tabIndex={-1} className="relative z-10">
        <Hero />
        <Features />
        <Voice />
        <Soundboard />
        <Visuals />
        <Control />
        <HowItWorks />
        <BrandMoment />
        <FinalCta />
      </main>
      <SiteFooter />
      <div className="grain" aria-hidden="true" />
    </>
  )
}

export default function App() {
  return (
    <SmoothScrollProvider>
      <Homepage />
    </SmoothScrollProvider>
  )
}
