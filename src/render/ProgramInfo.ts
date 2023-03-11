export class ProgramInfo {
    program: WebGLProgram
    attribLocations: {
        vertexPosition: number
        vertexNormal: number
    }
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation
        modelViewMatrix: WebGLUniformLocation
        normalMatrix: WebGLUniformLocation
        color: WebGLUniformLocation
    }
    constructor(gl: WebGL2RenderingContext) {
        // function linkProgram(, vertexShader: WebGLShader, fragmentShader: WebGLShader): ProgramInfo {
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

        this.program = program
        this.attribLocations = {
            vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
            vertexNormal: gl.getAttribLocation(program, 'aVertexNormal'),
            // vertexColor: gl.getAttribLocation(program, 'aVertexColor'),
        }
        this.uniformLocations = {
            projectionMatrix: getUniformLocation(gl, program, 'uProjectionMatrix'),
            modelViewMatrix: getUniformLocation(gl, program, 'uModelViewMatrix'),
            normalMatrix: getUniformLocation(gl, program, 'uNormalMatrix'),
            color: getUniformLocation(gl, program, 'uColor')
        }

    }
}

const vertexShaderSrc = `
// this is our input per vertex
attribute vec4 aVertexPosition;
attribute vec3 aVertexNormal;
// attribute vec4 aVertexColor;

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

const fragmentShaderSrc = `
varying lowp vec4 vColor;
varying highp vec3 vLighting;
void main(void) {
  gl_FragColor = vec4(vec3(vColor[0],vColor[1],vColor[2]) * vLighting, vColor[3]);
    // gl_FragColor = vColor;
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
