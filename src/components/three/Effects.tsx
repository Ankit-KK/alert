import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'

/**
 * High-tier post stack: a restrained bloom that only catches emissive
 * highlights (threshold near 1), filmic tone mapping, and a soft vignette.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.82} luminanceSmoothing={0.18} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.28} darkness={0.62} />
    </EffectComposer>
  )
}
