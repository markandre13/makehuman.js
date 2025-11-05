import { Float32Buffer } from "./Float32Buffer"
import type { ShaderHasPositions } from "../interfaces/ShaderHasPositions"
import { vec3 } from "gl-matrix"

export class VertexBuffer extends Float32Buffer {
    bind(shader: ShaderHasPositions) {
        const numComponents = 3
        const type = this._gl.FLOAT
        const normalize = false
        const stride = 0
        const offset = 0
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.glbuffer)
        this._gl.vertexAttribPointer(shader.vertexPositions, numComponents, type, normalize, stride, offset)
        this._gl.enableVertexAttribArray(shader.vertexPositions)
    }
    get(index: number): vec3 {
        const i = index * 3
        if (i >= this._data.length) {
            throw RangeError(`VertexBuffer.get(${index}) is out of range ${this._data.length / 3}`)
        }
        return vec3.fromValues(this._data[i], this._data[i + 1], this._data[i + 2])
    }
}
