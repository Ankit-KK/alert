import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/lib/three/layout'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { engineState } from './engineState'
import { lerp3, useDisposable, type StageKit } from './kit'
import { makeVoicePanelTexture, PALETTE } from './textures'

const SEGMENTS = 96
/** Ribbon length: inside the 2.2-wide face with margin for the panel's yaw. */
const WIDTH = 1.9
const HEIGHT = 0.05

/**
 * Lays the ribbon's two vertex rows along a waveform of the given amplitude.
 * The strip's thickness tapers with the envelope, so both ends come to a point.
 */
function shapeRibbon(pos: THREE.BufferAttribute, t: number, amp: number) {
  for (let i = 0; i < pos.count; i++) {
    const u = (i % (SEGMENTS + 1)) / SEGMENTS
    const env = Math.sin(u * Math.PI)
    const wave = Math.sin(u * 18 + t * 6) * 0.6 + Math.sin(u * 41 - t * 9) * 0.4
    const edge = ((i > SEGMENTS ? -HEIGHT : HEIGHT) / 2) * Math.sqrt(env)
    pos.setXYZ(i, (u - 0.5) * WIDTH, edge + wave * env * amp * 1.6, Math.cos(u * 9 + t * 2) * 0.03 * env)
  }
  pos.needsUpdate = true
}

/**
 * Voice station: a smoked-graphite panel carrying a sample voice message, with
 * an audio ribbon just in front of it. The ribbon follows the voice preview's
 * word boundaries (and soundboard output) so the visual is tied to real
 * playback, and tapers to a point at both ends.
 */
export function VoiceModule({ kit, reduced, lowDetail }: { kit: StageKit; reduced: boolean; lowDetail: boolean }) {
  const group = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const face = useDisposable(makeVoicePanelTexture)
  const faceMat = useDisposable(() => new THREE.MeshBasicMaterial({ map: face, transparent: true, depthWrite: false, toneMapped: false }), [face])
  const ribbon = useDisposable(() => {
    const geo = new THREE.PlaneGeometry(WIDTH, HEIGHT, SEGMENTS, 1)
    shapeRibbon(geo.attributes.position as THREE.BufferAttribute, 0, 0)
    return geo
  })
  const ribbonMat = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: PALETTE.teal, emissive: PALETTE.cyan, emissiveIntensity: 0.6, side: THREE.DoubleSide, roughness: 0.3 }),
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
    ribbonMat.emissiveIntensity = 0.5 + amp.current * 6
    if (light.current) light.current.intensity = 0.4 + amp.current * 18

    if (reduced && !sceneStore.voiceActive) return
    shapeRibbon(ribbon.attributes.position as THREE.BufferAttribute, t, amp.current)
  })

  return (
    <group ref={group} position={WORLD.voice.docked}>
      <mesh geometry={kit.geo.slab} material={kit.mat.graphite} />
      <mesh geometry={kit.geo.plane} material={faceMat} position={[0, 0.06, 0.045]} scale={[2.2, 1.24, 1]} />
      <mesh geometry={kit.geo.plane} material={kit.mat.glass} position={[0, 0, 0.05]} scale={[2.2, 1.26, 1]} />
      {/* Just clear of the glass (z 0.05), so it reads as part of the panel. */}
      <mesh geometry={ribbon} material={ribbonMat} position={[0, -0.2, 0.1]} />
      {/* Below the panel: lights the ribbon and slab edge without a specular dot on the glass. */}
      {!lowDetail && <pointLight ref={light} color={PALETTE.cyan} position={[0, -1, 0.45]} distance={3.5} decay={2} />}
    </group>
  )
}
