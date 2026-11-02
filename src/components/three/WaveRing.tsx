import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/lib/three/layout'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { useDisposable } from './kit'
import { PALETTE } from './textures'

const RADIUS = 1.06
/**
 * Tallest a tick may grow where the HC mark floats above the ring (|x| under
 * ~0.85, front and back). Ticks this short stay below the mark on screen from
 * every keyframe camera, including the mobile hero's low angle, so neither
 * the bars nor their glow ever cross the logo.
 */
const UNDER_MARK_MAX = 0.12
/** Tallest a tick may grow at the ring's sides, clear of the mark. */
const SIDE_MAX = 0.3
const dummy = new THREE.Object3D()

/**
 * A radial equaliser around the core, drawn as one instanced mesh of fine
 * ticks. It idles as a low, even dial and rises as a waveform whenever an
 * interaction lands or audio plays: at the sides, never across the mark.
 */
export function WaveRing({ count, reduced }: { count: number; reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  // Per-tick height limit, easing from UNDER_MARK_MAX to SIDE_MAX by distance from the centre line.
  const limits = useMemo(
    () =>
      Float32Array.from({ length: count }, (_, i) => {
        const side = THREE.MathUtils.smoothstep(Math.abs(Math.cos((i / count) * Math.PI * 2)) * RADIUS, 0.8, 1.02)
        return UNDER_MARK_MAX + (SIDE_MAX - UNDER_MARK_MAX) * side
      }),
    [count],
  )
  const material = useDisposable(
    () => new THREE.MeshStandardMaterial({ color: '#3B474D', roughness: 0.6, metalness: 0.2, emissive: PALETTE.cyan, emissiveIntensity: 0.06 }),
  )
  const geometry = useDisposable(() => new THREE.BoxGeometry(0.018, 1, 0.045))

  useEffect(() => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      dummy.position.set(Math.cos(a) * RADIUS, 0.04, Math.sin(a) * RADIUS)
      dummy.rotation.set(0, -a, 0)
      dummy.scale.set(1, 0.035, 1)
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
    material.emissiveIntensity = 0.06 + energy * 1.4

    if (reduced && energy < 0.01) return
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      const wave =
        0.5 + 0.5 * Math.sin(a * 3 + t * 5.3) * Math.sin(a * 5 - t * 3.1) + 0.25 * Math.sin(a * 11 + t * 9)
      const h = Math.min(
        limits[i],
        0.035 + energy * (0.1 + Math.max(0, wave) * 0.55) + (reduced ? 0 : 0.008 * (1 + Math.sin(t * 1.4 + i * 0.35))),
      )
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
