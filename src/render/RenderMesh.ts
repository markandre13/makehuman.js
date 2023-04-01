import { calculateNormals } from '../lib/calculateNormals'
import { GLProgram, ProgramRGBA, ProgramTexture } from './ProgramInfo'

/**
 * I am a mesh which can be rendered by OpenGL.
 */
export class RenderMesh {
    gl: WebGL2RenderingContext
    vertex: WebGLBuffer
    normal: WebGLBuffer
    indices: WebGLBuffer
    texture?: WebGLBuffer
    length: number

    constructor(gl: WebGL2RenderingContext, vertex: number[], index: number[], texture?: number[]) {
        this.gl = gl
        this.vertex = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, vertex)
        this.indices = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, Uint16Array, index)
        this.normal = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, calculateNormals(vertex, index))
        if (texture !== undefined) {
            this.texture = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, texture)
        }
        this.length = index.length
    }

    update(vertex: number[], index: number[]) {
        this.updateBuffer(this.vertex, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW, Float32Array, vertex)
        this.updateBuffer(this.normal, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW, Float32Array, calculateNormals(vertex, index))
    }

    draw(programInfo: GLProgram, mode: number) {
        this.bind(programInfo)
        this.drawSubset(mode, 0, this.length)
    }

    bind(programInfo: GLProgram) {
        programInfo.bind(this.indices, this.vertex, this.normal, this.texture)
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