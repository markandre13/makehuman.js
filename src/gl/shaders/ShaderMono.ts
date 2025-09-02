import type { mat4 } from "gl-matrix"
import type { ShaderHasPositions } from "../interfaces/ShaderHasPositions"
import { initShaderProgram } from "../lib/initShaderProgram"

export class ShaderMono implements ShaderHasPositions {
    private program: WebGLProgram
    vertexPositions: GLint

    private pointSize: WebGLUniformLocation
    private color: WebGLUniformLocation
    private projectionMatrix: WebGLUniformLocation
    private modelViewMatrix: WebGLUniformLocation

    constructor(gl: WebGL2RenderingContext) {
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
        if (shaderProgram === null) {
            throw Error(`failed to init shader program`)
        }
        this.program = shaderProgram

        this.vertexPositions = gl.getAttribLocation(shaderProgram, "aVertexPosition")

        this.pointSize = gl.getUniformLocation(shaderProgram, "uPointSize")!
        this.color = gl.getUniformLocation(shaderProgram, "uColor")!
        this.projectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!
        this.modelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!
    }

    setProjection(gl: WebGL2RenderingContext, projectionMatrix: mat4) {
        gl.uniformMatrix4fv(this.projectionMatrix, false, projectionMatrix)
    }
    setModelView(gl: WebGL2RenderingContext, modelViewMatrix: mat4) {
        gl.uniformMatrix4fv(this.modelViewMatrix, false, modelViewMatrix)
    }
    setColor(gl: WebGL2RenderingContext, color: number[]) {
        gl.uniform4fv(this.color, color)
    }
    setPointSize(gl: WebGL2RenderingContext, pointSize: number) {
        gl.uniform1f(this.pointSize, pointSize)
    }
    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program)
    }
}

export const vsSource = `
    // this is our input per vertex
    attribute vec4 aVertexPosition;

    // input for all vertices (uniform for the whole shader program)
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec4 uColor;
    uniform float uPointSize;

    // data exchanged with other graphic pipeline stages
    varying lowp vec4 vColor;

    void main(void) { 
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        gl_PointSize = uPointSize;
        vColor = uColor;
    }
`

export const fsSource = `
    varying lowp vec4 vColor;
    void main(void) {
        gl_FragColor = vColor;
    }
`
