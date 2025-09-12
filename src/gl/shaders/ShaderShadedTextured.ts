import type { mat4 } from "gl-matrix"
import type { ShaderHasNormals } from "../interfaces/ShaderHasNormals"
import type { ShaderHasPositions } from "../interfaces/ShaderHasPositions"
import type { ShaderHasTexture } from "../interfaces/ShaderHasTexture"
import { initShaderProgram } from "../detail/initShaderProgram"
import { mat42float32array } from "./ShaderColored"

export class ShaderShadedTextured implements ShaderHasPositions, ShaderHasTexture, ShaderHasNormals {
    gl: WebGL2RenderingContext
    private program: WebGLProgram

    vertexPositions: GLint
    textureCoord: GLint
    vertexNormals: GLint

    private uSampler: WebGLUniformLocation
    private uAlpha: WebGLUniformLocation

    private projectionMatrix: WebGLUniformLocation
    private modelViewMatrix: WebGLUniformLocation
    private normalMatrix: WebGLUniformLocation

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
        if (shaderProgram === null) {
            throw Error(`failed to init shader program`)
        }
        this.program = shaderProgram

        this.vertexPositions = gl.getAttribLocation(shaderProgram, "aVertexPosition")
        this.vertexNormals = gl.getAttribLocation(shaderProgram, "aVertexNormal")
        this.textureCoord = gl.getAttribLocation(shaderProgram, "aTextureCoord")
        this.uSampler = gl.getUniformLocation(this.program, "uSampler")!
        this.uAlpha = gl.getUniformLocation(this.program, "uAlpha")!

        this.projectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!
        this.modelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!
        this.normalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix")!
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
    init(gl: WebGL2RenderingContext, projectionMatrix: mat4, modelViewMatrix: mat4, normalMatrix: mat4) {
        this.use(gl)
        this.setAlpha(1)
        this.setProjection(gl, projectionMatrix)
        this.setModelView(gl, modelViewMatrix)
        this.setNormal(gl, normalMatrix)
    }
    setProjection(gl: WebGL2RenderingContext, projectionMatrix: mat4) {
        // Set the shader uniforms
        gl.uniformMatrix4fv(this.projectionMatrix, false,  mat42float32array(projectionMatrix))
    }
    setModelView(gl: WebGL2RenderingContext, modelViewMatrix: mat4) {
        gl.uniformMatrix4fv(this.modelViewMatrix, false,  mat42float32array(modelViewMatrix))
    }
    setNormal(gl: WebGL2RenderingContext, normalMatrix: mat4) {
        gl.uniformMatrix4fv(this.normalMatrix, false,  mat42float32array(normalMatrix))
    }
    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program)
    }
}

// Vertex shader program

export const vsSource = `
    // this is our input per vertex
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    // input for all vertices (uniform for the whole shader program)
    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    // data exchanged with other graphic pipeline stages
    varying highp vec3 vLighting;
    varying highp vec2 vTextureCoord;

    void main(void) { 
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

        highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional);

        vTextureCoord = aTextureCoord;
    }
`

// Fragment shader program

export const fsSource = `
    varying highp vec3 vLighting;
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;
    uniform highp float uAlpha;

    void main(void) {
        highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
        gl_FragColor = vec4(texelColor.rgb * vLighting, uAlpha);
    }
`
