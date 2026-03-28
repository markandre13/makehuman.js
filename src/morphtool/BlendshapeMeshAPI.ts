import { Blendshape } from "blendshapes/BlendShape"

/**
 * API providing data to render face blendshapes
 */
export interface BlendshapeMeshAPI {
    preload(): BlendshapeMeshAPI
    get fxyz(): number[]
    /**
     * apply blendshapes to vertex
     * 
     * @param blendshapeParams
     * @param vertex destination
     * @param skip list of blendshapes to 
     */
    getVertex(blendshapeParams: Float32Array, vertex?: Float32Array, skip?: Set<Blendshape>): Float32Array
}
