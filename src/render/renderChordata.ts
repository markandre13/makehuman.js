import { mat4, quat, vec4 } from "gl-matrix"
import { RenderMesh } from "./RenderMesh"
import { createNormalMatrix, createProjectionMatrix, prepareCanvas, prepareViewport } from "./util"
import { RGBAShader } from "./shader/RGBAShader"
import { span, text } from "toad.js"

let cone: RenderMesh

const bones = new Map<string, number[]>()

export function setBones(newBones: Map<string, number[]>) {
    bones.clear()
    newBones.forEach((value, key) => {
        // /%/kc_0x42branch6
        bones.set(`${key.substring(16,17)}/${key.substring(8,10)}`, value)
    })
}

setBones(new Map<string, number[]>([
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
]))

export function renderChordata(
    gl: WebGL2RenderingContext,
    programRGBA: RGBAShader,
    overlay: HTMLElement
) {
    initCone(gl)
    const overlayChildren: HTMLElement[] = []

    const canvas = gl.canvas as HTMLCanvasElement
    prepareCanvas(canvas)
    prepareViewport(gl, canvas)
    const projectionMatrix = createProjectionMatrix(canvas)

    gl.disable(gl.CULL_FACE)
    gl.depthMask(true)

    let x = 10, y = -5, idx = 0

    bones.forEach((bone, name) => {

        const modelViewMatrix = mat4.create()
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, -25.0]) // move the model away

        const q = quat.fromValues(bone[0], bone[1], bone[2], bone[3])
        const m = mat4.fromQuat(mat4.create(), q)
        mat4.multiply(modelViewMatrix, modelViewMatrix, m)
        const normalMatrix = createNormalMatrix(modelViewMatrix)
        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
        programRGBA.setColor([1, 0.5, 0, 1])
        cone.draw(programRGBA, gl.TRIANGLES)

        // model -> MODEL MATRIX -> model in world -> PROJECTION MATRIX -> model in clipspace
        // clipspace is (-1,-1,-1) to (1,1,1)
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection

        const m0 = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix)

        const point = vec4.fromValues(0, 0, 2, 1) // this is the front top right corner
        const clipspace = vec4.transformMat4(vec4.create(), point, m0)
        clipspace[0] /= clipspace[3]
        clipspace[1] /= clipspace[3]
        const pixelX = (clipspace[0] *  0.5 + 0.5) * gl.canvas.width;
        const pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

        if (overlay.children.length === 0) {
            const label = span(text(name))
            label.style.position = "absolute"
            label.style.color = "#08f"
            label.style.fontWeight = "bold"
            label.style.left = `${pixelX}px`
            label.style.top = `${pixelY}px`
            overlayChildren.push(label)
        } else {
            (overlay.children[idx] as HTMLElement).style.left = `${pixelX}px`;
            (overlay.children[idx] as HTMLElement).style.top = `${pixelY}px`
        }

        y += 5
        if (y >= 10) {
            y = -5
            x -= 5
        }
        ++idx
    })

    if (overlay.children.length === 0) {
        overlay.replaceChildren(...overlayChildren)
    }
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