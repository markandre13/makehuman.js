import { glMatrix, type mat4 } from "gl-matrix"
import type { ShaderHasColors } from "../interfaces/ShaderHasColors"
import type { ShaderHasPositions } from "../interfaces/ShaderHasPositions"
import { initShaderProgram } from "../detail/initShaderProgram"

export class ShaderColored implements ShaderHasPositions, ShaderHasColors {
    private program: WebGLProgram
    vertexPositions: GLint
    vertexColors: GLint

    private pointSize: WebGLUniformLocation
    private projectionMatrix: WebGLUniformLocation
    private modelViewMatrix: WebGLUniformLocation

    constructor(gl: WebGL2RenderingContext) {
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
        if (shaderProgram === null) {
            throw Error(`failed to init shader program`)
        }
        this.program = shaderProgram

        this.vertexPositions = gl.getAttribLocation(shaderProgram, "aVertexPosition")
        this.vertexColors = gl.getAttribLocation(shaderProgram, "aVertexColor")

        this.pointSize = gl.getUniformLocation(shaderProgram, "uPointSize")!
        this.projectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!
        this.modelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!
    }
    setPointSize(gl: WebGL2RenderingContext, pointSize: number) {
        gl.uniform1f(this.pointSize, pointSize)
    }

    setProjection(gl: WebGL2RenderingContext, projectionMatrix: mat4) {
        // Set the shader uniforms
        gl.uniformMatrix4fv(this.projectionMatrix, false, mat42float32array(projectionMatrix))
    }
    setModelView(gl: WebGL2RenderingContext, modelViewMatrix: mat4) {
        gl.uniformMatrix4fv(this.modelViewMatrix, false, mat42float32array(modelViewMatrix))
    }
    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program)
    }
}

export function mat42float32array(m: mat4): Float32Array {
    if (glMatrix.ARRAY_TYPE === Float32Array) {
        return m as Float32Array
    } else {
        return new Float32Array(m)
    }
}

export const vsSource = `
    // this is our input per vertex
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    // input for all vertices (uniform for the whole shader program)
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform float uPointSize;

    // data exchanged with other graphic pipeline stages
    varying lowp vec4 vColor;

    void main(void) { 
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        gl_PointSize = uPointSize;
        vColor = aVertexColor;
    }
`

export const fsSource = `
    varying lowp vec4 vColor;
    void main(void) {
        gl_FragColor = vColor;
    }
`
