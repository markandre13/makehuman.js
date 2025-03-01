import { mat4, vec3 } from "gl-matrix"
import { Blaze } from "./Blaze"
import { BlazePoseLandmarks } from "./BlazePoseLandmarks"

/**
 * Helper to create BlazePoseLandmarks for testing
 */
export class DrawStack {
    private stack: mat4[] = [mat4.create()];
    private top() {
        return this.stack[this.stack.length - 1]
    }

    private push() {
        this.stack.push(mat4.clone(this.top()))
    }
    private pop() {
        --this.stack.length
    }
    down(block: () => void) {
        this.push()
        block()
        this.pop()
    }
    mul(m: mat4) {
        mat4.mul(this.top(), this.top(), m)
    }
    translate(x: number, y: number, z: number) {
        this.mul(mat4.fromTranslation(mat4.create(), vec3.fromValues(x, y, z)))
    }
    set(pose: BlazePoseLandmarks, index: Blaze) {
        const v = vec3.create()
        vec3.transformMat4(v, v, this.top())
        pose.setVec(index, v[0], v[1], v[2])
    }
}
