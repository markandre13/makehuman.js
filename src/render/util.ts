import { mat4 } from "gl-matrix"
import { RenderMode } from "./RenderMode"
import { RenderMesh } from "./RenderMesh"

export function prepareCanvas(canvas: HTMLCanvasElement) {
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
    }
}

export function prepareViewport(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0, 0, 0, 1)
    gl.clearDepth(1)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

export function createModelViewMatrix(renderMode: RenderMode, cubeRotation: number) {
    const modelViewMatrix = mat4.create()
    if (renderMode === RenderMode.EXPRESSION) {
        mat4.translate(modelViewMatrix, modelViewMatrix, [0.5, -7, -5])
        mat4.rotate(modelViewMatrix, modelViewMatrix, -Math.PI / 6, [0, 1, 0])
    } else {
        mat4.translate(modelViewMatrix, modelViewMatrix, [-0, 0, -25]) // move the model (cube) away
        mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7, [0, 1, 0])
    }
    return modelViewMatrix
}

export function createProjectionMatrix(canvas: HTMLCanvasElement) {
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = canvas.width / canvas.height
    const zNear = 0.1
    const zFar = 100
    const projectionMatrix = mat4.create()
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar)
    return projectionMatrix
}

export function createNormalMatrix(modelViewMatrix: mat4) {
    const normalMatrix = mat4.create()
    mat4.invert(normalMatrix, modelViewMatrix)
    mat4.transpose(normalMatrix, normalMatrix)
    return normalMatrix
}
//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
export function loadTexture(gl: WebGLRenderingContext, url: string) {
    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)

    // Because images have to be downloaded over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0
    const internalFormat = gl.RGBA
    const width = 1
    const height = 1
    const border = 0
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE
    const pixel = new Uint8Array([0, 0, 255, 255]) // opaque blue
    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel
    )

    const image = new Image()
    image.onload = () => {
        console.log(`texture "${url}" has been loaded`)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            srcFormat,
            srcType,
            image
        )

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D)
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        }
    }
    image.src = url

    return texture
}
function isPowerOf2(value: number) {
    return (value & (value - 1)) === 0
}
function createTexturedCubeRenderer(gl: WebGL2RenderingContext): RenderMesh {
    //         4-------5
    //        /       /|
    //       0-------1 |
    //       | 7     | 6
    //       |       |/
    //       3-------2
    const xyz = [
        -1, 1, 1,
        1, 1, 1,
        1, -1, 1,
        -1, -1, 1,
        -1, 1, -1,
        1, 1, -1,
        1, -1, -1,
        -1, -1, -1, // 7
    ]
    const fxyz = [
        0, 1, 2, 3,
        7, 6, 5, 4,
        4, 5, 1, 0,
        3, 2, 6, 7,
        1, 5, 6, 2,
        4, 0, 3, 7 // left
    ]
    const uv = [
        0, 1,
        1, 1,
        1, 0,
        0, 0,
    ]
    const fuv = [
        0, 1, 2, 3,
        0, 1, 2, 3,
        0, 1, 2, 3,
        0, 1, 2, 3,
        0, 1, 2, 3,
        0, 1, 2, 3
    ]
    return new RenderMesh(gl, new Float32Array(xyz), fxyz, new Float32Array(uv), fuv)
}