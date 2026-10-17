import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useDisposable } from './kit'
import { PALETTE } from './textures'

/** Slow atmospheric dust that gives the stage depth. Positions are seeded once. */
export function Dust({ count, reduced }: { count: number; reduced: boolean }) {
  const points = useRef<THREE.Points>(null)
  const geometry = useDisposable(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    let seed = 7
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 26
      pos[i * 3 + 1] = (rand() - 0.5) * 14 + 0.5
      pos[i * 3 + 2] = (rand() - 0.5) * 16 - 3
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [count])
  const material = useDisposable(
    () => new THREE.PointsMaterial({ color: PALETTE.mist, size: 0.028, sizeAttenuation: true, transparent: true, opacity: 0.5, depthWrite: false }),
  )

  useFrame((_, dt) => {
    if (reduced || !points.current) return
    points.current.rotation.y += dt * 0.008
    points.current.position.y = Math.sin(performance.now() / 9000) * 0.25
  })

  return <points ref={points} geometry={geometry} material={material} />
}
