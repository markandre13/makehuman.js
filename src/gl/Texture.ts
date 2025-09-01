import { GLView } from "./GLView"

export class Texture {
    private view: GLView
    private gl: WebGL2RenderingContext
    texture: WebGLTexture

    constructor(view: GLView, url: string) {
        this.view = view
        const gl = view.gl
        this.gl = gl
        const target = gl.TEXTURE_2D

        this.texture = gl.createTexture()
        gl.bindTexture(target, this.texture)

        // setup temporary image until actual image has been loaded
        const level = 0
        const internalFormat = gl.RGBA
        const width = 1
        const height = 1
        const border = 0
        const srcFormat = gl.RGBA
        const srcType = gl.UNSIGNED_BYTE
        const pixel = new Uint8Array([0, 0, 255, 255]) // opaque blue
        gl.texImage2D(
            target,
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
            gl.bindTexture(target, this.texture)
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
            this.view.invalidate()
        }
        image.src = url
    }
    bind() {
        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
    }
}

function isPowerOf2(value: number) {
    return (value & (value - 1)) === 0
}