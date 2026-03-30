import { isZero } from 'gl/algorithms/isZero'
import { Blendshape } from 'blendshapes/BlendShape'
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
    getVertex(
        blendshapeParams: Float32Array,
        vertex?: Float32Array,
        skip?: Set<Blendshape>
    ): Float32Array {
        if (vertex === undefined) {
            vertex = new Float32Array(this._xyz.length)
        }
        vertex.set(this._xyz)
        for (let blendshape = 1; blendshape < Blendshape.SIZE - 1; ++blendshape) {
            if (skip && skip.has(blendshape)) {
                continue
            }
            const weight = blendshapeParams[blendshape]
            if (isZero(weight)) {
                continue
            }
            this._targets[blendshape].apply(vertex, weight)
        }
        return vertex
    }
    getMorphTarget(blendshape: Blendshape) {
        return this._targets[blendshape]
    }
}
