import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { fovFor } from '@/lib/motion/keyframes'
import { sceneStore } from '@/lib/three/sceneStore'

/** Fog starts just behind the subject and clears the far background, wherever the shot puts the camera. */
const FOG_NEAR = 1
const FOG_FAR = 22

/**
 * Eases the camera toward the scroll rig (see useSceneDirector) and adds a
 * bounded pointer parallax on fine-pointer devices. Field of view widens on
 * single-column layouts, matching the shots the director frames for them.
 * Parts of the rig pinned to moving layout (sceneStore.track) are followed
 * tightly. With reduced motion the camera cuts straight to the rig, with no
 * easing or parallax (the reduced shots hold the hero framing until the brand
 * moment).
 */
export function CameraRig({ reduced, parallax }: { reduced: boolean; parallax: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const scene = useThree((s) => s.scene)
  const size = useThree((s) => s.size)
  const look = useMemo(() => new THREE.Vector3(...sceneStore.rig.target), [])
  const goal = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, dt) => {
    const rig = sceneStore.rig
    const snap = reduced || sceneStore.snap
    sceneStore.snap = false

    const fov = fovFor(size.width)
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = snap ? fov : THREE.MathUtils.damp(camera.fov, fov, 6, dt)
      camera.updateProjectionMatrix()
    }

    const px = parallax && !reduced ? sceneStore.pointer.x * 0.45 : 0
    const py = parallax && !reduced ? sceneStore.pointer.y * 0.25 : 0
    goal.set(rig.cam[0] + px, rig.cam[1] + py, rig.cam[2])

    if (snap) {
      camera.position.copy(goal)
      look.set(...rig.target)
    } else {
      const lambda = 3.2 + 60 * sceneStore.track
      camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.x, lambda, dt)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.y, lambda, dt)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.z, lambda, dt)
      look.x = THREE.MathUtils.damp(look.x, rig.target[0], lambda, dt)
      look.y = THREE.MathUtils.damp(look.y, rig.target[1], lambda, dt)
      look.z = THREE.MathUtils.damp(look.z, rig.target[2], lambda, dt)
    }
    camera.lookAt(look)

    if (scene.fog instanceof THREE.Fog) {
      const d = camera.position.distanceTo(look)
      scene.fog.near = d + FOG_NEAR
      scene.fog.far = d + FOG_FAR
    }
  })

  return null
}
