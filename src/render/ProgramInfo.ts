import { mat4 } from 'gl-matrix'

abstract class GLProgram {
    protected gl: WebGL2RenderingContext
    protected program: WebGLProgram

    protected vertexPosition: number
    protected vertexNormal: number

    protected projectionMatrix: WebGLUniformLocation
    protected modelViewMatrix: WebGLUniformLocation
    protected normalMatrix: WebGLUniformLocation

    constructor(gl: WebGL2RenderingContext, vertexShaderSrc: string, fragmentShaderSrc: string) {
        const program = gl.createProgram()
        if (program === null) {
            throw Error('Unable to create WebGLProgram')
        }
        const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSrc)
        const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc)
        gl.attachShader(program, vertexShader)
        gl.attachShader(program, fragmentShader)
        gl.linkProgram(program)

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw Error(`Unable to initialize WebGLProgram: ${gl.getProgramInfoLog(program)}`)
        }
        this.gl = gl
        this.program = program

        this.vertexPosition = gl.getAttribLocation(this.program, 'aVertexPosition')
        this.vertexNormal = gl.getAttribLocation(this.program, 'aVertexNormal')

        this.projectionMatrix = getUniformLocation(gl, this.program, 'uProjectionMatrix')
        this.modelViewMatrix = getUniformLocation(gl, this.program, 'uModelViewMatrix')
        this.normalMatrix = getUniformLocation(gl, this.program, 'uNormalMatrix')
    }

    bind(indices: WebGLBuffer, vertices: WebGLBuffer, normales: WebGLBuffer) {
        const numComponents = 3, type = this.gl.FLOAT, normalize = false, stride = 0, offset = 0
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertices)
        this.gl.vertexAttribPointer(this.vertexPosition, numComponents, type, normalize, stride, offset)
        this.gl.enableVertexAttribArray(this.vertexPosition)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normales)
        this.gl.vertexAttribPointer(this.vertexNormal, numComponents, type, normalize, stride, offset)
        this.gl.enableVertexAttribArray(this.vertexNormal)

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indices)
    }

    init(modelViewMatrix: mat4) {
        const gl = this.gl
        const canvas = gl.canvas as HTMLCanvasElement
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight
        }

        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clearDepth(1.0)
        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LEQUAL)

        // gl.enable(gl.BLEND)
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        const fieldOfView = 45 * Math.PI / 180    // in radians
        const aspect = canvas.width / canvas.height
        const zNear = 0.1
        const zFar = 100.0
        const projectionMatrix = mat4.create()
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)

        const normalMatrix = mat4.create()
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        gl.useProgram(this.program)

        gl.uniformMatrix4fv(this.projectionMatrix, false, projectionMatrix)
        gl.uniformMatrix4fv(this.modelViewMatrix, false, modelViewMatrix)
        gl.uniformMatrix4fv(this.normalMatrix, false, normalMatrix)
    }
}

export class ProgramRGBA extends GLProgram {
    protected _color: WebGLUniformLocation
    constructor(gl: WebGL2RenderingContext) {
        super(gl, rgbaVertexShaderSrc, rgbaFragmentShaderSrc)
        this._color = getUniformLocation(gl, this.program, 'uColor')
    }
    // set RGBA color
    color(rgba: number[]) {
        this.gl.uniform4fv(this._color, rgba)
    }
}

const rgbaVertexShaderSrc = `
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

  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

  highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);

  vColor = uColor;
}`

const rgbaFragmentShaderSrc = `
varying lowp vec4 vColor;
varying highp vec3 vLighting;
void main(void) {
  gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);
}`

export class ProgramTexture extends GLProgram {
    protected textureCoord: number
    protected uSampler: WebGLUniformLocation
    constructor(gl: WebGL2RenderingContext) {
        super(gl, textureVertexShaderSrc, textureFragmentShaderSrc)
        // this._color = getUniformLocation(gl, this.program, 'uColor')
        this.textureCoord = gl.getAttribLocation(this.program, "aTextureCoord")
        this.uSampler = gl.getUniformLocation(this.program, "uSampler")!
    }

    bindTex(indices: WebGLBuffer, vertices: WebGLBuffer, normales: WebGLBuffer, texture: WebGLBuffer) {
        this.bind(indices, vertices, normales)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texture)
    }

    // set texture
    // color(rgba: number[]) {
    //     this.gl.uniform4fv(this.uniformLocations.color, rgba)
    // }
}

const textureVertexShaderSrc = `
// this is our input per vertex
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

// input for all vertices (uniform for the whole shader program)
uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// data exchanged with other graphic pipeline stages
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;

void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));
  highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);

  // out
  vLighting = ambientLight + (directionalLightColor * directional);
  vTextureCoord = aTextureCoord;
}`

const textureFragmentShaderSrc = `
varying highp vec2 vTextureCoord;
varying highp vec3 vLighting;
uniform sampler2D uSampler;
void main(void) {
  highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
  gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
}`

function compileShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
    const shader = gl.createShader(type)
    if (shader === null)
        throw Error('Unable to create WebGLShader')
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        throw Error(`An error occurred compiling the ${type} WebGLShader: ${gl.getShaderInfoLog(shader)}`)
    }
    return shader
}

function getUniformLocation(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
    const location = gl.getUniformLocation(program, name)
    if (location === null)
        throw Error(`Internal Error: Failed to get uniform location for ${name}`)
    return location
}
