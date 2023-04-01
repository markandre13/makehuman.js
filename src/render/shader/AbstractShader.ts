import { mat4 } from 'gl-matrix'

export abstract class AbstractShader {
    protected gl: WebGL2RenderingContext
    protected program: WebGLProgram

    protected vertexPosition: number
    protected vertexNormal: number
    protected textureCoord?: number

    protected projectionMatrix: WebGLUniformLocation
    protected modelViewMatrix: WebGLUniformLocation
    protected normalMatrix: WebGLUniformLocation

    constructor(gl: WebGL2RenderingContext, vertexShaderSrc: string, fragmentShaderSrc: string) {
        const program = gl.createProgram()
        if (program === null) {
            throw Error('Unable to create WebGLProgram')
        }
        const vertexShader = AbstractShader.compileShader(gl, gl.VERTEX_SHADER, vertexShaderSrc)
        const fragmentShader = AbstractShader.compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSrc)
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

        this.projectionMatrix = AbstractShader.getUniformLocation(gl, this.program, 'uProjectionMatrix')
        this.modelViewMatrix = AbstractShader.getUniformLocation(gl, this.program, 'uModelViewMatrix')
        this.normalMatrix = AbstractShader.getUniformLocation(gl, this.program, 'uNormalMatrix')
    }

    bind(indices: WebGLBuffer, vertices: WebGLBuffer, normales: WebGLBuffer, texture?: WebGLBuffer) {
        const numComponents = 3, type = this.gl.FLOAT, normalize = false, stride = 0, offset = 0
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertices)
        this.gl.vertexAttribPointer(this.vertexPosition, numComponents, type, normalize, stride, offset)
        this.gl.enableVertexAttribArray(this.vertexPosition)

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normales)
        this.gl.vertexAttribPointer(this.vertexNormal, numComponents, type, normalize, stride, offset)
        this.gl.enableVertexAttribArray(this.vertexNormal)

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indices)
    }

    init(projectionMatrix: mat4, modelViewMatrix: mat4, normalMatrix: mat4) {
        this.gl.useProgram(this.program)
        this.gl.uniformMatrix4fv(this.projectionMatrix, false, projectionMatrix)
        this.gl.uniformMatrix4fv(this.modelViewMatrix, false, modelViewMatrix)
        this.gl.uniformMatrix4fv(this.normalMatrix, false, normalMatrix)
    }

    static compileShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
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

    static getUniformLocation(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
        const location = gl.getUniformLocation(program, name)
        if (location === null)
            throw Error(`Internal Error: Failed to get uniform location for ${name}`)
        return location
    }
}


