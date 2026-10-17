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
 * This component owns the damped separation/focus values every module reads,
 * and the hero reveal (driven by sceneStore.intro).
 */
export function Engine({ tier, reduced }: { tier: QualityTier; reduced: boolean }) {
  const low = tier === 'low'
  const kit = useStageKit(low)
  const root = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
    const { rig, intro } = sceneStore
    const speed = reduced ? 100 : 2.6
    engineState.sep = THREE.MathUtils.damp(engineState.sep, reduced ? 0 : rig.sep, speed, dt)
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
  })

  return (
    <group ref={root}>
      <StreamDisplay kit={kit} />
      <Core kit={kit} lowDetail={low} reduced={reduced} />
      <WaveRing count={low ? 32 : 56} reduced={reduced} />
      <MessageOrbit kit={kit} count={low ? 4 : 5} reduced={reduced} />
      <VoiceModule kit={kit} reduced={reduced} lowDetail={low} />
      <PadCluster kit={kit} reduced={reduced} />
      <MediaFrames kit={kit} reduced={reduced} />
    </group>
  )
}
