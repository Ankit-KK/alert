import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/lib/three/layout'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { useDisposable } from './kit'
import { PALETTE } from './textures'

const RADIUS = 1.08
const dummy = new THREE.Object3D()

/**
 * A radial equaliser around the core, drawn as one instanced mesh. It idles
 * near flat and rises as a waveform whenever an interaction lands or audio
 * plays.
 */
export function WaveRing({ count, reduced }: { count: number; reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const material = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: '#D7DCD9', roughness: 0.5, metalness: 0.1, emissive: PALETTE.cyan, emissiveIntensity: 0 }),
  )
  const geometry = useDisposable(() => new THREE.BoxGeometry(0.035, 1, 0.06))

  useEffect(() => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      dummy.position.set(Math.cos(a) * RADIUS, 0.04, Math.sin(a) * RADIUS)
      dummy.rotation.set(0, -a, 0)
      dummy.scale.set(1, 0.06, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [count])

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const t = now()
    const pulse = Math.exp(-(t - sceneStore.lastPulse) * 2.2)
    const voice = sceneStore.voiceActive ? 0.35 + Math.exp(-(t - sceneStore.voiceWord) * 6) * 0.6 : 0
    const energy = Math.min(1.2, pulse + sceneStore.audioLevel * 1.2 + voice)
    material.emissiveIntensity = energy * 1.6

    if (reduced && energy < 0.01) return
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const wave =
        0.5 + 0.5 * Math.sin(a * 3 + t * 5.3) * Math.sin(a * 5 - t * 3.1) + 0.25 * Math.sin(a * 11 + t * 9)
      const h = 0.05 + energy * (0.12 + Math.max(0, wave) * 0.55) + (reduced ? 0 : 0.015 * Math.sin(t * 1.4 + i))
      dummy.position.set(Math.cos(a) * RADIUS, h / 2 - 0.02, Math.sin(a) * RADIUS)
      dummy.rotation.set(0, -a, 0)
      dummy.scale.set(1, h, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={[WORLD.core[0], WORLD.core[1] + 0.12, WORLD.core[2]]}>
      <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />
    </group>
  )
}
