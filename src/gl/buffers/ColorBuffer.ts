import type { ShaderHasColors } from "../interfaces/ShaderHasColors"
import { Float32Buffer } from "./Float32Buffer"

// gl.UNSIGNED_BYTE
// Uint8Array

export class ColorBuffer extends Float32Buffer {
    bind(shader: ShaderHasColors) {
        const numComponents = 3 // RGB
        const type = this._gl.FLOAT
        const normalize = false
        const stride = 0
        const offset = 0
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.glbuffer)
        this._gl.vertexAttribPointer(shader.vertexColors, numComponents, type, normalize, stride, offset)
        this._gl.enableVertexAttribArray(shader.vertexColors)
    }
}
