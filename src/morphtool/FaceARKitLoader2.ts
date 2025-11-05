import { isZero } from 'gl/algorithms/isZero'
import { Blendshape } from 'mediapipe/blendshapeNames'
import { WavefrontObj } from 'mesh/WavefrontObj'
import { MorphTarget } from 'target/MorphTarget'

export interface BlendshapeMesh {
    preload(): BlendshapeMesh
    get fxyz(): number[]
    getVertex(blendshapeParams: Float32Array, blendshapeTransform: Float32Array, vertex?: Float32Array): Float32Array
}

export class FaceARKitLoader2 implements BlendshapeMesh {
    _targets = new Array<MorphTarget>(Blendshape.SIZE);
    _xyz = new Array<Float32Array>(Blendshape.SIZE);
    _neutral?: WavefrontObj

    /**
     * Load all blendshapes. Useful when doing live animation.
     */
    preload(): FaceARKitLoader2 {
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

        // scale and rotate 'vertex'
        // const t = blendshapeTransform
        // const m = mat4.fromValues(
        //     t[0], t[1], t[2], 0,
        //     t[4], t[5], t[6], 0,
        //     t[8], t[9], t[10], 0,
        //     0, 0, 0, 1
        // )
        // // const camera = di.get(Application).glview.ctx.camera
        // // const ic = mat4.clone(camera)
        // // mat4.invert(m, camera)
        // // mat4.multiply(m, ic, m)
        // // mat4.multiply(m, m, camera)
        // const v = vec3.create()
        // for (let i = 0; i < vertex.length; i += 3) {
        //     v[0] = vertex[i]
        //     v[1] = vertex[i + 1]
        //     v[2] = vertex[i + 2]
        //     vec3.transformMat4(v, v, m)
        //     vertex[i] = v[0]
        //     vertex[i + 1] = v[1]
        //     vertex[i + 2] = v[2]
        // }
        return vertex
    }
}
