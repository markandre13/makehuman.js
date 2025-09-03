import { vec2, mat4, vec4 } from 'gl-matrix'
import { VertexBuffer } from 'gl/buffers/VertexBuffer'
import { ShaderMono } from 'gl/shaders/ShaderMono'
import { ShaderShadedMono } from 'gl/shaders/ShaderShadedMono'
import { ShaderShadedTextured } from 'gl/shaders/ShaderShadedTextured'
import { findVertex } from 'lib/distance'
import { RenderMesh } from 'render/RenderMesh'

export class FlatMesh {
    protected vertexOrig!: Float32Array
    protected vertexFlat!: Float32Array
    protected facesFlat!: number[]
    protected renderMesh!: RenderMesh

    bind(shader: ShaderMono | ShaderShadedMono | ShaderShadedTextured): void {
        this.renderMesh.bind(shader)
    }
    draw(gl: WebGL2RenderingContext): void {
        gl.drawElements(gl.TRIANGLES, this.facesFlat.length, gl.UNSIGNED_SHORT, 0)
    }
    findVertex(pos: vec2, canvas: HTMLCanvasElement, modelViewMatrix: mat4): number | undefined {
        return findVertex(pos, this.vertexOrig, canvas, modelViewMatrix)
    }
    getVec4(vertexIdx: number) {
        return vec4.fromValues(this.vertexOrig[vertexIdx], this.vertexOrig[vertexIdx + 1], this.vertexOrig[vertexIdx + 2], 1)
    }
    get vertices(): VertexBuffer {
        return this.renderMesh.glVertex
    }
}
