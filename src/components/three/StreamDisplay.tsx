import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { WORLD } from '@/lib/three/layout'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { engineState } from './engineState'
import { easeOutCubic, useDisposable, type StageKit } from './kit'
import { makeAlertTexture, makeScreenTexture, type InteractionKind } from './textures'

const KINDS: InteractionKind[] = ['chat', 'voice', 'sound', 'media']
const ALERT_HOLD = 2.4
/** Screen plane size (16:9) and the alert's resting spot in the footage's open top-right sky. */
const SCREEN: [number, number, number] = [3.3, 1.856, 1]
const ALERT_X = 0.83
const ALERT_SLIDE = 0.22

/**
 * The creator's broadcast: a machined display showing the race footage with
 * stream chrome, plus an on-screen alert that slides in whenever an
 * interaction lands.
 */
export function StreamDisplay({ kit }: { kit: StageKit }) {
  const screen = useDisposable(makeScreenTexture)
  const alerts = useDisposable(() => KINDS.map(makeAlertTexture))
  const alertMat = useDisposable(
    () => new THREE.MeshBasicMaterial({ map: alerts[0], transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    [alerts],
  )
  const screenMat = useDisposable(() => new THREE.MeshBasicMaterial({ map: screen, color: '#FFFFFF', toneMapped: false }), [screen])
  const stripMat = useDisposable(() => kit.mat.cyanGlow.clone(), [kit])

  const alertRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const t = now()
    const age = t - engineState.alertAt
    const alert = alertRef.current
    if (alert) {
      const kindIndex = KINDS.indexOf(engineState.alertKind)
      if (alertMat.map !== alerts[kindIndex]) alertMat.map = alerts[kindIndex]
      const inT = easeOutCubic(age / 0.45)
      const out = age > ALERT_HOLD ? easeOutCubic((age - ALERT_HOLD) / 0.4) : 0
      alertMat.opacity = Math.max(0, inT - out)
      alert.position.x = ALERT_X + (1 - inT) * ALERT_SLIDE
    }
    const pulse = Math.exp(-(t - sceneStore.lastPulse) * 3)
    stripMat.emissiveIntensity = 0.5 + pulse * 2.2 + sceneStore.audioLevel * 1.5
  })

  return (
    <group position={WORLD.display}>
      <mesh geometry={kit.geo.display} material={kit.mat.graphite} />
      <mesh geometry={kit.geo.plane} material={screenMat} position={[0, 0.02, 0.071]} scale={SCREEN} />
      <mesh geometry={kit.geo.plane} material={kit.mat.glass} position={[0, 0.02, 0.078]} scale={SCREEN} />
      <mesh ref={alertRef} geometry={kit.geo.plane} material={alertMat} position={[ALERT_X, 0.64, 0.085]} scale={[1.48, 0.331, 1]} />
      {/* Light strip and neck tie the display to the core below. */}
      <mesh material={stripMat} position={[0, -1.07, 0.03]}>
        <boxGeometry args={[2.6, 0.018, 0.02]} />
      </mesh>
      <mesh material={kit.mat.brushed} position={[0, -1.25, 0.15]}>
        <cylinderGeometry args={[0.05, 0.07, 0.36, 16]} />
      </mesh>
    </group>
  )
}
