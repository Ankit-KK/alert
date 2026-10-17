import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sceneStore } from '@/lib/three/sceneStore'
import type { QualityTier } from '@/lib/three/capabilities'
import { Core } from './Core'
import { engineState } from './engineState'
import { easeOutCubic, useStageKit } from './kit'
import { MediaFrames } from './MediaFrames'
import { MessageOrbit } from './MessageOrbit'
import { PadCluster } from './PadCluster'
import { StreamDisplay } from './StreamDisplay'
import { VoiceModule } from './VoiceModule'
import { WaveRing } from './WaveRing'

/**
 * The HyperChat Interaction Engine — the page's single 3D composition.
 *
 * Hierarchy (world space, see lib/three/layout.ts):
 *   StreamDisplay  the creator's broadcast, behind the core
 *   Core + WaveRing  where interactions land and become sound/light
 *   MessageOrbit   live messages travelling into the core
 *   Voice / Pads / Media  feature modules that separate to their stations
 *
 * This component owns the damped separation/focus/solo values every module
 * reads, and the hero reveal (driven by sceneStore.intro). In brand-solo
 * sections everything but the core folds inward and hides, leaving the HC
 * mark alone on stage.
 */
export function Engine({ tier, reduced }: { tier: QualityTier; reduced: boolean }) {
  const low = tier === 'low'
  const kit = useStageKit(low)
  const root = useRef<THREE.Group>(null)
  const modules = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    const { rig, intro } = sceneStore
    const speed = reduced ? 100 : 2.6
    engineState.sep = THREE.MathUtils.damp(engineState.sep, reduced ? 0 : rig.sep, speed, dt)
    engineState.solo = THREE.MathUtils.damp(engineState.solo, rig.solo, reduced ? 100 : 3.2, dt)
    for (let i = 0; i < 3; i++) {
      engineState.focus[i] = THREE.MathUtils.damp(engineState.focus[i], reduced ? 0 : rig.focus[i], speed, dt)
    }

    const g = root.current
    if (g) {
      const e = easeOutCubic(intro)
      g.scale.setScalar(0.88 + 0.12 * e)
      g.position.y = (1 - e) * -0.5
      g.rotation.y = (1 - e) * -0.25
    }

    const m = modules.current
    if (m) {
      const fold = 1 - easeOutCubic(1 - engineState.solo)
      m.visible = fold < 0.995
      m.scale.setScalar(Math.max(0.001, 1 - fold))
    }
  })

  return (
    <group ref={root}>
      <Core kit={kit} lowDetail={low} reduced={reduced} />
      <group ref={modules}>
        <StreamDisplay kit={kit} />
        <WaveRing count={low ? 48 : 96} reduced={reduced} />
        <MessageOrbit kit={kit} count={low ? 4 : 5} reduced={reduced} />
        <VoiceModule kit={kit} reduced={reduced} lowDetail={low} />
        <PadCluster kit={kit} reduced={reduced} />
        <MediaFrames kit={kit} reduced={reduced} />
      </group>
    </group>
  )
}
