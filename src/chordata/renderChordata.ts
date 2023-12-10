import { mat4, quat, vec3, vec4 } from "gl-matrix"
import { RenderMesh } from "../render/RenderMesh"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "../render/util"
import { RGBAShader } from "../render/shader/RGBAShader"
import { span, text } from "toad.js"
import { ChordataSettings } from "./ChordataSettings"
import { HumanMesh } from "mesh/HumanMesh"
import { Context } from "render/Context"
import { Projection } from "render/render"

let cone: RenderMesh

const bones = new Map<string, number[]>()

export function setBones(newBones: Map<string, number[]>) {
    bones.clear()
    newBones.forEach((value, key) => {
        // /%/kc_0x42branch6
        bones.set(`${key.substring(16, 17)}/${key.substring(8, 10)}`, value)
        // TODO: update view
    })
}

setBones(
    new Map<string, number[]>([
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
    ])
)

class Joint {
    branch: number
    id: number
    name: string
    children?: Joint[]
    constructor(branch: number, id: number, name: string, children?: Joint[]) {
        this.branch = branch
        this.id = id
        this.name = name
        this.children = children
    }
}

// TODO: try to get the positions from the Makehuman skeleton

// prettier-ignore
const skeleton = new Joint(5, 40, "root", [
    new Joint(5, 41, "spine02", [ // dorsal (poseunits: spine05, spine04, spine03, spine02)
        new Joint(5, 42, "neck02"), // neck (poseunits: spine01, neck01, neck02, neck03, head)
        new Joint(6, 40, "upperarm01.L", [ // l-upperarm (clavicle.R, soulder01.R, upperarm01.R)
            new Joint(6, 41, "lowerarm01.L", [ // l-lowerarm
                new Joint(6, 42, "wrist.L") // l-hand
            ])
        ]),
        new Joint(4, 40, "upperarm01.R", [
            new Joint(4, 41, "lowerarm01.R", [
                new Joint(4, 42, "wrist.R")
            ])
        ])
    ]),
    new Joint(1, 40, "upperleg01.L", [
        new Joint(1, 41, "lowerleg01.L", [
            new Joint(1, 42, "foot.L")
        ])
    ]),
    new Joint(3, 40, "upperleg01.R", [
        new Joint(3, 41, "lowerleg01.R", [
            new Joint(3, 42, "foot.R")
        ])
    ])
])

const D = 180 / Math.PI

export function renderChordata(
    ctx: Context,
    gl: WebGL2RenderingContext,
    programRGBA: RGBAShader,
    overlay: HTMLElement,
    scene: HumanMesh,
    settings: ChordataSettings
) {
    const canvas = gl.canvas as HTMLCanvasElement
    prepareCanvas(canvas)
    prepareViewport(gl, canvas)

    gl.disable(gl.CULL_FACE)
    gl.depthMask(true)

    const vertex: number[] = []
    const indices: number[] = []

    const addVec = (j: vec3) => {
        vertex.push(...j)
        indices.push(indices.length)
    }

    const addBone = (j0: vec3, j1: vec3) => {
        const d = vec3.sub(vec3.create(), j1, j0)

        // const f = vec3.length(d)
        const f = 0.3

        vec3.scale(d, d, 0.2)

        const center = vec3.add(vec3.create(), j0, d)

        const a = d[0]
        const b = d[1]
        const c = d[2]
        const q0 = vec3.fromValues(b + c, c - a, -a - b)
        vec3.normalize(q0, q0)
        vec3.scale(q0, q0, f)
        const d0 = vec3.add(vec3.create(), q0, center)

        const q1 = vec3.cross(vec3.create(), d, q0)
        vec3.normalize(q1, q1)
        vec3.scale(q1, q1, f)
        const d1 = vec3.add(vec3.create(), q1, center)

        const q2 = vec3.scale(vec3.create(), q0, -1)
        const d2 = vec3.add(vec3.create(), q2, center)

        const q3 = vec3.scale(vec3.create(), q1, -1)
        const d3 = vec3.add(vec3.create(), q3, center)

        addVec(j0)
        addVec(d0)
        addVec(d1)

        addVec(j0)
        addVec(d1)
        addVec(d2)

        addVec(j0)
        addVec(d2)
        addVec(d3)

        addVec(j0)
        addVec(d3)
        addVec(d0)

        addVec(d0)
        addVec(d1)
        addVec(j1)

        addVec(d1)
        addVec(d2)
        addVec(j1)

        addVec(d2)
        addVec(d3)
        addVec(j1)

        addVec(d3)
        addVec(d0)
        addVec(j1)
    }

    const addJoint = (j: Joint) => {
        const b0 = scene.skeleton.getBone(j.name)
        const j0 = vec3.create()
        vec3.transformMat4(j0, j0, b0.matPoseGlobal!)
        if (j.children === undefined) {
            const j1 = vec3.fromValues(b0.yvector4![0], b0.yvector4![1], b0.yvector4![2],)
            vec3.transformMat4(j1, j1, scene.skeleton.getBone(j.name).matPoseGlobal!)
            addBone(j0, j1)
        } else {
            j.children.forEach((a: Joint) => {
                const b1 = scene.skeleton.getBone(a.name)
                const j1 = vec3.create()
                vec3.transformMat4(j1, j1, b1.matPoseGlobal!)
                addBone(j0, j1)
                addJoint(a)
            })
        }
    }
    addJoint(skeleton)

    const s = new RenderMesh(gl, new Float32Array(vertex), indices, undefined, undefined, false)

    const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
    const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
    const normalMatrix = createNormalMatrix(modelViewMatrix)

    programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
    programRGBA.setColor([1, 1, 1, 1])
    s.draw(programRGBA, gl.TRIANGLES)
}

export function renderChordataX(
    gl: WebGL2RenderingContext,
    programRGBA: RGBAShader,
    overlay: HTMLElement,
    settings: ChordataSettings
) {
    initCone(gl)
    const overlayChildren: HTMLElement[] = []

    const canvas = gl.canvas as HTMLCanvasElement
    prepareCanvas(canvas)
    prepareViewport(gl, canvas)
    const projectionMatrix = createProjectionMatrix(canvas)

    gl.disable(gl.CULL_FACE)
    gl.depthMask(true)

    let x = 10,
        y = -5,
        idx = 0

    bones.forEach((bone, name) => {
        // create model view matrix which places bone at (x, y, -25)
        const modelViewMatrix = mat4.create()
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, -25.0]) // move the model away

        // rotate bone using Chordata quaternion
        const q = quat.fromValues(bone[0], bone[1], bone[2], bone[3])
        const m = mat4.fromQuat(mat4.create(), q)
        mat4.multiply(modelViewMatrix, modelViewMatrix, m)

        // draw bone
        const normalMatrix = createNormalMatrix(modelViewMatrix)
        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
        programRGBA.setColor([1, 0.5, 0, 1])
        cone.draw(programRGBA, gl.TRIANGLES)

        // model -> MODEL MATRIX -> model in world -> PROJECTION MATRIX -> model in clipspace
        // clipspace is (-1,-1,-1) to (1,1,1)
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_model_view_projection

        // add/place label
        const m0 = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix)
        const point = vec4.fromValues(0, 0, 2, 1) // this is the front top right corner
        const clipspace = vec4.transformMat4(vec4.create(), point, m0)
        clipspace[0] /= clipspace[3]
        clipspace[1] /= clipspace[3]
        const pixelX = (clipspace[0] * 0.5 + 0.5) * gl.canvas.width
        const pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height

        if (overlay.children.length === 0) {
            const label = span(text(name))
            label.style.position = "absolute"
            label.style.color = "#08f"
            label.style.fontWeight = "bold"
            label.style.left = `${pixelX}px`
            label.style.top = `${pixelY}px`
            overlayChildren.push(label)
        } else {
            ;(overlay.children[idx] as HTMLElement).style.left = `${pixelX}px`
            ;(overlay.children[idx] as HTMLElement).style.top = `${pixelY}px`
        }

        // move (x, y) to next bone
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

    // prettier-ignore
    const xyz = [
        -1, -2, 1,
        1, -2, 1,
        -1, -2, -1,
        1, -2, -1,

        0, 2, 0,
        -1, -2, 1,
        1, -2, 1,

        0, 2, 0,
        -1, -2, -1,
        1, -2, -1,

        0, 2, 0,
        -1, -2, 1,
        -1, -2, -1,

        0, 2, 0,
        1, -2, 1,
        1, -2, -1,
    ]
    // prettier-ignore
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
