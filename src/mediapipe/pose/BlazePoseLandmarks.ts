import { mat4, vec3 } from "gl-matrix"
import { euler_matrix } from "lib/euler_matrix"
import { Blaze } from "./Blaze"

/**
 * Wrapper for Mediapipe's Pose Landmark Model (BlazePose GHUM 3D)
 */

export class BlazePoseLandmarks {
    data: Float32Array
    constructor(data: Float32Array = new Float32Array(3 * 33).fill(0)) {
        this.data = data
    }
    clone() {
        return new BlazePoseLandmarks(this.data.slice())
    }
    /**
     * rotate all landmarks (used for testing)
     */
    rotate(x: number, y: number, z: number) {
        this.mul(euler_matrix(x, y, z))
    }
    mul(m: mat4) {
        for (let i = 0; i < 33; ++i) {
            const v = this.getVec(i)
            vec3.transformMat4(v, v, m)
            this.setVec(i, v[0], v[1], v[2])
        }
    }
    getVec(index: Blaze) {
        const i = index * 3
        return vec3.fromValues(this.data[i], this.data[i + 1], this.data[i + 2])
    }

    setVec(index: Blaze, x: number, y: number, z: number): void
    setVec(index: Blaze, v: vec3): void
    setVec(index: Blaze, x: number | vec3, y?: number, z?: number): void {
        const i = index * 3
        if (typeof x === "number") {
            this.data[i] = x
            this.data[i + 1] = y!
            this.data[i + 2] = z!
        } else {
            const v = x as vec3
            this.data[i] = v[0]
            this.data[i + 1] = v[1]
            this.data[i + 2] = v[2]
        }
    }
}
