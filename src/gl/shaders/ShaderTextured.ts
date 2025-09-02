import type { mat4 } from "gl-matrix"
import type { ShaderHasPositions } from "../interfaces/ShaderHasPositions"
import type { ShaderHasTexture } from "../interfaces/ShaderHasTexture"
import { initShaderProgram } from "../lib/initShaderProgram"
import { mat42float32array } from "./ShaderColored"

export class ShaderTextured
    implements ShaderHasPositions, ShaderHasTexture {
    gl: WebGL2RenderingContext
    private program: WebGLProgram
    vertexPositions: GLint
    textureCoord: GLint
    private uSampler: WebGLUniformLocation
    private uAlpha: WebGLUniformLocation

    private projectionMatrix: WebGLUniformLocation
    private modelViewMatrix: WebGLUniformLocation

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
        if (shaderProgram === null) {
            throw Error(`failed to init shader program`)
        }
        this.program = shaderProgram

        this.vertexPositions = gl.getAttribLocation(shaderProgram, "aVertexPosition")
        this.textureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord")
        this.uSampler = gl.getUniformLocation(this.program, "uSampler")!
        this.uAlpha = gl.getUniformLocation(this.program, "uAlpha")!

        this.projectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!
        this.modelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!
    }

    // texture(texture: WebGLTexture, alpha: number = 1) {
    //   this.gl.activeTexture(this.gl.TEXTURE0);
    //   this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    //   this.gl.uniform1i(this.uSampler, 0);
    //   this.gl.uniform1f(this.uAlpha, alpha);
    // }
    setSampler(sampler: number) {
        this.gl.uniform1i(this.uSampler, sampler)
    }
    setAlpha(alpha: number) {
        this.gl.uniform1f(this.uAlpha, alpha)
    }

    setProjection(gl: WebGL2RenderingContext, projectionMatrix: mat4) {
        // Set the shader uniforms
        gl.uniformMatrix4fv(this.projectionMatrix, false,  mat42float32array(projectionMatrix))
    }
    setModelView(gl: WebGL2RenderingContext, modelViewMatrix: mat4) {
        gl.uniformMatrix4fv(this.modelViewMatrix, false,  mat42float32array(modelViewMatrix))
    }
    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program)
    }
}

// Vertex shader program

export const vsSource = `
    // this is our input per vertex
    attribute vec4 aVertexPosition;
    attribute vec2 aTextureCoord;

    // input for all vertices (uniform for the whole shader program)
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    // data exchanged with other graphic pipeline stages
    varying highp vec2 vTextureCoord;

    void main(void) { 
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        vTextureCoord = aTextureCoord;
    }
`

// Fragment shader program

export const fsSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform highp float uAlpha;

    void main(void) {
        highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
        gl_FragColor = vec4(texelColor.rgb, uAlpha);
    }
`
