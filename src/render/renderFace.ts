import { mat4 } from "gl-matrix"
import { WavefrontObj } from "mesh/WavefrontObj"
import { createModelViewMatrix, createNormalMatrix, createProjectionMatrix, prepareCanvas, prepareViewport } from "./render"
import { RenderMesh } from "./RenderMesh"
import { RGBAShader } from "./shader/RGBAShader"
import { testCube } from "mesh/testCube"

export function renderFace(canvas: HTMLCanvasElement, obj: WavefrontObj, face: ArrayBuffer) {
    console.log("render face")
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
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -0.5]) // obj file face
    mat4.rotate(modelViewMatrix, modelViewMatrix, 0.0 * .7, [0, 1, 0])

    const normalMatrix = createNormalMatrix(modelViewMatrix)

    programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)


    // const mesh = new RenderMesh(gl, vertex, obj.fxyz, undefined, undefined, false)
    // test cube
    // const xyz = new Float32Array((testCube.vertexMorphed as any) as number[])
    // const fxyz = (testCube.baseMesh as any).indices as number[]

    // const xyz = obj.vertex
    const xyz = new Float32Array(face)
    const fxyz = obj.fxyz

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
    ]]
    for (const line of lineStrips) {
        const mesh0 = new RenderMesh(gl, xyz, line, undefined, undefined, false)
        mesh0.bind(programRGBA)
        gl.drawElements(gl.LINE_STRIP, line.length, gl.UNSIGNED_SHORT, 0)
    }
}
