import { mat4 } from "gl-matrix"
import { WavefrontObj } from "mesh/WavefrontObj"
import { createModelViewMatrix, createNormalMatrix, createProjectionMatrix, prepareCanvas, prepareViewport } from "./render"
import { RenderMesh } from "./RenderMesh"
import { RGBAShader } from "./shader/RGBAShader"
import { testCube } from "mesh/testCube"

export function renderFace(canvas: HTMLCanvasElement, face: ArrayBuffer) {
    // console.log("render face")
    const gl = (canvas.getContext('webgl2') || canvas.getContext('experimental-webgl')) as WebGL2RenderingContext
    if (gl == null) {
        throw Error('Unable to initialize WebGL. Your browser or machine may not support it.')
    }
    // Flip image pixels into the bottom-to-top order that WebGL expects.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)

    const programRGBA = new RGBAShader(gl)

    prepareCanvas(canvas)
    prepareViewport(gl, canvas)
    const projectionMatrix = createProjectionMatrix(canvas)
    // const modelViewMatrix = createModelViewMatrix(RenderMode.POLYGON)

    const modelViewMatrix = mat4.create()
    // mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -5.0]) // test cube
    // mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -30.0]) // obj file face
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -0.5]) // obj file face centered
    // mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -1.5]) // obj file face
    mat4.rotate(modelViewMatrix, modelViewMatrix, 0.0 * .7, [0, 1, 0])

    const normalMatrix = createNormalMatrix(modelViewMatrix)

    programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)


    // const mesh = new RenderMesh(gl, vertex, obj.fxyz, undefined, undefined, false)
    // test cube
    // const xyz = new Float32Array((testCube.vertexMorphed as any) as number[])
    // const fxyz = (testCube.baseMesh as any).indices as number[]

    const xyz = new Float32Array(face)
    const fxyz = new Array<number>(xyz.length / 3)
    for(let i=0; i<fxyz.length; ++i) {
        fxyz[i] = i
    }

    let minX, maxX, minY, maxY, minZ, maxZ
    minX = maxX = xyz[0]
    minY = maxY = xyz[1]
    minZ = maxZ = xyz[2]
    for (let i = 3; i < xyz.length; i += 3) {
        minX = Math.min(minX, xyz[i])
        maxX = Math.max(maxX, xyz[i])
        minY = Math.min(minY, xyz[i + 1])
        maxY = Math.max(maxY, xyz[i + 1])
        minZ = Math.min(minZ, xyz[i + 2])
        maxZ = Math.max(maxZ, xyz[i + 2])
    }
    // console.log(`X:${minX}:${maxX}`)
    // console.log(`Y:${minY}:${maxY}`)
    // console.log( `Z:${minZ}:${maxZ}`)
    const originX = minX += (maxX - minX) / 2, originY = minY += (maxY - minY) / 2, originZ = minZ += (maxZ - minZ) / 2
    for (let i = 3; i < xyz.length; i += 3) {
        xyz[i] -= originX
        xyz[i + 1] = (xyz[i + 1] - originY) * -1
        xyz[i + 2] = (xyz[i + 2] - originZ)
    }

    function r(num: number) {
        // return Math.round((num + Number.EPSILON) * 10000000) / 10000000
        return num
    }

    // let l = ""
    // for (let i = 3; i < xyz.length; i += 3) {
    //     l=`${l}v ${r(xyz[i])} ${r(xyz[i+1])} ${r(xyz[i+2])}\n`
    // }
    // console.log(l)

    const mesh = new RenderMesh(gl, xyz, fxyz, undefined, undefined, false)
    programRGBA.color([1.0, 0.8, 0.7, 1])
    mesh.bind(programRGBA)
    gl.drawElements(gl.POINTS, fxyz.length, gl.UNSIGNED_SHORT, 0)

    programRGBA.color([0.0, 1.8, 0.0, 1])
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
        199, 208, 211, 210, 214, 192, 213, 147, 123, 116, 143, 156, 70, 63, 105, 66, 107, 9, 336, 296, 334,
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
        36, 142, 126, 217, 174, 196, 197, 419, 399, 437, 355, 371, 266,
    ], [
        // NOSE HORZ -4
        147, 50, 101, 100, 47, 114, 188, 122, 6, 351, 412, 343, 277, 329, 330, 280, 376
    ],[
        // RIGHT EYE HORZ 0
        111, 117, 118, 119, 120, 121, 128, 245
    ], [
        // LEFT EYE HORZ 0
        340, 346, 347, 348, 349, 350, 357, 465
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
        // RIGHT EYE HORZ 1
        31, 228, 229, 230, 231, 232, 233, // two more
    ], [
        // LEFT EYE HORZ 1
        261, 448, 449, 450, 451, 452, 453,
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
    ],[
        // LEFT EYE BROW -1
        441, 442, 443, 444, 445, 353
    ], [
        // RIGHT EYE BROW -1
        221, 222, 223, 224, 225, 124
    ], [
        // RIGHT EYE BROW -2
        56, 28, 27, 29, 30, 247
    ], [
        // LEFT EYE BROW -2
        286, 258, 257, 259, 260, 467
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
        // MOUSTACHE RIGHT -2
        205, 207, 214
    ], [
        // MOUSTACHE LEFT -2
        425, 427, 434
    ], [
        // NASENBEIN
        417, 168, 193,
    ], [
        // SCHLAEFE RIGHT
        234, 143, 35, 226, 130
    ], [
        // SCHLAEFE LEFT
        359, 446, 265, 372, 454
    ],[
        // EYE LID TOP LEFT
        398,384,385,386,387,388,466,263
    ], [
        // EYE LID BOTTOM LEFT
        263, 249, 390, 373, 374, 380, 381, 382,
    ], [
        // EYE LID TOP RIGHT
        173, 157, 158, 159, 160, 161, 246, 33
    ],[
        // EYE LID BOTTOM RIGHT
        7, 163, 144, 145, 153, 154, 155, 133
    ], [
        // BELOW LIPS
        422, 424, 418, 421, 200, 201, 194, 204, 202
    ], [
        // NASENBEIN -1
        285, 8, 55,
    ], [
        264, 342
    ], [
        34, 113
    ]]
    for (const line of lineStrips) {
        if (line === lineStrips[lineStrips.length-1]) {
            programRGBA.color([0.0, 0.5, 1.0, 1])
        }
        const mesh0 = new RenderMesh(gl, xyz, line, undefined, undefined, false)
        mesh0.bind(programRGBA)
        gl.drawElements(gl.LINE_STRIP, line.length, gl.UNSIGNED_SHORT, 0)
    }
}