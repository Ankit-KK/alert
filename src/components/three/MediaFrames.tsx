import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/lib/three/layout'
import { now } from '@/lib/three/sceneStore'
import { engineState } from './engineState'
import { lerp3, useDisposable, type StageKit } from './kit'
import { makeMediaTextures } from './textures'

const FRAMES: { x: number; y: number; z: number; ry: number }[] = [
  { x: -1.55, y: -0.05, z: 0.2, ry: 0.38 },
  { x: 0, y: 0.12, z: 0, ry: 0 },
  { x: 1.55, y: -0.05, z: 0.2, ry: -0.38 },
]

/**
 * Media station: three framed pieces a viewer might send — a looping GIF, a
 * replay clip (centre) and a reaction sticker. They fan open as the station
 * takes focus and the centre clip "pops" when a media interaction reaches the
 * core.
 */
export function MediaFrames({ kit, reduced }: { kit: StageKit; reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const frames = useRef<(THREE.Group | null)[]>([])
  const textures = useDisposable(makeMediaTextures)
  const mats = useDisposable(() => textures.map((map) => new THREE.MeshBasicMaterial({ map, toneMapped: false, color: '#EDEDEA' })), [textures])

  useFrame(() => {
    const t = now()
    const g = group.current
    if (!g) return
    const sep = engineState.sep
    const focus = engineState.focus[2]
    lerp3(WORLD.media.docked, WORLD.media.station, sep, g.position)
    g.scale.setScalar(0.5 + sep * 0.5)

    const mediaAge = engineState.alertKind === 'media' ? t - engineState.alertAt : 10
    const pop = mediaAge < 1.2 ? Math.sin(Math.min(1, mediaAge / 0.5) * Math.PI) * 0.08 : 0

    FRAMES.forEach((f, i) => {
      const el = frames.current[i]
      if (!el) return
      const fan = 1 + focus * 0.25
      el.position.set(f.x * fan, f.y + (reduced ? 0 : Math.sin(t * 0.9 + i * 2) * 0.05), f.z + focus * (i === 1 ? 0.4 : 0))
      el.rotation.y = f.ry * (1 - focus * 0.4)
      el.scale.setScalar(1 + (i === 1 ? pop : 0))
    })
  })

  return (
    <group ref={group} position={WORLD.media.docked}>
      {FRAMES.map((f, i) => (
        <group
          key={i}
          ref={(el) => {
            frames.current[i] = el
          }}
          position={[f.x, f.y, f.z]}
          rotation={[0, f.ry, 0]}
        >
          <mesh geometry={kit.geo.frame} material={kit.mat.ceramic} />
          <mesh geometry={kit.geo.plane} material={mats[i]} position={[0, 0, 0.028]} scale={[1.24, 0.93, 1]} />
        </group>
      ))}
    </group>
  )
}
