import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import markSvg from '@/assets/hyperchat-mark.svg?raw'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { useDisposable } from './kit'

/** Gradient stops sampled from the supplied HC mark artwork, left → right. */
const STOPS = ['#095CFF', '#0A3AFF', '#2719F8', '#5D00E5', '#8F00DC', '#C700D6', '#EF05D4'].map((c) => new THREE.Color(c))

function gradientAt(t: number, out: THREE.Color) {
  const x = Math.min(0.9999, Math.max(0, t)) * (STOPS.length - 1)
  const i = Math.floor(x)
  return out.copy(STOPS[i]).lerp(STOPS[i + 1], x - i)
}

/**
 * Builds a bevelled, extruded HC mark from the official vector artwork and
 * paints the logo's gradient onto it as vertex colours (computed in linear
 * space so the faces read like the flat logo under studio light).
 */
function buildEmblemGeometry(width: number, lowDetail: boolean) {
  const data = new SVGLoader().parse(markSvg)
  const shapes = data.paths.flatMap((p) => p.toShapes())
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: 46,
    bevelEnabled: true,
    bevelThickness: 7,
    bevelSize: 5,
    bevelSegments: lowDetail ? 1 : 3,
    curveSegments: lowDetail ? 6 : 14,
  })
  geo.computeBoundingBox()
  const box = geo.boundingBox!
  const size = new THREE.Vector3()
  box.getSize(size)
  // Centre, flip SVG's downward Y, and scale to world units.
  geo.translate(-(box.min.x + size.x / 2), -(box.min.y + size.y / 2), -(box.min.z + size.z / 2))
  const s = width / size.x
  geo.scale(s, -s, s)
  geo.computeVertexNormals()

  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    gradientAt((pos.getX(i) + width / 2) / width, c)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

/**
 * The HyperChat mark as a physical object at the heart of the engine. It
 * sways gently toward the camera (never a full spin, so it stays legible)
 * and kicks up in scale whenever an interaction lands on the core.
 */
export function BrandEmblem({ lowDetail, reduced, width = 0.86 }: { lowDetail: boolean; reduced: boolean; width?: number }) {
  const group = useRef<THREE.Group>(null)
  const geometry = useDisposable(() => buildEmblemGeometry(width, lowDetail), [width, lowDetail])
  const face = useDisposable(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.12, emissive: '#ffffff', emissiveIntensity: 0 }),
  )
  // Side walls carry the same gradient, deepened and more metallic, like anodised edges.
  const side = useDisposable(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, color: '#8a9396', roughness: 0.3, metalness: 0.55 }),
  )
  // ExtrudeGeometry groups: 0 = front/back caps, 1 = side walls.
  const materials = [face, side]

  useFrame(() => {
    const g = group.current
    if (!g) return
    const t = now()
    const pulse = Math.exp(-(t - sceneStore.lastPulse) * 3.2)
    face.emissiveIntensity = pulse * 0.22
    g.scale.setScalar(1 + pulse * 0.06)
    if (!reduced) {
      g.rotation.y = Math.sin(t * 0.45) * 0.38
      g.position.y = Math.sin(t * 0.9) * 0.025
    }
  })

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={materials} />
    </group>
  )
}
