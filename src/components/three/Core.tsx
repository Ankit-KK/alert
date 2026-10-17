import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/lib/three/layout'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { BrandEmblem } from './BrandEmblem'
import { engineState } from './engineState'
import { easeOutCubic, useDisposable, type StageKit } from './kit'
import { PALETTE } from './textures'

/** Where the HC badge sits above the puck, and where it rises to in brand-solo sections. */
const BADGE_Y = 0.74
const SOLO_Y = 1.22
const SOLO_SCALE = 1.7

/**
 * The interaction core: a machined puck with the HyperChat mark floating
 * above it, framed by a halo of counter-rotating arcs set behind the mark (so
 * nothing ever cuts through the logo). Every interaction that reaches the core
 * spins the halo up, flares the groove light and sends a shockwave across the
 * base plane. Audio playback drives its light.
 */
export function Core({ kit, lowDetail, reduced }: { kit: StageKit; lowDetail: boolean; reduced: boolean }) {
  const base = useRef<THREE.Group>(null)
  const badge = useRef<THREE.Group>(null)
  const halo = useRef<THREE.Group>(null)
  const wave = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const groove = useDisposable(() => kit.mat.cyanGlow.clone(), [kit])
  const lens = useDisposable(() => kit.mat.cyanGlow.clone(), [kit])
  const arcGlow = useDisposable(() => kit.mat.cyanGlow.clone(), [kit])
  const waveMat = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: PALETTE.cyan, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
    [],
  )
  const spin = useRef(0)
  const seg = lowDetail ? 40 : 72

  useFrame((_, dt) => {
    const t = now()
    const age = t - sceneStore.lastPulse
    const pulse = Math.exp(-age * 3)
    const level = sceneStore.audioLevel
    const energy = Math.min(1.4, pulse + level)
    const solo = easeOutCubic(engineState.solo)

    groove.emissiveIntensity = 0.6 + energy * 2.4
    lens.emissiveIntensity = 0.9 + energy * 2
    arcGlow.emissiveIntensity = 0.5 + energy * 2.2
    if (light.current) light.current.intensity = 1.2 + energy * 9

    const b = base.current
    if (b) {
      b.visible = solo < 0.995
      b.scale.setScalar(Math.max(0.001, 1 - solo))
    }
    const g = badge.current
    if (g) {
      g.position.y = BADGE_Y + (SOLO_Y - BADGE_Y) * solo
      g.scale.setScalar(1 + (SOLO_SCALE - 1) * solo)
    }

    const h = halo.current
    if (h) h.scale.setScalar(1 - 0.18 * solo)
    if (h && !reduced) {
      spin.current += dt * (0.18 + energy * 1.8)
      h.children.forEach((arc, i) => {
        arc.rotation.z = spin.current * (i % 2 ? -1 : 1) * (1 + i * 0.4)
        arc.scale.setScalar(1 + pulse * 0.04 * (i + 1))
      })
    }

    const w = wave.current
    if (w) {
      const p = Math.min(1, age / 1.1)
      w.scale.setScalar(0.8 + p * 2.4)
      waveMat.opacity = age < 1.1 && solo < 0.5 ? (1 - p) * 0.45 : 0
    }
  })

  return (
    <group position={WORLD.core}>
      <group ref={base}>
        <mesh material={kit.mat.brushed} position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.7, 0.8, 0.26, seg]} />
        </mesh>
        <mesh material={kit.mat.graphite} position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.62, 0.66, 0.06, seg]} />
        </mesh>
        <mesh material={groove} position={[0, 0.085, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.68, 0.014, 8, seg]} />
        </mesh>
        <mesh material={kit.mat.brushed} position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.17, 0.2, 0.09, 32]} />
        </mesh>
        <mesh material={lens} position={[0, 0.218, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.15, 32]} />
        </mesh>
        <mesh ref={wave} material={waveMat} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.92, 0.96, seg]} />
        </mesh>
      </group>

      <group ref={badge} position={[0, BADGE_Y, 0]}>
        <BrandEmblem lowDetail={lowDetail} reduced={reduced} width={1.08} />
        {/* Halo: open arcs in the plane behind the mark, never intersecting it. */}
        <group ref={halo} position={[0, 0, -0.2]}>
          <mesh material={kit.mat.ceramic}>
            <torusGeometry args={[0.84, 0.012, 8, seg, Math.PI * 1.55]} />
          </mesh>
          <mesh material={arcGlow}>
            <torusGeometry args={[0.92, 0.007, 6, seg, Math.PI * 0.6]} />
          </mesh>
          <mesh material={kit.mat.brushed}>
            <torusGeometry args={[0.99, 0.006, 6, seg, Math.PI * 1.1]} />
          </mesh>
        </group>
        <pointLight ref={light} color={PALETTE.cyan} position={[0.5, 0.55, 0.9]} distance={6} decay={2} intensity={1.2} />
      </group>
    </group>
  )
}
