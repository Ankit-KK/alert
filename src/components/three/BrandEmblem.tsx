import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import markSvg from '@/assets/hyperchat-mark.svg?raw'
import { now, sceneStore } from '@/lib/three/sceneStore'
import { engineState } from './engineState'
import { useDisposable } from './kit'

/**
 * The official gradient (#095CFF #0A3AFF #2719F8 #5D00E5 #8F00DC #C700D6
 * #EF05D4, spanning x 4…406 of the 410-unit artwork), stored as the
 * linear-light inputs that the stage's ACES Filmic tone mapping (exposure
 * 1.05, applied in post on the high tier and per material otherwise) maps back
 * onto those exact colours. ACES cannot show the first two blues at full
 * intensity without skewing them violet, so they land a touch deeper (#105AE2,
 * #1038E5) but keep their hue. Solved offline by least squares in sRGB.
 */
const FACE_STOPS: readonly (readonly [number, number, number])[] = [
  [0, 0.0955, 0.9253],
  [0, 0.0473, 0.9856],
  [0, 0.0143, 1.3162],
  [0.0916, 0, 0.9876],
  [0.2156, 0.0022, 0.7865],
  [0.4494, 0.0104, 0.6859],
  [0.7785, 0, 0.6441],
]
const GRADIENT_X0 = 4
const GRADIENT_X1 = 406

/**
 * One texel per stop. Linear filtering between texel centres reproduces the
 * gradient, and half-float storage keeps the values above 1 that the blue end
 * needs.
 */
function makeGradientTexture() {
  const data = new Uint16Array(FACE_STOPS.length * 4)
  FACE_STOPS.forEach((stop, i) => {
    data.set([...stop, 1].map(THREE.DataUtils.toHalfFloat), i * 4)
  })
  const texture = new THREE.DataTexture(data, FACE_STOPS.length, 1, THREE.RGBAFormat, THREE.HalfFloatType)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

/** Maps an artwork x coordinate to its spot in the one-texel-per-stop gradient. */
function gradientU(x: number) {
  const t = Math.min(1, Math.max(0, (x - GRADIENT_X0) / (GRADIENT_X1 - GRADIENT_X0)))
  return (0.5 + t * (FACE_STOPS.length - 1)) / FACE_STOPS.length
}

/**
 * The supplied mark is a bitmap trace: one closed outline of ~460 tiny Béziers
 * that walk in 0.25–0.5 unit stair-steps. Flat in the DOM that is invisible,
 * but extruded and lit, every step becomes a facet, and a bevel inset on steps
 * that small folds over itself. For the 3D mark only, the outline is resampled
 * evenly, low-pass filtered and simplified (all in artwork units), leaving
 * about 200 points within a fraction of a unit of the original silhouette.
 */
const STEP = 0.25
const SMOOTH_SIGMA = 1
const TOLERANCE = 0.12

let outlineCache: THREE.Vector2[] | null = null

function markOutline() {
  if (outlineCache) return outlineCache
  const shape = new SVGLoader().parse(markSvg).paths[0].toShapes()[0]
  const src = shape.getPoints(6)
  if (src.length > 1 && src[0].equals(src[src.length - 1])) src.pop()

  // Resample the closed outline at equal arc-length steps.
  const lengths = src.map((p, i) => p.distanceTo(src[(i + 1) % src.length]))
  const total = lengths.reduce((a, b) => a + b, 0)
  const count = Math.round(total / STEP)
  const ds = total / count
  const even: THREE.Vector2[] = []
  for (let j = 0, k = 0, acc = 0; j < count; j++) {
    const s = j * ds
    while (acc + lengths[k] < s) acc += lengths[k++]
    even.push(src[k].clone().lerp(src[(k + 1) % src.length], lengths[k] ? (s - acc) / lengths[k] : 0))
  }

  // Circular Gaussian low-pass: removes the trace's stair-steps.
  const radius = Math.ceil((SMOOTH_SIGMA * 3) / ds)
  const weights = Array.from({ length: radius * 2 + 1 }, (_, q) => Math.exp(-0.5 * (((q - radius) * ds) / SMOOTH_SIGMA) ** 2))
  const weightSum = weights.reduce((a, b) => a + b, 0)
  const smooth = even.map((_, j) => {
    const p = new THREE.Vector2()
    weights.forEach((w, q) => p.addScaledVector(even[(j + q - radius + count) % count], w))
    return p.divideScalar(weightSum)
  })

  // Douglas–Peucker, run on the two halves of the loop.
  const keep = new Uint8Array(count)
  let far = 0
  smooth.forEach((p, j) => {
    if (p.distanceToSquared(smooth[0]) > smooth[far].distanceToSquared(smooth[0])) far = j
  })
  keep[0] = keep[far] = 1
  const line = new THREE.Line3()
  const a3 = new THREE.Vector3()
  const b3 = new THREE.Vector3()
  const p3 = new THREE.Vector3()
  const closest = new THREE.Vector3()
  const simplify = (from: number, to: number) => {
    line.set(a3.set(smooth[from].x, smooth[from].y, 0), b3.set(smooth[to % count].x, smooth[to % count].y, 0))
    let best = -1
    let bestDist = TOLERANCE
    for (let j = from + 1; j < to; j++) {
      const d = line.closestPointToPoint(p3.set(smooth[j].x, smooth[j].y, 0), true, closest).distanceTo(p3)
      if (d > bestDist) {
        bestDist = d
        best = j
      }
    }
    if (best < 0) return
    keep[best] = 1
    simplify(from, best)
    simplify(best, to)
  }
  simplify(0, far)
  simplify(far, count)

  outlineCache = smooth.filter((_, j) => keep[j])
  return outlineCache
}

/**
 * Extrudes the cleaned outline with a slim rounded bevel. The bevel is inset
 * (bevelOffset = -bevelSize), so the side walls trace the official silhouette
 * exactly. The logo gradient is mapped by x onto every face through UVs.
 */
function buildEmblemGeometry(width: number, lowDetail: boolean) {
  const bevel = 2
  const raw = new THREE.ExtrudeGeometry(new THREE.Shape(markOutline()), {
    depth: 54,
    bevelEnabled: true,
    bevelThickness: 3,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: lowDetail ? 2 : 3,
    curveSegments: 1,
  })
  const pos = raw.attributes.position
  const uv = raw.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, gradientU(pos.getX(i)), 0.5)
  // Smooth across the bevel steps and the outline's gentle turns, keep the
  // H's square corners crisp. Done in artwork units, where its position hash
  // (0.01) is far finer than any edge.
  const geo = toCreasedNormals(raw, THREE.MathUtils.degToRad(50))

  geo.computeBoundingBox()
  const box = geo.boundingBox!
  const size = new THREE.Vector3()
  box.getSize(size)
  geo.translate(-(box.min.x + size.x / 2), -(box.min.y + size.y / 2), -(box.min.z + size.z / 2))
  // Flip SVG's downward Y and scale to world units. Z flips too so the
  // transform stays a rotation (positive determinant): a lone mirror would
  // reverse every triangle's winding and turn the mesh inside out.
  const s = width / size.x
  geo.scale(s, -s, -s)
  return geo
}

/**
 * The HyperChat mark as a physical object at the heart of the engine. The
 * faces are unlit and carry the official gradient (pre-compensated for tone
 * mapping), so no stage light, glow or pulse can tint the artwork; only the
 * bevel and side walls are lit, like satin anodised metal. It sways gently
 * toward the camera (never a full spin, so it stays legible) and kicks up in
 * scale whenever an interaction lands on the core, except in brand-solo
 * sections, where it holds still.
 */
export function BrandEmblem({ lowDetail, reduced, width = 0.86 }: { lowDetail: boolean; reduced: boolean; width?: number }) {
  const group = useRef<THREE.Group>(null)
  const geometry = useDisposable(() => buildEmblemGeometry(width, lowDetail), [width, lowDetail])
  const gradient = useDisposable(makeGradientTexture)
  const face = useDisposable(() => new THREE.MeshBasicMaterial({ map: gradient, fog: false }), [gradient])
  // Satin walls: diffuse only, so lights can shade them but never add the
  // white specular sheen (strongest at the grazing angles walls are seen at)
  // that would wash the gradient toward pastel. A faint in-hue glow keeps them
  // from ever falling to black.
  const side = useDisposable(
    () =>
      new THREE.MeshLambertMaterial({
        map: gradient,
        color: '#C8C8C8',
        emissive: '#ffffff',
        emissiveMap: gradient,
        emissiveIntensity: 0.3,
      }),
    [gradient],
  )
  // ExtrudeGeometry groups: 0 = front/back caps, 1 = bevel and side walls.
  const materials = [face, side]

  useFrame(() => {
    const g = group.current
    if (!g) return
    const t = now()
    const kick = Math.exp(-(t - sceneStore.lastPulse) * 3.2) * (1 - engineState.solo)
    g.scale.setScalar(1 + kick * 0.06)
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
