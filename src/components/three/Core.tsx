import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/lib/three/layout'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { useDisposable, type StageKit } from './kit'
import { PALETTE } from './textures'

/**
 * The interaction core: a machined puck with a gyroscopic ring stack. Every
 * interaction that reaches it spins the rings up, flares the groove light and
 * sends a shockwave across the base plane. Audio playback drives its light.
 */
export function Core({ kit, lowDetail, reduced }: { kit: StageKit; lowDetail: boolean; reduced: boolean }) {
  const rings = useRef<THREE.Group>(null)
  const wave = useRef<THREE.Mesh>(null)
  const light = useRef<THREE.PointLight>(null)
  const groove = useDisposable(() => kit.mat.cyanGlow.clone(), [kit])
  const lens = useDisposable(() => kit.mat.cyanGlow.clone(), [kit])
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

    groove.emissiveIntensity = 0.6 + energy * 2.4
    lens.emissiveIntensity = 0.9 + energy * 2
    if (light.current) light.current.intensity = 1.2 + energy * 9

    const g = rings.current
    if (g && !reduced) {
      spin.current += dt * (0.25 + energy * 2.2)
      g.children.forEach((ring, i) => {
        ring.rotation.y = spin.current * (i % 2 ? -1 : 1) * (1 + i * 0.35)
        const s = 1 + pulse * 0.08 * (i + 1)
        ring.scale.setScalar(s)
      })
    }

    const w = wave.current
    if (w) {
      const p = Math.min(1, age / 1.1)
      w.scale.setScalar(0.8 + p * 2.4)
      waveMat.opacity = age < 1.1 ? (1 - p) * 0.45 : 0
    }
  })

  return (
    <group position={WORLD.core}>
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

      {/* Gyroscopic ring stack: each ring is tilted, then precesses around the vertical axis. */}
      <group ref={rings} position={[0, 0.5, 0]}>
        {[0.3, 0.41, 0.52].map((r, i) => (
          <group key={r}>
            <mesh material={i === 1 ? kit.mat.ceramic : kit.mat.brushed} rotation={[Math.PI / 2 + (i - 1) * 0.32, 0, 0]}>
              <torusGeometry args={[r, i === 1 ? 0.018 : 0.012, 10, seg]} />
            </mesh>
          </group>
        ))}
      </group>

      <mesh ref={wave} material={waveMat} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.92, 0.96, seg]} />
      </mesh>
      <pointLight ref={light} color={PALETTE.cyan} position={[0, 0.7, 0.3]} distance={6} decay={2} intensity={1.2} />
    </group>
  )
}
