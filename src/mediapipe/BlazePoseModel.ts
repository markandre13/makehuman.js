import { mat4, vec3 } from "gl-matrix"
import { deg2rad } from "gl/algorithms/deg2rad"
import { Model } from "toad.js"

const V = vec3.create()
const M = mat4.create()

export class BlazePoseModel extends Model {
    pose: Float32Array = new Float32Array()
    timestamp_ms: bigint = 0n

    set(pose: Float32Array, timestamp_ms: bigint) {
        this.pose = pose
        this.timestamp_ms = timestamp_ms
        this.signal.emit()
    }
    getXYZ(out: Float32Array) {
        const M = mat4.create()
        mat4.rotateX(M, M, deg2rad(160))
        const s = 10
        mat4.scale(M, M, vec3.fromValues(s, s, s))
        for (let i = 0, o = 0; i < this.pose.length; i += 2) {
            vec3.set(V, this.pose[i++], this.pose[i++], this.pose[i++])
            vec3.transformMat4(V, V, M)
            out[o++] = V[0]
            out[o++] = V[1]
            out[o++] = V[2]
        }
    }
}