import { isZero } from 'gl/algorithms/isZero'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { WavefrontObj } from 'mesh/WavefrontObj'
import { MorphTarget } from 'target/MorphTarget'
import { BlendshapeMeshAPI } from './BlendshapeMeshAPI'

export class ARKitBlendshapeMesh implements BlendshapeMeshAPI {
    _targets = new Array<MorphTarget>(Blendshape.SIZE);
    _xyz = new Array<Float32Array>(Blendshape.SIZE);
    _neutral?: WavefrontObj

    /**
     * Load all blendshapes. Useful when doing live animation.
     */
    preload(): ARKitBlendshapeMesh {
        for (let blendshape = 1; blendshape < Blendshape.SIZE - 1; ++blendshape) {
            this.getMorphTarget(blendshape)
        }
        return this
    }

    get fxyz(): number[] { return this.getNeutral().fxyz }

    xyz(blendshape: Blendshape): Float32Array {
        let xyz = this._xyz[blendshape]
        if (xyz !== undefined) {
            return xyz
        }
        this.getMorphTarget(blendshape)
        return this._xyz[blendshape]
    }

    getNeutral(): WavefrontObj {
        if (this._neutral === undefined) {
            this._neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
            this._xyz[Blendshape.neutral] = this._neutral.xyz
            this.transformToMatchMakehumanFace(this._neutral.xyz)
        }
        return this._neutral
    }

    transformToMatchMakehumanFace(xyz: Float32Array | Array<number>) {
        const scale = 9.4
        const dy = 7.08
        const dz = 0.93

        for (let i = 0; i < xyz.length; ++i) {
            xyz[i] *= scale
        }
        for (let i = 1; i < xyz.length; i += 3) {
            xyz[i] += dy
        }
        for (let i = 2; i < xyz.length; i += 3) {
            xyz[i] += dz
        }
    }

    getMorphTarget(blendshape: Blendshape): MorphTarget | undefined {
        this.getNeutral()
        if (blendshape === Blendshape.neutral) {
            return undefined
        }

        let target = this._targets[blendshape]
        if (target !== undefined) {
            return target
        }

        const name = Blendshape[blendshape]
        const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)

        target = new MorphTarget()
        this.transformToMatchMakehumanFace(dst.xyz)
        target.diff(this._neutral!.xyz, dst.xyz)
        this._targets[blendshape] = target
        this._xyz[blendshape] = dst.xyz
        return target
    }

    /**
     * get blended vertices
     *
     * @param blendshapeParams
     * @returns
     */
    getVertex(blendshapeParams: Float32Array, blendshapeTransform: Float32Array, vertex?: Float32Array): Float32Array {
        // copy 'neutral' to 'vertex'
        const neutral = this.getNeutral()
        if (vertex === undefined) {
            vertex = new Float32Array(neutral.xyz.length)
        }
        vertex.set(this._neutral!.xyz)
        // apply blendshapes to 'vertex'
        for (let blendshape = 1; blendshape < Blendshape.SIZE - 1; ++blendshape) {
            const weight = blendshapeParams[blendshape]
            if (isZero(weight)) {
                continue
            }
            this.getMorphTarget(blendshape)?.apply(vertex, weight)
        }
        return vertex
    }
}
