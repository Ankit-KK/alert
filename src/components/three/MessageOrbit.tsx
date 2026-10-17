import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { isMobileAspect } from '@/lib/motion/keyframes'
import { WORLD } from '@/lib/three/layout'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { engineState } from './engineState'
import { easeInOutCubic, easeOutCubic, useDisposable, type StageKit } from './kit'
import { ENGINE_MESSAGES, makeMessageTexture } from './textures'

type Home = [number, number, number]

/**
 * Docked home positions around the display (hero composition). On desktop the
 * cards render larger for legibility, so they sit a little wider of the media
 * frames and the headline; narrow viewports keep the compact layout.
 */
const HOMES: Home[] = [
  [-1.5, 2.45, 0.6],
  [1.65, 1.95, 0.4],
  [1.72, 0.3, 1.2],
  [-1.68, -0.25, 1.3],
  [0.35, -2.25, 1.9],
]
const HOMES_COMPACT: Home[] = [
  [-1.55, 2.05, 0.6],
  [1.65, 1.95, 0.4],
  [1.95, 0.3, 1.2],
  [-2.15, -0.25, 1.3],
  [0.35, -2.25, 1.9],
]

/** Desktop cards render larger than the kit's card slab so their copy stays legible. */
const CARD_SCALE = 1.22
/** Face plane: covers the slab's front, matching the texture's 640×168 aspect. */
const FACE: [number, number, number] = [1.53, 0.4016, 1]

const CYCLE = 3.8
const TRAVEL = 1.25
const RESPAWN = 0.7

const corePoint = new THREE.Vector3(WORLD.core[0], WORLD.core[1] + 0.45, WORLD.core[2])

/**
 * Live messages floating around the stream. On a fixed cadence one card
 * travels along its arc into the core; on arrival it triggers the core pulse,
 * the waveform, and the display alert — the page's core "interaction lands"
 * story, told without words.
 */
export function MessageOrbit({ kit, count, reduced }: { kit: StageKit; count: number; reduced: boolean }) {
  const messages = ENGINE_MESSAGES.slice(0, count)
  const compact = useThree((s) => isMobileAspect(s.size.width, s.size.height))
  const homes = compact ? HOMES_COMPACT : HOMES
  const cardScale = compact ? 1 : CARD_SCALE
  const textures = useDisposable(() => messages.map(makeMessageTexture), [count])
  const faceMats = useDisposable(
    () => textures.map((map) => new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false })),
    [textures],
  )
  const bodyMats = useDisposable(() => messages.map(() => kit.mat.graphite.clone()), [kit, count])

  // Arc from each docked home into the core, lifted through a control point.
  const curves = useMemo(
    () =>
      homes.slice(0, count).map((h) => {
        const start = new THREE.Vector3(...h)
        const mid = start.clone().lerp(corePoint, 0.5).add(new THREE.Vector3(0, 0.9, 0.9))
        return new THREE.CatmullRomCurve3([start, mid, corePoint])
      }),
    [count, homes],
  )
  const arcGeos = useDisposable(() => curves.map((c) => new THREE.TubeGeometry(c, 48, 0.006, 5, false)), [curves])
  const arcMat = useDisposable(() => kit.mat.arc.clone(), [kit])

  const cards = useRef<(THREE.Group | null)[]>([])
  const loop = useRef({ index: -1, startedAt: -10, nextAt: now() + 1.6 })
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }) => {
    const t = now()
    const sep = engineState.sep
    const L = loop.current

    if (!reduced && t >= L.nextAt) {
      L.index = (L.index + 1) % messages.length
      L.startedAt = t
      L.nextAt = t + CYCLE
    }

    arcMat.opacity = 0.2 * (1 - sep) * sceneStore.intro
    // As the scene separates, messages scatter outward and dissolve — they
    // "become" the voice, sound and media modules.
    const presence = 1 - Math.min(1, Math.max(0, (sep - 0.15) / 0.55))

    for (let i = 0; i < messages.length; i++) {
      const card = cards.current[i]
      if (!card) continue
      const home = homes[i]
      // Separated layout: push outward and toward the viewer.
      const spread = 1 + sep * 0.9
      tmp.set(home[0] * spread, home[1] * (1 + sep * 0.5), home[2] - sep * 1.5)
      if (!reduced) tmp.y += Math.sin(t * 0.8 + i * 1.7) * 0.06

      let scale = 1
      let opacity = 1
      if (i === L.index && sep < 0.5) {
        const age = t - L.startedAt
        if (age < TRAVEL) {
          const p = easeInOutCubic(age / TRAVEL)
          curves[i].getPoint(p, card.position)
          scale = 1 - p * 0.75
          opacity = 1 - Math.max(0, p - 0.7) / 0.3
        } else {
          if (L.startedAt > engineState.alertAt) {
            engineState.alertAt = t
            engineState.alertKind = messages[i].kind
            sceneStore.lastPulse = t
          }
          const back = easeOutCubic((age - TRAVEL - 0.25) / RESPAWN)
          card.position.copy(tmp)
          scale = 0.6 + back * 0.4
          opacity = back
        }
      } else {
        card.position.lerp(tmp, 0.12)
      }

      card.scale.setScalar(scale * cardScale * (0.75 + 0.25 * sceneStore.intro))
      card.lookAt(camera.position)
      faceMats[i].opacity = opacity * sceneStore.intro * presence
      bodyMats[i].opacity = opacity * sceneStore.intro * presence
      bodyMats[i].transparent = bodyMats[i].opacity < 0.999
      card.visible = faceMats[i].opacity > 0.01
    }
  })

  return (
    <group>
      {arcGeos.map((g, i) => (
        <mesh key={i} geometry={g} material={arcMat} />
      ))}
      {messages.map((m, i) => (
        <group
          key={m.user}
          ref={(el) => {
            cards.current[i] = el
          }}
          position={homes[i]}
        >
          <mesh geometry={kit.geo.card} material={bodyMats[i]} />
          <mesh geometry={kit.geo.plane} material={faceMats[i]} position={[0, 0, 0.028]} scale={FACE} />
        </group>
      ))}
    </group>
  )
}
