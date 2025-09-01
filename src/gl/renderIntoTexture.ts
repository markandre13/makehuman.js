export function renderIntoTexture(
    gl: WebGL2RenderingContext,
    draw: () => void,
    x: number,
    y: number
) {
    const width = gl.canvas.width,
        height = gl.canvas.height

    // create texture
    const target = gl.TEXTURE_2D
    const diffuseTexture = gl.createTexture()
    gl.bindTexture(target, diffuseTexture)

    const internalFormat = gl.RGBA
    const format = gl.RGBA
    const type = gl.UNSIGNED_BYTE
    const levelOfDetail = 0
    const border = 0 // must be 0
    const data = null // pixels
    gl.texImage2D(gl.TEXTURE_2D, levelOfDetail, internalFormat, width, height, border, format, type, data)
    // set the filtering so we don't need mips
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, target, diffuseTexture, 0)

    // attach depth buffer to framebuffer
    const depthBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)

    draw()

    const pixels = new Uint8Array(width * height * 4)

    // console.log('looking for colors not black')
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    // console.log(pixels)

    // let minX = Number.MAX_VALUE, maxX = Number.MIN_VALUE
    // let minY = Number.MAX_VALUE, maxY = Number.MIN_VALUE

    let index: number | undefined
    for (let y0 = y - 2; index === undefined && y0 < y + 5; ++y0) {
        for (let x0 = x - 2; index === undefined && x0 < x + 5; ++x0) {
            const addr = (x0 + y0 * width) * 4
            if (addr < 0 || addr > pixels.length) {
                continue
            }
            const [r, g, b, _a] = [
                pixels[addr],
                pixels[addr + 1],
                pixels[addr + 2],
                pixels[addr + 3],
            ]
            if (r === undefined || g === undefined || b === undefined) {
                continue
            }
            // addr += 4;
            if (r !== 0 || g !== 0 || b !== 0) {
                index = r + (g << 8) + (b << 16)
                // console.log(`${x}, ${y}: ${r}, ${g}, ${b}, ${a}; ${index}`)
            }

            // // if (r !==0 || g !== 0 || b !== 0) {
            // if (r == 128 && g == 0 && b == 0) {
            //   minX = Math.min(minX, x)
            //   maxX = Math.max(maxX, x)
            //   minY = Math.min(minY, y)
            //   maxY = Math.max(maxY, y)
            // }
        }
    }
    // console.log(`${minX}-${maxX}, ${minY},${maxY}`)
    // console.log(pixels)
    gl.bindTexture(gl.TEXTURE_2D, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    return { texture: diffuseTexture, index }
}
