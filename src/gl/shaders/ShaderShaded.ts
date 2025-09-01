import type { mat4 } from "gl-matrix"
import type { ShaderHasPositions } from "../interfaces/ShaderHasPositions"
import type { ShaderHasNormals } from "../interfaces/ShaderHasNormals"
import { initShaderProgram } from "../lib/initShaderProgram"

export class ShaderShaded implements ShaderHasPositions, ShaderHasNormals {
    private program: WebGLProgram
    vertexPositions: GLint
    vertexNormals: GLint

    private color: WebGLUniformLocation
    private projectionMatrix: WebGLUniformLocation
    private modelViewMatrix: WebGLUniformLocation
    private normalMatrix: WebGLUniformLocation

    constructor(gl: WebGL2RenderingContext) {
        const shaderProgram = initShaderProgram(gl, vsSource, fsSource)
        if (shaderProgram === null) {
            throw Error(`failed to init shader program`)
        }
        this.program = shaderProgram

        this.vertexPositions = gl.getAttribLocation(shaderProgram, "aVertexPosition")
        this.vertexNormals = gl.getAttribLocation(shaderProgram, "aVertexNormal")

        this.color = gl.getUniformLocation(shaderProgram, "uColor")!
        this.projectionMatrix = gl.getUniformLocation(shaderProgram, "uProjectionMatrix")!
        this.modelViewMatrix = gl.getUniformLocation(shaderProgram, "uModelViewMatrix")!
        this.normalMatrix = gl.getUniformLocation(shaderProgram, "uNormalMatrix")!
    }

    init(gl: WebGL2RenderingContext, projectionMatrix: mat4, modelViewMatrix: mat4, normalMatrix: mat4) {
        this.use(gl)
        this.setProjection(gl, projectionMatrix)
        this.setModelView(gl, modelViewMatrix)
        this.setNormal(gl, normalMatrix)
    }

    setProjection(gl: WebGL2RenderingContext, projectionMatrix: mat4) {
        // Set the shader uniforms
        gl.uniformMatrix4fv(this.projectionMatrix, false, projectionMatrix)
    }
    setModelView(gl: WebGL2RenderingContext, modelViewMatrix: mat4) {
        gl.uniformMatrix4fv(this.modelViewMatrix, false, modelViewMatrix)
    }
    setNormal(gl: WebGL2RenderingContext, normalMatrix: mat4) {
        gl.uniformMatrix4fv(this.normalMatrix, false, normalMatrix)
    }
    setColor(gl: WebGL2RenderingContext, color: number[]) {
        gl.uniform4fv(this.color, color)
    }
    use(gl: WebGL2RenderingContext) {
        gl.useProgram(this.program)
    }
}

export const vsSource = `
    // this is our input per vertex
    attribute vec4 aVertexPosition;
    attribute vec3 aVertexNormal;

    // input for all vertices (uniform for the whole shader program)
    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec4 uColor;

    // data exchanged with other graphic pipeline stages
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;

    void main(void) { 
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

        // Apply lighting effect
        highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
        highp vec3 directionalLightColor = vec3(1, 1, 1);
        highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

        highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

        highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
        vLighting = ambientLight + (directionalLightColor * directional);
        vColor = uColor;
    }
`

export const fsSource = `
    varying lowp vec4 vColor;
    varying highp vec3 vLighting;
    void main(void) {
        gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);
    }
`
