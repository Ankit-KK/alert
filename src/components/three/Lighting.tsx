import { Environment, Lightformer } from '@react-three/drei'
import { PALETTE } from './textures'

/**
 * Studio lighting: broad neutral key, cyan rim from behind-left, a small warm
 * accent on the pad side, and low ambient fill. Reflections come from a tiny
 * procedural environment built from light cards — no HDR downloads.
 */
export function Lighting({ lowDetail }: { lowDetail: boolean }) {
  return (
    <>
      <ambientLight intensity={0.22} color="#C9D3D6" />
      <directionalLight position={[4, 6, 7]} intensity={1.7} color={PALETTE.ivory} />
      <directionalLight position={[-6, 2.5, -5]} intensity={2.2} color={PALETTE.cyan} />
      {!lowDetail && <pointLight position={[4.6, 0.6, 2.6]} intensity={5} distance={7} decay={2} color={PALETTE.signal} />}
      <Environment resolution={lowDetail ? 64 : 128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color={PALETTE.ivory} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={2.5} color={PALETTE.cyan} position={[-6, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.6} color={PALETTE.signal} position={[6, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[2, 0.6, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#7C8A90" position={[0, -3, 4]} rotation-x={-Math.PI / 2} scale={[10, 4, 1]} />
      </Environment>
    </>
  )
}
