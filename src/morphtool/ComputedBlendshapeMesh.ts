import { isZero } from 'gl/algorithms/isZero'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { MorphTarget } from 'target/MorphTarget'
import { BlendshapeMeshAPI } from './BlendshapeMeshAPI'

export class ComputedBlendshapeMesh implements BlendshapeMeshAPI {
    private _targets: Array<MorphTarget>
    private _xyz!: Float32Array
    private _fxyz!: number[] // quads

    constructor(xyz: Float32Array, fxyz: number[], targets: Array<MorphTarget>) {
        this._xyz = xyz
        this._fxyz = fxyz
        this._targets = targets
    }

    preload(): BlendshapeMeshAPI {
        return this
    }
    get fxyz(): number[] {
        return this._fxyz
    }
    getVertex(blendshapeParams: Float32Array, blendshapeTransform: Float32Array, vertex?: Float32Array): Float32Array {
        if (vertex === undefined) {
            vertex = new Float32Array(this._xyz.length)
        }
        vertex.set(this._xyz)
        for (let blendshape = 1; blendshape < Blendshape.SIZE - 1; ++blendshape) {
            const weight = blendshapeParams[blendshape]
            if (isZero(weight)) {
                continue
            }
            this._targets[blendshape].apply(vertex, weight)
        }
        return vertex
    }
}
