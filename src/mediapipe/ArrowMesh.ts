import { mat4, vec3 } from "gl-matrix"
import { drawArrow } from "chordata/renderChordata"
import { ColorShader } from "render/shader/ColorShader"

export class BoneMesh {
    private gl: WebGL2RenderingContext
    private glVertex: WebGLBuffer
    private glNormal: WebGLBuffer
    private glColor: WebGLBuffer
    private glIndices: WebGLBuffer
    private indexLength: number = 0

    private vertex: number[] = []
    private fvertex: number[] = []
    private color: number[] = []
    private index: number[] = []


    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl


        const m = mat4.create()
        this.glVertex = gl.createBuffer()!
        this.glNormal = gl.createBuffer()!
        this.glColor = gl.createBuffer()!
        this.glIndices = gl.createBuffer()!
    }

    drawBone(m: mat4, length: number) {
        
    }
}

export class ArrowMesh {
    private gl: WebGL2RenderingContext
    private glVertex: WebGLBuffer
    private glNormal: WebGLBuffer
    private glColor: WebGLBuffer
    private glIndices: WebGLBuffer
    private indexLength: number

    constructor(gl: WebGL2RenderingContext, s: number = 0.4) {
        this.gl = gl
        const vertex: number[] = []
        const fvertex: number[] = []
        const color: number[] = []
        const index: number[] = []

        const m = mat4.create()
        mat4.scale(m, m, vec3.fromValues(s, s, s))

        mat4.rotateY(m, m, (2 * Math.PI) / 4)
        drawArrow(m, [1, 0, 0], vertex, fvertex, color, index)
        mat4.rotateX(m, m, (-2 * Math.PI) / 4)
        drawArrow(m, [0, 1, 0], vertex, fvertex, color, index)
        mat4.rotateY(m, m, (-2 * Math.PI) / 4)
        drawArrow(m, [0, 0, 1], vertex, fvertex, color, index)

        this.indexLength = index.length

        this.glVertex = gl.createBuffer()!
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glVertex)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW)

        this.glNormal = gl.createBuffer()!
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glNormal)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fvertex), gl.STATIC_DRAW)

        this.glColor = gl.createBuffer()!
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glColor)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW)

        this.glIndices = gl.createBuffer()!
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glIndices)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW)
    }

    draw(colorShader: ColorShader) {
        colorShader.bind(this.glIndices, this.glVertex, this.glNormal, this.glColor)
        this.gl.drawElements(this.gl.TRIANGLES, this.indexLength, this.gl.UNSIGNED_SHORT, 0)
    }
}
