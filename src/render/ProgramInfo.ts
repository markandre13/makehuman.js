export interface ProgramInfo {
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
}
