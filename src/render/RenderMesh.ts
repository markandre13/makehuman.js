import { calculateNormalsQuads, calculateNormalsTriangles } from "../lib/calculateNormals"
import { AbstractShader } from "./shader/AbstractShader"

interface GLXYZUV {
    idxExtra: number[]
    indices: number[]
    vertex: Float32Array
    texcoord?: Float32Array
}

/**
 * I am a mesh which can be rendered by OpenGL.
 * a) convert quads to triangles
 * b) join fxyz and fuv into one list
 * c) calculate normals
 */
export class RenderMesh {
    gl: WebGL2RenderingContext
    glIndices: WebGLBuffer
    glVertex: WebGLBuffer
    glNormal: WebGLBuffer
    glTexture?: WebGLBuffer

    fvertex: number[]
    normal: Float32Array
    glData: GLXYZUV
    quads: boolean

    constructor(
        gl: WebGL2RenderingContext,
        vertex: Float32Array,
        fvertex: number[],
        uvs?: Float32Array,
        fuvs?: number[],
        quads = true
    ) {
        this.gl = gl
        this.fvertex = fvertex
        this.quads = quads

        if (quads === false) {
            this.glIndices = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, Uint16Array, fvertex)
            this.glVertex = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, vertex)
            this.normal = new Float32Array(vertex.length)
            calculateNormalsTriangles(this.normal, vertex, fvertex)
            this.glNormal = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, this.normal)
            this.glData = {
                indices: fvertex,
            } as GLXYZUV
            return
        }

        const glData = decoupleXYZandUV(vertex, fvertex, uvs, fuvs)
        this.glData = glData
        this.glIndices = this.createBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW, Uint16Array, glData.indices)
        this.glVertex = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, glData.vertex)
        if (glData.texcoord) {
            this.glTexture = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, glData.texcoord)
        }

        this.normal = new Float32Array(glData.vertex.length)
        calculateNormalsQuads(this.normal, vertex, fvertex)
        this.glData.idxExtra.forEach((v, i) => {
            this.normal[vertex.length + i * 3] = this.normal[v * 3]
            this.normal[vertex.length + i * 3 + 1] = this.normal[v * 3 + 1]
            this.normal[vertex.length + i * 3 + 2] = this.normal[v * 3 + 2]
        })

        this.glNormal = this.createBuffer(gl.ARRAY_BUFFER, gl.STATIC_DRAW, Float32Array, this.normal)
    }

    update(vertex: Float32Array) {
        if (this.quads) {
            this.glData.vertex.set(vertex)
            calculateNormalsQuads(this.normal, vertex, this.fvertex)

            this.glData.idxExtra.forEach((v, i) => {
                this.glData.vertex[vertex.length + i * 3] = vertex[v * 3]
                this.glData.vertex[vertex.length + i * 3 + 1] = vertex[v * 3 + 1]
                this.glData.vertex[vertex.length + i * 3 + 2] = vertex[v * 3 + 2]

                this.normal[vertex.length + i * 3] = this.normal[v * 3]
                this.normal[vertex.length + i * 3 + 1] = this.normal[v * 3 + 1]
                this.normal[vertex.length + i * 3 + 2] = this.normal[v * 3 + 2]
            })
            // prettier-ignore
            this.updateBuffer(this.glVertex, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW, Float32Array, this.glData.vertex)
            this.updateBuffer(this.glNormal, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW, Float32Array, this.normal)
        } else {
            this.updateBuffer(this.glVertex, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW, Float32Array, vertex)
            calculateNormalsTriangles(this.normal, vertex, this.fvertex)
            this.updateBuffer(this.glNormal, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW, Float32Array, this.normal)
        }
    }

    draw(programInfo: AbstractShader, mode: number) {
        this.bind(programInfo)
        this.gl.drawElements(mode, this.glData.indices.length, this.gl.UNSIGNED_SHORT, 0)
    }

    bind(programInfo: AbstractShader): void {
        programInfo.bind(this.glIndices, this.glVertex, this.glNormal, this.glTexture)
    }

    drawSubset(mode: number, offset: number, length: number) {
        this.gl.drawElements(mode, (length / 4) * 6, this.gl.UNSIGNED_SHORT, (offset / 4) * 6)
    }

    protected createBuffer(
        target: GLenum,
        usage: GLenum,
        type: Float32ArrayConstructor | Uint16ArrayConstructor,
        data: number[] | Float32Array
    ): WebGLBuffer {
        const buffer = this.gl.createBuffer()
        if (buffer === null) {
            throw Error("Failed to create new WebGLBuffer")
        }
        this.updateBuffer(buffer, target, usage, type, data)
        return buffer
    }

    protected updateBuffer(
        buffer: WebGLBuffer,
        target: GLenum,
        usage: GLenum,
        type: Float32ArrayConstructor | Uint16ArrayConstructor,
        data: number[] | Float32Array
    ) {
        this.gl.bindBuffer(target, buffer)
        if (data instanceof Float32Array) {
            this.gl.bufferData(target, data, usage)
            return
        }
        if (data instanceof Int16Array) {
            this.gl.bufferData(target, data, usage)
            return
        }
        this.gl.bufferData(target, new type(data), usage)
    }
}

export function decoupleXYZandUV(
    xyz: Float32Array,
    fxyz: Uint16Array | number[],
    uv?: Float32Array | number[],
    fuv?: Uint16Array | number[]
): GLXYZUV {
    if (fuv !== undefined && fxyz.length !== fuv.length) {
        throw Error(`fvertex and fuv must have the same length, instead it is ${fxyz.length} and ${fuv.length}`)
    }
    if (fuv !== undefined && uv === undefined) {
        throw Error(`uv & fuv must both be defined`)
    }
    const indices: number[] = []
    const uvOut = new Array((xyz.length / 3) * 2) // for each vertex we have texture coordinate

    const idxExtra: number[] = []
    const xyzOutExtra: number[] = []
    const uvOutExtra: number[] = []

    function getIndex(i: number) {
        return fxyz[i]
    }

    function decoupleXYZandUV(i: number) {
        const idxXYZ = fxyz[i]

        const xyzIdx = fxyz[i]
        const uvIdx = fuv![i]
        const u = uv![uvIdx * 2]
        const v = uv![uvIdx * 2 + 1]

        if (uvOut[xyzIdx * 2] === undefined) {
            uvOut[xyzIdx * 2] = u
            uvOut[xyzIdx * 2 + 1] = v
            return idxXYZ
        }
        if (uvOut[xyzIdx * 2] === u && uvOut[xyzIdx * 2 + 1] === v) {
            return idxXYZ
        }

        const newIdxXYZ = (xyz.length + xyzOutExtra.length) / 3

        const idxXYZIn = idxXYZ * 3
        const x = xyz[idxXYZIn]
        const y = xyz[idxXYZIn + 1]
        const z = xyz[idxXYZIn + 2]

        idxExtra.push(idxXYZ)
        xyzOutExtra.push(x)
        xyzOutExtra.push(y)
        xyzOutExtra.push(z)
        uvOutExtra.push(u)
        uvOutExtra.push(v)

        return newIdxXYZ
    }

    let f
    if (fuv === undefined) {
        f = getIndex
    } else {
        f = decoupleXYZandUV
    }

    for (let i = 0; i < fxyz.length; i += 4) {
        const i0 = f(i)
        indices.push(i0)
        indices.push(f(i + 1))
        const i2 = f(i + 2)
        indices.push(i2)
        indices.push(f(i + 3))
        indices.push(i0)
        indices.push(i2)
    }

    if (fuv === undefined) {
        return {
            idxExtra: [],
            indices,
            vertex: xyz,
            texcoord: undefined,
        }
    }

    const vertex = new Float32Array(xyz.length + xyzOutExtra.length)
    const texcoord = new Float32Array(uvOut.length + uvOutExtra.length)

    vertex.set(xyz)
    vertex.set(xyzOutExtra, xyz.length)
    texcoord.set(uvOut)
    texcoord.set(uvOutExtra, uvOut.length)

    return { indices, vertex, texcoord, idxExtra }
}
