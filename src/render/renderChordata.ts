import { mat4, quat, vec4 } from "gl-matrix"
import { RenderMesh } from "./RenderMesh"
import { createNormalMatrix, createProjectionMatrix, prepareCanvas, prepareViewport } from "./render"
import { RGBAShader } from "./shader/RGBAShader"
import { span, text } from "toad.js"

let cone: RenderMesh

const bones = new Map<string, number[]>([
    ["/%/kc_0x42branch6", [-0.0116586, 0.351683, 0.928858, -0.115784]],
    ["/%/kc_0x41branch6", [-0.0157049, 0.612659, 0.789144, -0.0406618]],
    ["/%/kc_0x40branch6", [-0.0206191, 0.282804, 0.95885, -0.0142731]],
    ["/%/kc_0x42branch5", [-0.437385, 0.408202, 0.547886, -0.584711]],
    ["/%/kc_0x41branch5", [-0.740224, -0.437169, 0.169961, -0.481731]],
    ["/%/kc_0x40branch5", [-0.281567, -0.781, 0.219733, -0.512325]],
    ["/%/kc_0x42branch4", [-0.0397931, 0.449987, 0.892107, 0.00862156]],
    ["/%/kc_0x41branch4", [-0.0155865, 0.737169, 0.674928, -0.0285038]],
    ["/%/kc_0x40branch4", [-0.0438127, 0.157583, 0.98258, -0.088229]],
    ["/%/kc_0x42branch3", [0.0170646, 0.948076, 0.313278, 0.0521385]],
    ["/%/kc_0x41branch3", [0.0807505, 0.524097, 0.358437, -0.768326]],
    ["/%/kc_0x40branch3", [-0.0202535, 0.48423, 0.462811, -0.742238]],
    ["/%/kc_0x42branch1", [0.113668, 0.315253, 0.921183, -0.197781]],
    ["/%/kc_0x41branch1", [-0.392768, -0.498948, 0.532651, -0.559524]],
    ["/%/kc_0x40branch1", [-0.428276, -0.163105, 0.552124, -0.696517]],
]);

export function drawChordata(
    gl: WebGL2RenderingContext,
    programRGBA: RGBAShader,
    overlay: HTMLElement
) {
    initCone(gl)

    const canvas = gl.canvas as HTMLCanvasElement
    prepareCanvas(canvas)
    prepareViewport(gl, canvas)
    const projectionMatrix = createProjectionMatrix(canvas)

    const modelViewMatrix = mat4.create()
    mat4.translate(modelViewMatrix, modelViewMatrix, [-10.0, -5.0, -25.0]) // move the model away

    const bone = bones.get("/%/kc_0x42branch6")!
    const q = quat.fromValues(bone[0], bone[1], bone[2], bone[3])
    const m = mat4.fromQuat(mat4.create(), q)
    mat4.multiply(modelViewMatrix, modelViewMatrix, m)

    if (overlay.children.length === 0) {
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection

        // model -> MODEL MATRIX -> model in world -> PROJECTION MATRIX

        // CLIPSPACE (-1,-1,-1) to (1,1,1)
        // These composed matrices ultimately move the original model data around into a special
        // coordinate space called clip space. This is a 2 unit wide cube, centered at (0,0,0), 
        // and with corners that range from (-1,-1,-1) to (1,1,1). This clip space is compressed 
        // down into a 2D space and rasterized into an image.

        const m = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix)

        const point = vec4.fromValues(0, 0, 2, 1) // this is the front top right corner
        const clipspace = vec4.transformMat4(vec4.create(), point, m)
        clipspace[0] /= clipspace[3]
        clipspace[1] /= clipspace[3]
        const pixelX = (clipspace[0] *  0.5 + 0.5) * gl.canvas.width;
        const pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

        const s = span(text("/%/kc_0x42branch6"))
        s.style.position = "absolute"
        s.style.left = `${pixelX}px`
        s.style.top = `${pixelY}px`
        overlay.replaceChildren(s)

        console.log(`place text at (${pixelX},${pixelY})`)
    }

    // mat4.rotate(modelViewMatrix, modelViewMatrix, 0.7, [0, 1, 0])
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