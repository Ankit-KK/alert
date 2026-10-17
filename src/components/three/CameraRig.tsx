import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DESKTOP_KEYFRAMES, MOBILE_KEYFRAMES, isMobileAspect } from '@/lib/motion/keyframes'
import { sceneStore } from '@/lib/three/sceneStore'

/**
 * Eases the camera toward the scroll rig (see useSceneDirector) and adds a
 * bounded pointer parallax on fine-pointer devices. Field of view widens on
 * portrait screens so the composition is reframed rather than cropped.
 * With reduced motion the camera holds the hero framing.
 */
export function CameraRig({ reduced, parallax }: { reduced: boolean; parallax: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const look = useMemo(() => new THREE.Vector3(...sceneStore.rig.target), [])
  const goal = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    const mobile = isMobileAspect(size.width, size.height)
    const fov = mobile ? 45 : 35
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = THREE.MathUtils.damp(camera.fov, fov, 6, dt)
      camera.updateProjectionMatrix()
    }

    const rig = reduced ? (mobile ? MOBILE_KEYFRAMES.top : DESKTOP_KEYFRAMES.top) : sceneStore.rig
    const px = parallax && !reduced ? sceneStore.pointer.x * 0.45 : 0
    const py = parallax && !reduced ? sceneStore.pointer.y * 0.25 : 0
    const lambda = reduced ? 100 : 3.2

    goal.set(rig.cam[0] + px, rig.cam[1] + py, rig.cam[2])
    camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.x, lambda, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.y, lambda, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.z, lambda, dt)

    look.x = THREE.MathUtils.damp(look.x, rig.target[0], lambda, dt)
    look.y = THREE.MathUtils.damp(look.y, rig.target[1], lambda, dt)
    look.z = THREE.MathUtils.damp(look.z, rig.target[2], lambda, dt)
    camera.lookAt(look)
  })

  return null
}
