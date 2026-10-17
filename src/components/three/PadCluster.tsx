import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/lib/three/layout'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { SOUND_PADS, type PadTone } from '@/content/site'
import { engineState } from './engineState'
import { lerp3, useDisposable, type StageKit } from './kit'
import { padLabels, PALETTE } from './textures'

const TONE: Record<PadTone, string> = { cyan: PALETTE.cyan, signal: PALETTE.signal, mint: PALETTE.mint }
const COLS = 3
const PITCH = 0.82

const padXY = (i: number): [number, number] => [((i % COLS) - (COLS - 1) / 2) * PITCH, (Math.floor(i / COLS) - 0.5) * -PITCH]

/**
 * Soundboard station: six machined pads on a tilted deck. They mirror the DOM
 * pad deck — hover/focus lifts a pad, a strike presses it down, flashes its
 * tone colour, sends a ring outward, and ripples through its neighbours.
 */
export function PadCluster({ kit, reduced }: { kit: StageKit; reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const caps = useRef<(THREE.Group | null)[]>([])
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const labels = useDisposable(padLabels)
  const labelMats = useDisposable(
    () => labels.map((map) => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false })),
    [labels],
  )
  const capMats = useDisposable(
    () =>
      SOUND_PADS.map(
        (p) => new THREE.MeshStandardMaterial({ color: '#232E34', roughness: 0.55, metalness: 0.25, emissive: TONE[p.tone], emissiveIntensity: 0 }),
      ),
  )
  const ringMats = useDisposable(
    () => SOUND_PADS.map((p) => new THREE.MeshBasicMaterial({ color: TONE[p.tone], transparent: true, opacity: 0, depthWrite: false })),
  )
  const ringGeo = useDisposable(() => new THREE.RingGeometry(0.4, 0.43, 48))
  const lift = useRef(SOUND_PADS.map(() => 0))
  const seenHits = useRef(SOUND_PADS.map(() => -10))

  useFrame((_, dt) => {
    const t = now()
    const g = group.current
    if (g) {
      const sep = engineState.sep
      lerp3(WORLD.pads.docked, WORLD.pads.station, sep, g.position)
      g.scale.setScalar(0.5 + sep * 0.5)
      if (!reduced) g.position.y += Math.sin(t * 0.6) * 0.04
    }

    // Most recent strike drives the neighbour ripple.
    let lastIndex = -1
    let lastHit = -10
    sceneStore.padHits.forEach((h, i) => {
      if (h > lastHit) {
        lastHit = h
        lastIndex = i
      }
      if (h > seenHits.current[i]) {
        seenHits.current[i] = h
        engineState.alertKind = 'sound'
        engineState.alertAt = h
      }
    })
    const [lx, ly] = lastIndex >= 0 ? padXY(lastIndex) : [0, 0]

    SOUND_PADS.forEach((_, i) => {
      const cap = caps.current[i]
      const age = t - sceneStore.padHits[i]
      const hovered = sceneStore.padHover === i
      let target = hovered ? 0.06 : 0
      if (age < 0.14) target = -0.07
      if (lastIndex >= 0 && i !== lastIndex && !reduced) {
        const [x, y] = padXY(i)
        const d = Math.hypot(x - lx, y - ly)
        const rippleAge = t - lastHit
        target += 0.035 * Math.exp(-rippleAge * 5) * Math.sin(rippleAge * 22 - d * 5) / (1 + d)
      }
      lift.current[i] = THREE.MathUtils.damp(lift.current[i], target, age < 0.14 ? 40 : 14, dt)
      if (cap) cap.position.z = 0.14 + lift.current[i]

      capMats[i].emissiveIntensity = Math.exp(-Math.max(0, age) * 2.6) * 1.4 + (hovered ? 0.12 : 0)

      const ring = rings.current[i]
      if (ring) {
        const p = Math.min(1, age / 0.8)
        ring.scale.setScalar(1 + p * 1.8)
        ringMats[i].opacity = age < 0.8 ? (1 - p) * 0.8 : 0
      }
    })
  })

  return (
    <group ref={group} position={WORLD.pads.docked}>
      <group rotation={[-0.62, -0.32, -0.04]}>
        {SOUND_PADS.map((pad, i) => {
          const [x, y] = padXY(i)
          return (
            <group key={pad.id} position={[x, y, 0]}>
              <mesh geometry={kit.geo.padBase} material={kit.mat.brushed} />
              <group
                ref={(el) => {
                  caps.current[i] = el
                }}
                position={[0, 0, 0.14]}
              >
                <mesh geometry={kit.geo.padCap} material={capMats[i]} />
                <mesh geometry={kit.geo.plane} material={labelMats[i]} position={[0, 0, 0.062]} scale={[0.5, 0.5, 1]} />
              </group>
              <mesh
                ref={(el) => {
                  rings.current[i] = el
                }}
                geometry={ringGeo}
                material={ringMats[i]}
                position={[0, 0, 0.1]}
              />
            </group>
          )
        })}
      </group>
    </group>
  )
}
