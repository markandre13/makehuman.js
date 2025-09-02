import type { mat4 } from "gl-matrix"
import type { ShaderHasColors } from "../interfaces/ShaderHasColors"
import type { ShaderHasPositions } from "../interfaces/ShaderHasPositions"
import type { ShaderHasNormals } from "../interfaces/ShaderHasNormals"
import { initShaderProgram } from "../lib/initShaderProgram"
import { mat42float32array } from "./ShaderColored"

export class ShaderShadedColored implements ShaderHasPositions, ShaderHasNormals, ShaderHasColors {
    private program: WebGLProgram
    vertexPositions: GLint
    vertexNormals: GLint
    vertexColors: GLint

    private pointSize: WebGLUniformLocation
    private projectionMatrix: WebGLUniformLocation
    private normalMatrix: WebGLUniformLocation
    private modelViewMatrix: WebGLUniformLocation

    constructor(gl: WebGL2RenderingContext) {
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
        if (shaderProgram === null) {
            throw Error(`failed to init shader program`)
        }
        this.program = shaderProgram

        this.vertexPositions = gl.getAttribLocation(shaderProgram, "aVertexPosition")
        this.vertexNormals = gl.getAttribLocation(shaderProgram, "aVertexNormal")
        this.vertexColors = gl.getAttribLocation(shaderProgram, "aVertexColor")

        this.pointSize = gl.getUniformLocation(shaderProgram, "uPointSize")!
        this.projectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!
        this.normalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix")!
        this.modelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!
    }
    setPointSize(gl: WebGL2RenderingContext, pointSize: number) {
        gl.uniform1f(this.pointSize, pointSize)
    }
    init(gl: WebGL2RenderingContext, projectionMatrix: mat4, modelViewMatrix: mat4, normalMatrix: mat4) {
        this.use(gl)
        this.setProjection(gl, projectionMatrix)
        this.setModelView(gl, modelViewMatrix)
        this.setNormal(gl, normalMatrix)
    }
    setProjection(gl: WebGL2RenderingContext, projectionMatrix: mat4) {
        // Set the shader uniforms
        gl.uniformMatrix4fv(this.projectionMatrix, false, mat42float32array(projectionMatrix))
    }
    setNormal(gl: WebGL2RenderingContext, normalMatrix: mat4) {
        gl.uniformMatrix4fv(this.normalMatrix, false,  mat42float32array(normalMatrix))
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
    attribute vec3 aVertexNormal;
    attribute vec4 aVertexColor;

    // input for all vertices (uniform for the whole shader program)
    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform float uPointSize;

    // data exchanged with other graphic pipeline stages
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main(void) { 
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
        gl_PointSize = uPointSize;

        // Apply lighting effect
        highp vec3 ambientLight = vec3(0.7, 0.7, 0.7);
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional);

        vColor = aVertexColor;
    }
`

// Fragment shader program

export const fsSource = `
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;
    void main(void) {
       gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);
    }
`
