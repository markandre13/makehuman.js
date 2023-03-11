import { calculateNormals } from '../lib/calculateNormals'
import { ProgramInfo } from './ProgramInfo'

/**
 * I am a mesh which can be rendered by OpenGL.
 */
export class RenderMesh {
    gl: WebGL2RenderingContext
    vertex: WebGLBuffer
    normal: WebGLBuffer
    indices: WebGLBuffer
    length: number

    constructor(gl: WebGL2RenderingContext, vertex: number[], index: number[]) {
        this.gl = gl
        this.vertex = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, vertex)
        this.indices = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, Uint16Array, index)
        this.normal = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, calculateNormals(vertex, index))
        this.length = index.length
    }

    update(vertex: number[], index: number[]) {
        this.updateBuffer(this.vertex, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW, Float32Array, vertex)
        this.updateBuffer(this.normal, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW, Float32Array, calculateNormals(vertex, index))
    }

    draw(programInfo: ProgramInfo, mode: number) {
        this.bind(programInfo)
        this.drawSubset(mode, 0, this.length)
    }

    bind(programInfo: ProgramInfo) {
        const numComponents = 3, type = this.gl.FLOAT, normalize = false, stride = 0, offset = 0
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertex)
        this.gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, numComponents, type, normalize, stride, offset)
        this.gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normal)
        this.gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, numComponents, type, normalize, stride, offset)
        this.gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal)

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indices)
    }

    drawSubset(mode: number, offset: number, length: number) {
        this.gl.drawElements(mode, length, this.gl.UNSIGNED_SHORT, offset)
    }

    protected createBuffer(target: GLenum, usage: GLenum, type: Float32ArrayConstructor | Uint16ArrayConstructor, data: number[]): WebGLBuffer {
        const buffer = this.gl.createBuffer()
        if (buffer === null)
            throw Error('Failed to create new WebGLBuffer')
        this.updateBuffer(buffer, target, usage, type, data)
        return buffer
    }

    protected updateBuffer(buffer: WebGLBuffer, target: GLenum, usage: GLenum, type: Float32ArrayConstructor | Uint16ArrayConstructor, data: number[]): WebGLBuffer {
        this.gl.bindBuffer(target, buffer)
        this.gl.bufferData(target, new type(data), usage)
        return buffer
    }
}
