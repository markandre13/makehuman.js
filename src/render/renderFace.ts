import { RenderMesh } from "./RenderMesh"
import { ShaderShadedMono } from "gl/shaders/ShaderShadedMono"
import { RenderView } from "./glview/RenderView"

let lastXYZ: Float32Array | undefined

export function renderFace(view: RenderView, xyz: Float32Array, fxyz: number[]) {
    // console.log("render face")
    // const gl = (canvas.getContext('webgl2') || canvas.getContext('experimental-webgl')) as WebGL2RenderingContext
    // if (gl == null) {
    //     throw Error('Unable to initialize WebGL. Your browser or machine may not support it.')
    // }

    // Flip image pixels into the bottom-to-top order that WebGL expects.
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    const shaderShadedMono = view.shaderShadedMono

    view.prepareCanvas()
    const {projectionMatrix, modelViewMatrix, normalMatrix} = view.prepare()

    // prepareCanvas(canvas)
    // prepareViewport(gl, canvas)
    // const projectionMatrix = createProjectionMatrix(canvas)
    // const modelViewMatrix = mat4.create()
    // mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0, -0.5]) // obj file face centered
    // const normalMatrix = createNormalMatrix(modelViewMatrix)

    shaderShadedMono.init(view.gl, projectionMatrix, modelViewMatrix, normalMatrix)

    if (xyz !== lastXYZ) {
        center(xyz)
        lastXYZ = xyz
    }

    // DRAW POINT CLOUD

    // drawPointCloud(gl, programRGBA, xyz)
    drawLineArt(view.gl, shaderShadedMono, xyz, fxyz)
}

function center(xyz: Float32Array) {
    // let minX, maxX, minY, maxY, minZ, maxZ
    // minX = maxX = xyz[0]
    // minY = maxY = xyz[1]
    // minZ = maxZ = xyz[2]
    // for (let i = 3; i < xyz.length-3; i += 3) {
    //     minX = Math.min(minX, xyz[i])
    //     maxX = Math.max(maxX, xyz[i])
    //     minY = Math.min(minY, xyz[i + 1])
    //     maxY = Math.max(maxY, xyz[i + 1])
    //     minZ = Math.min(minZ, xyz[i + 2])
    //     maxZ = Math.max(maxZ, xyz[i + 2])
    // }
    // // console.log(`X:${minX}:${maxX}`)
    // // console.log(`Y:${minY}:${maxY}`)
    // // console.log(`Z:${minZ}:${maxZ}`)
    // const originX = minX += (maxX - minX) / 2, originY = minY += (maxY - minY) / 2, originZ = minZ += (maxZ - minZ) / 2
    // // console.log(`origin = ${originX}, ${originY}, ${originZ}`)

    const originX = 0.5
    const originY = 0.5
    const originZ = -0.2

    for (let i = 0; i < xyz.length; i += 3) {
        xyz[i] -= originX
        xyz[i + 1] = (originY - xyz[i + 1]) * 0.8
        xyz[i + 2] = (originZ - xyz[i + 2])
    }
}

function drawPointCloud(gl: WebGL2RenderingContext, shader: ShaderShadedMono, xyz: Float32Array) {
    const fxyz = new Array<number>(xyz.length / 3)
    for (let i = 0; i < fxyz.length; ++i) {
        fxyz[i] = i
    }
    const mesh = new RenderMesh(gl, xyz, fxyz, undefined, undefined, false)
    shader.setColor(gl, [10.0, 8, 7, 1])
    mesh.bind(shader)
    gl.drawElements(gl.POINTS, fxyz.length, gl.UNSIGNED_SHORT, 0)
}

function drawLineArt(gl: WebGL2RenderingContext, shader: ShaderShadedMono, xyz: Float32Array, fxyz: number[]) {
    // DRAW LINE ART
    // programRGBA.setColor([0.0, 1.8, 0.0, 1])
    shader.setColor(gl, [0.0, 5.0, 10.0, 1])
    const lineStrips = [[
        // RING 0
        10, 338, 297, 332, 284, 251, 389, 356,
        454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
    ], [
        // VERTICAL TOP DOWN
        // stirn
        10, 151, 9, 8,
        // nose
        168, 6, 197, 195, 5, 4, 1, 94, 2, 164,
        // upper lip
        11, 12, 13,
        // lower lip
        14, 15, 16, 17,
        // chin
        18, 200, 199, 175, 152
    ], [
        // RING 1
        139, 71, 68, 104, 69, 108, 151, 337, 299, 333, 298, 301, 368, 264, 447, 366, 401, 435, 367, 364,
        394, 395, 369, 396, 175, 171, 140, 170, 169, 135, 138, 215, 177, 137, 227, 34, 139
    ], [
        // RING 2
        199, 208, 32, 211, 210, 214, 192, 213, 147, 123, 116, 143, 156, 70, 63, 105, 66, 107, 9, 336, 296, 334,
        293, 300, 383, 372, 345, 352, 376, 433, 416, 434, 430, 431, 262, 428, 199
    ], [
        // NOSE HORZ 0
        102, 115, 220, 45, 4, 275, 440, 344, 331
    ], [
        // NOSE HORZ -1
        129, 49, 131, 134, 51, 5, 281, 363, 360, 279, 358
    ], [
        // NOSE HORZ -2
        209, 198, 236, 3, 195, 248, 456, 420, 429
    ], [
        // NOSE HORZ -3
        214, 207, 205, 36, 142, 126, 217, 174, 196, 197, 419, 399, 437, 355, 371, 266, 425, 427, 434
    ], [
        // NOSE HORZ -4
        192, 187, 50, 101, 100, 47, 114, 188, 122, 6, 351, 412, 343, 277, 329, 330, 280, 411, 416
    ], [
        // RIGHT EYE HORZ 0
        111, 117, 118, 119, 120, 121, 128, 245
    ], [
        // LEFT EYE HORZ 0
        340, 346, 347, 348, 349, 350, 357, 465
    ], [
        // RIGHT EYE HORZ 1
        31, 228, 229, 230, 231, 232, 233, 244 // two more
    ], [
        // LEFT EYE HORZ 1
        261, 448, 449, 450, 451, 452, 453, 464
    ], [
        // RIGHT EYE HORZ 2
        25, 110, 24, 23, 22, 26, 112, 243 // two more
    ], [
        255, 339, 254, 253, 252, 256, 341, 463
    ], [
        // RIGHT EYE BROW
        55, 65, 52, 53, 46, 156
    ], [
        // LEFT EYE BROW
        285, 295, 282, 283, 276, 383
    ], [
        // LEFT EYE BROW -1
        413, 441, 442, 443, 444, 445, 353
    ], [
        // RIGHT EYE BROW -1
        189, 221, 222, 223, 224, 225, 124
    ], [
        // RIGHT EYE BROW -2
        190, 56, 28, 27, 29, 30, 247
    ], [
        // LEFT EYE BROW -2
        414, 286, 258, 257, 259, 260, 467
    ], [
        // MOUSTACHE
        202, 57, 186, 92, 165, 167, 164, 393, 391, 322, 410, 287, 422
    ], [
        // MOUSTACHE RIGHT -1
        210, 212, 216, 206, 203
    ], [
        // MOUSTACHE LEFT -1
        430, 432, 436, 426, 423
    ], [
        // NASENBEIN
        417, 168, 193,
    ], [
        // SCHLAEFE RIGHT
        234, 143, 35, 226, 130
    ], [
        // SCHLAEFE LEFT
        359, 446, 265, 372, 454
    ], [
        // EYE LID TOP LEFT
        398, 384, 385, 386, 387, 388, 466, 263
    ], [
        // EYE LID BOTTOM LEFT
        263, 249, 390, 373, 374, 380, 381, 382, 362
    ], [
        // EYE LID TOP RIGHT
        173, 157, 158, 159, 160, 161, 246, 33
    ], [
        // EYE LID BOTTOM RIGHT
        7, 163, 144, 145, 153, 154, 155, 133
    ], [
        // BELOW LIPS
        422, 424, 418, 421, 200, 201, 194, 204, 202
    ], [
        // NASENBEIN -1
        285, 8, 55,
    ], [
        // LEFT NOSE HOLE
        458, 459, 309, 392, 289, 305, 290, 250, 458
    ], [
        // RIGHT NOSE HOLE
        60, 75, 59, 166, 79, 239, 238, 20, 60
    ], [
        // BOTH NOSE HOLES
        240, 235, 219, 218, 237, 44, 1, 274, 457, 438, 439, 455, 460, 328, 2, 99, 240
    ], [
        // INBETWEEN NOSE UPPER
        458, 461, 354, 19, 125, 241, 238
    ], [
        // INBETWEEN NOSE LOWER
        250, 462, 370, 94, 141, 242, 20
    ], [
        // NOSE BOTTOM
        278, 294, 327, 326, 97, 98, 64, 48
    ], [
        // RIGHT BELOW LIPS
        43, 106, 182, 83, 18, 313, 406, 335, 273
    ], [
        264, 342
    ], [
        34, 113
    ], [
        // LEFT IRIS
        474, 473,
        476, 473,
        475, 473,
        477 
    ], [
        // RIGHT IRIS
        469, 471, 468,
        470, 472
    ], [
        // LIPS 0
        317, 14, 87, 178, 88, 95, 78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317
    ], [
        // LIPS 1
        316, 15, 86, 179, 89, 96, 62, 183, 42, 41, 38, 12, 268, 271, 272, 407, 292, 325, 319, 403, 316
    ], [
        // LIPS 2
        315, 16, 85, 180, 90, 77, 76, 184, 74, 73, 72, 11, 302, 303, 304, 408, 306, 307, 320, 404, 315
    ], [
        // LIPS 3
        314, 17, 84, 181, 91, 146, 61, 185, 40, 39, 37, 11, 267, 269, 270, 409, 291, 375, 321, 405, 314
    ]]
    for (const line of lineStrips) {
        // if (line[0] !== 474 && line[0] !== 469) {
        //     continue
        // }
        // if (line === lineStrips[lineStrips.length - 1]) {
        //     programRGBA.color([0.0, 0.0, 10.0, 1])
        // }
        const mesh0 = new RenderMesh(gl, xyz, line, undefined, undefined, false)
        mesh0.bind(shader)
        gl.drawElements(gl.LINE_STRIP, line.length, gl.UNSIGNED_SHORT, 0)
        if (line[0] === 34) {
            shader.setColor(gl, [8.0, 0.0, 0.0, 1])
        }
    }

    // draw solid face
    shader.setColor(gl, [1, 0.8, 0.7, 1])
    const mesh0 = new RenderMesh(gl, xyz, fxyz, undefined, undefined, false)
    mesh0.bind(shader)
    gl.drawElements(gl.TRIANGLES, fxyz.length, gl.UNSIGNED_SHORT, 0)
}
