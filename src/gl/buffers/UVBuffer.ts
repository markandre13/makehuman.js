import { Float32Buffer } from "./Float32Buffer"
import type { ShaderHasTexture } from "../interfaces/ShaderHasTexture"

export class UVBuffer extends Float32Buffer {
    bind(shader: ShaderHasTexture) {
        const numComponents = 2
        const type = this._gl.FLOAT
        const normalize = false
        const stride = 0
        const offset = 0
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this.glbuffer)
        this._gl.vertexAttribPointer(shader.textureCoord, numComponents, type, normalize, stride, offset)
        this._gl.enableVertexAttribArray(shader.textureCoord)
    }
}
