import { mat4 } from "gl-matrix"
import { RenderMesh } from "./RenderMesh"
import { createNormalMatrix, createProjectionMatrix, prepareCanvas, prepareViewport } from "./render"
import { RGBAShader } from "./shader/RGBAShader"

let cone: RenderMesh

export function drawChordata(
    gl: WebGL2RenderingContext,
    programRGBA: RGBAShader
) {
    initCone(gl)
    const canvas = gl.canvas as HTMLCanvasElement
    prepareCanvas(canvas)
    prepareViewport(gl, canvas)
    const projectionMatrix = createProjectionMatrix(canvas)

        const modelViewMatrix = mat4.create()
        mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -25.0]) // move the model away
        mat4.rotate(modelViewMatrix, modelViewMatrix, 0.7, [0, 1, 0])
        const normalMatrix = createNormalMatrix(modelViewMatrix)
   
        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
        programRGBA.color([1, 1, 1, 1])

        cone.draw(programRGBA, gl.TRIANGLES)
}

function initCone(gl: WebGL2RenderingContext) {
    if (cone !== undefined) {
        return
    }
    const xyz = [
        -1, 1, -2,
        1, 1, -2,
        -1, -1, -2,
        1, -1, -2,

        0, 0, 2,
        -1, 1, -2,
        1, 1, -2,

        0, 0, 2,
        -1, -1, -2,
        1, -1, -2,

        0, 0, 2,
        -1, 1, -2,
        -1, -1, -2,

        0, 0, 2,
        1, 1, -2,
        1, -1, -2,
    ]
    const fxyz = [
        0, 1, 3,
        0, 3, 2,
        4, 5, 6,
        7, 8, 9,
        10, 11, 12,
        13, 14, 15
    ]
    cone = new RenderMesh(gl, new Float32Array(xyz), fxyz, undefined, undefined, false)
}