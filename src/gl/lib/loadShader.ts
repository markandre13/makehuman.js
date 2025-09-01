//
// creates a shader of the given type, uploads the source and
// compiles it.
//

export function loadShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
    const shader = gl.createShader(type)
    if (shader === null) {
        throw Error(`failed to create shader program`)
    }

    // Send the source to the shader object
    gl.shaderSource(shader, source)

    // Compile the shader program
    gl.compileShader(shader)

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        // gl.deleteShader(shader);
        throw Error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
    }

    return shader
}
