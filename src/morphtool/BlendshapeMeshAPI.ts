import { Blendshape } from "blendshapes/BlendShape"

/**
 * API providing data to render face blendshapes
 */
export interface BlendshapeMeshAPI {
    preload(): BlendshapeMeshAPI
    get fxyz(): number[]
    /**
     * xyz
     * @param blendshapeParams
     * @param blendshapeTransform transform for head
     * @param vertex destination
     */
    getVertex(blendshapeParams: Float32Array, vertex?: Float32Array, skip?: Set<Blendshape>): Float32Array
}
