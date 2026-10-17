import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/lib/three/layout'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { engineState } from './engineState'
import { lerp3, useDisposable, type StageKit } from './kit'
import { makeVoicePanelTexture, PALETTE } from './textures'

const SEGMENTS = 96
const WIDTH = 2.5

/** Builds a flat strip whose vertices are displaced every frame into a ribbon. */
function makeRibbon(height: number) {
  return new THREE.PlaneGeometry(WIDTH, height, SEGMENTS, 1)
}

/**
 * Voice station: a smoked-graphite panel carrying a sample voice message, with
 * two audio ribbons in front of it. The ribbons follow the voice preview's word
 * boundaries (and soundboard output) so the visual is tied to real playback.
 */
export function VoiceModule({ kit, reduced, lowDetail }: { kit: StageKit; reduced: boolean; lowDetail: boolean }) {
  const group = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const face = useDisposable(makeVoicePanelTexture)
  const faceMat = useDisposable(() => new THREE.MeshBasicMaterial({ map: face, transparent: true, depthWrite: false, toneMapped: false }), [face])
  const ribbonA = useDisposable(() => makeRibbon(0.05))
  const ribbonB = useDisposable(() => makeRibbon(0.022))
  const matA = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: PALETTE.teal, emissive: PALETTE.cyan, emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 0.3 }),
  )
  const matB = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: '#D9DDD8', emissive: PALETTE.ivory, emissiveIntensity: 0.15, side: THREE.DoubleSide, roughness: 0.5 }),
  )
  const amp = useRef(0)

  useFrame((_, dt) => {
    const t = now()
    const g = group.current
    if (g) {
      const sep = engineState.sep
      lerp3(WORLD.voice.docked, WORLD.voice.station, sep, g.position)
      g.scale.setScalar(0.5 + sep * 0.5)
      const focus = engineState.focus[0]
      g.rotation.y = 0.28 - focus * 0.12 + (reduced ? 0 : Math.sin(t * 0.5) * 0.03)
      g.rotation.x = -0.04
      if (!reduced) g.position.y += Math.sin(t * 0.7 + 1) * 0.05
    }

    const word = Math.exp(-(t - sceneStore.voiceWord) * 5)
    const target = sceneStore.voiceActive ? 0.12 + word * 0.22 : 0.025 + sceneStore.audioLevel * 0.15
    amp.current = THREE.MathUtils.damp(amp.current, target, 10, dt)
    matA.emissiveIntensity = 0.5 + amp.current * 6
    if (light.current) light.current.intensity = 0.4 + amp.current * 18

    if (reduced && !sceneStore.voiceActive) return
    for (const [geo, phase, scale] of [
      [ribbonA, 0, 1],
      [ribbonB, 1.7, 0.6],
    ] as const) {
      const pos = geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const col = i % (SEGMENTS + 1)
        const u = col / SEGMENTS
        const x = (u - 0.5) * WIDTH
        const env = Math.sin(u * Math.PI)
        const wave = Math.sin(u * 18 + t * 6 + phase) * 0.6 + Math.sin(u * 41 - t * 9 + phase) * 0.4
        const yOffset = i > SEGMENTS ? -geo.parameters.height / 2 : geo.parameters.height / 2
        pos.setXYZ(i, x, yOffset + wave * env * amp.current * scale * 2.2, Math.cos(u * 9 + t * 2 + phase) * 0.08 * env)
      }
      pos.needsUpdate = true
    }
  })

  return (
    <group ref={group} position={WORLD.voice.docked}>
      <mesh geometry={kit.geo.slab} material={kit.mat.graphite} />
      <mesh geometry={kit.geo.plane} material={faceMat} position={[0, 0.06, 0.045]} scale={[2.2, 1.24, 1]} />
      <mesh geometry={kit.geo.plane} material={kit.mat.glass} position={[0, 0, 0.05]} scale={[2.2, 1.26, 1]} />
      <group position={[0, -0.2, 0.32]}>
        <mesh geometry={ribbonA} material={matA} />
        <mesh geometry={ribbonB} material={matB} position={[0, -0.02, 0.06]} />
      </group>
      {!lowDetail && <pointLight ref={light} color={PALETTE.cyan} position={[0, -0.1, 0.9]} distance={3.5} decay={2} />}
    </group>
  )
}
