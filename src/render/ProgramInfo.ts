import { mat4 } from 'gl-matrix'

abstract class GLProgram {
    gl: WebGL2RenderingContext
    program: WebGLProgram

    projectionMatrix: WebGLUniformLocation
    modelViewMatrix: WebGLUniformLocation
    normalMatrix: WebGLUniformLocation

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

        this.projectionMatrix = getUniformLocation(gl, this.program, 'uProjectionMatrix')
        this.modelViewMatrix = getUniformLocation(gl, this.program, 'uModelViewMatrix')
        this.normalMatrix = getUniformLocation(gl, this.program, 'uNormalMatrix')
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

    attribLocations: {
        vertexPosition: number
        vertexNormal: number
    }
    uniformLocations: {
        color: WebGLUniformLocation
    }

    constructor(gl: WebGL2RenderingContext) {
        super(gl, rgbaVertexShaderSrc, rgbaFragmentShaderSrc)

        this.attribLocations = {
            vertexPosition: gl.getAttribLocation(this.program, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(this.program, 'aVertexNormal'),
            // vertexColor: gl.getAttribLocation(program, 'aVertexColor'),
        }
        this.uniformLocations = {
            color: getUniformLocation(gl, this.program, 'uColor')
        }
    }
    // set RGBA color
    color(rgba: number[]) {
        this.gl.uniform4fv(this.uniformLocations.color, rgba)
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

export class ProgramTexture  extends GLProgram {
    attribLocations: {
        vertexPosition: number
        vertexNormal: number
    }
    uniformLocations: {
        color: WebGLUniformLocation
    }
    constructor(gl: WebGL2RenderingContext) {
        super(gl, textureVertexShaderSrc, textureFragmentShaderSrc)
        this.attribLocations = {
            vertexPosition: gl.getAttribLocation(this.program, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(this.program, 'aVertexNormal'),
            // vertexColor: gl.getAttribLocation(program, 'aVertexColor'),
        }
        this.uniformLocations = {
            color: getUniformLocation(gl, this.program, 'uColor')
        }
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
// attribute vec2 aTextureCoord;

// input for all vertices (uniform for the whole shader program)
uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform vec4 uColor;

// data exchanged with other graphic pipeline stages
varying lowp vec4 vColor;
// varying highp vec2 vTextureCoord;
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
  // vTextureCoord = aTextureCoord;
}`

const textureFragmentShaderSrc = `
varying lowp vec4 vColor;
varying highp vec3 vLighting;
// uniform sampler2D uSampler;
void main(void) {
//   highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
//   gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
  gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);
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
