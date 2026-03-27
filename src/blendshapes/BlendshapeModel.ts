import { Model } from "toad.js"
import { Blendshape } from "./BlendShape"
import { mat4 } from "gl-matrix"

export class BlendshapeModel extends Model {
    params: Float32Array = new Float32Array(Blendshape.SIZE)
    transform: Float32Array = new Float32Array(16)
    timestamp_ms: bigint = 0n

    set(params: Float32Array, transform: Float32Array, timestamp_ms: bigint) {
        this.params = params
        this.transform = transform
        this.timestamp_ms = timestamp_ms
        this.signal.emit()
    }

    getRotation(): mat4 {
        const t = this.transform
        return mat4.fromValues(
            t[0], t[4], t[8], 0,
            t[1], t[5], t[9], 0,
            t[2], t[6], t[10], 0,
            0, 0, 0, 1)
    }

    // getBlendshapeWeight(blendshape: Blendshape): number {
    //     return this._params[blendshape]
    // }
    // setBlendshapeWeights(blendshapes: Float32Array, transform: Float32Array): void {
    //     this._params.set(blendshapes)
    //     this._transform.set(transform)
    //     this.signal.emit()
    // }
    // setBlendshapeWeight(blendshape: Blendshape, weight: number) {
    //     this._params[blendshape] = weight
    //     this.signal.emit()
    // }
    // reset() {
    //     this._params.fill(0)
    //     this._transform.set([
    //         1, 0, 0, 0,
    //         0, 1, 0, 0,
    //         0, 0, 1, 0,
    //         0, 0, 0, 1
    //     ])
    //     this.signal.emit()
    // }
}
