import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { PALETTE } from './textures'

/**
 * Shared materials and geometries for the stage. Created once per stage
 * mount, reused across meshes, and disposed when the stage unmounts.
 */
export interface StageKit {
  mat: {
    graphite: THREE.MeshStandardMaterial
    brushed: THREE.MeshStandardMaterial
    ceramic: THREE.MeshStandardMaterial
    glass: THREE.MeshPhysicalMaterial
    cyanGlow: THREE.MeshStandardMaterial
    signalGlow: THREE.MeshStandardMaterial
    arc: THREE.MeshBasicMaterial
  }
  geo: {
    card: RoundedBoxGeometry
    padBase: RoundedBoxGeometry
    padCap: RoundedBoxGeometry
    frame: RoundedBoxGeometry
    slab: RoundedBoxGeometry
    display: RoundedBoxGeometry
    plane: THREE.PlaneGeometry
  }
}

export function useStageKit(lowDetail: boolean): StageKit {
  const kit = useMemo<StageKit>(() => {
    const seg = lowDetail ? 2 : 4
    return {
      mat: {
        graphite: new THREE.MeshStandardMaterial({ color: PALETTE.raised, roughness: 0.62, metalness: 0.35 }),
        brushed: new THREE.MeshStandardMaterial({ color: '#3A464C', roughness: 0.32, metalness: 0.88 }),
        ceramic: new THREE.MeshStandardMaterial({ color: '#E6E3D8', roughness: 0.45, metalness: 0 }),
        glass: new THREE.MeshPhysicalMaterial({
          color: '#0F1B20',
          roughness: 0.08,
          metalness: 0,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        }),
        cyanGlow: new THREE.MeshStandardMaterial({
          color: PALETTE.teal,
          emissive: PALETTE.cyan,
          emissiveIntensity: 1,
          roughness: 0.4,
        }),
        signalGlow: new THREE.MeshStandardMaterial({
          color: PALETTE.signal,
          emissive: PALETTE.signal,
          emissiveIntensity: 1,
          roughness: 0.4,
        }),
        arc: new THREE.MeshBasicMaterial({ color: PALETTE.teal, transparent: true, opacity: 0.35, depthWrite: false }),
      },
      geo: {
        card: new RoundedBoxGeometry(1.55, 0.42, 0.05, seg, 0.06),
        padBase: new RoundedBoxGeometry(0.72, 0.72, 0.16, seg, 0.08),
        padCap: new RoundedBoxGeometry(0.6, 0.6, 0.12, seg, 0.09),
        frame: new RoundedBoxGeometry(1.36, 1.06, 0.05, seg, 0.04),
        slab: new RoundedBoxGeometry(2.3, 1.35, 0.08, seg, 0.07),
        display: new RoundedBoxGeometry(3.52, 2.08, 0.14, seg, 0.08),
        plane: new THREE.PlaneGeometry(1, 1),
      },
    }
  }, [lowDetail])

  useEffect(
    () => () => {
      Object.values(kit.mat).forEach((m) => m.dispose())
      Object.values(kit.geo).forEach((g) => g.dispose())
    },
    [kit],
  )

  return kit
}

type Disposable = { dispose: () => void }

/**
 * Creates GPU resources (textures, cloned materials, …) with a factory and
 * disposes them when the deps change or the component unmounts.
 */
export function useDisposable<T extends Disposable | Disposable[]>(factory: () => T, deps: unknown[] = []): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps)
  useEffect(
    () => () => {
      ;(Array.isArray(value) ? value : [value]).forEach((t) => t.dispose())
    },
    [value],
  )
  return value
}

export const damp = THREE.MathUtils.damp
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}
export const lerp3 = (a: readonly number[], b: readonly number[], t: number, out: THREE.Vector3) =>
  out.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
