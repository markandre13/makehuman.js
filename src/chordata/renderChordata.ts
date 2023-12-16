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
import { Skeleton } from "skeleton/Skeleton"
import { euler_matrix } from "lib/euler_matrix"
import { getMatrix } from "skeleton/loadSkeleton"

let cone: RenderMesh

const bones = new Map<string, mat4>()

// save the result of a decoded COOP packet
export function setBones(newBones: Map<string, number[]>) {
    bones.clear()
    newBones.forEach((value, key) => {
        // /%/kc_0x42branch6 -> {branch}/{id}
        bones.set(
            `${key.substring(16, 17)}/${key.substring(8, 10)}`,
            mat4.fromQuat(mat4.create(), quat.fromValues(value[0], value[1], value[2], value[3]))
        )
        // TODO: update view
    })
}

// set an initial COOP packet
setBones(
    new Map<string, number[]>([
        ["/%/kc_0x42branch6", [0, 0, 0, 0]],
        ["/%/kc_0x41branch6", [0, 0, 0, 0]],
        ["/%/kc_0x40branch6", [0, 0, 0, 0]],
        ["/%/kc_0x42branch5", [0, 0, 0, 0]],
        ["/%/kc_0x41branch5", [0, 0, 0, 0]],
        ["/%/kc_0x40branch5", [0, 0, 0, 0]],
        ["/%/kc_0x42branch4", [0, 0, 0, 0]],
        ["/%/kc_0x41branch4", [0, 0, 0, 0]],
        ["/%/kc_0x40branch4", [0, 0, 0, 0]],
        ["/%/kc_0x42branch3", [0, 0, 0, 0]],
        ["/%/kc_0x41branch3", [0, 0, 0, 0]],
        ["/%/kc_0x40branch3", [0, 0, 0, 0]],
        ["/%/kc_0x42branch1", [0, 0, 0, 0]],
        ["/%/kc_0x41branch1", [0, 0, 0, 0]],
        ["/%/kc_0x40branch1", [0, 0, 0, 0]],
    ])
)

class Joint {
    branch: number
    id: number
    name: string
    children?: Joint[]

    parent?: Joint
    matRestGlobal!: mat4
    matRestRelative!: mat4
    length!: number
    yvector4!: vec4

    matPoseGlobal!: mat4

    constructor(branch: number, id: number, name: string, children?: Joint[]) {
        this.branch = branch
        this.id = id
        this.name = name
        this.children = children
        if (children !== undefined) {
            children.forEach((it) => (it.parent = this))
        }
    }

    // only needed once (similar to the makehuman skeleton/bone)
    build(skeleton: Skeleton) {
        if (this.matRestGlobal !== undefined) {
            return
        }
        //
        // get head and tail
        //
        const b0 = skeleton.getBone(this.name)
        const head3 = vec3.create()
        vec3.transformMat4(head3, head3, b0.matPoseGlobal!)

        let tail3!: vec3
        if (this.children === undefined) {
            tail3 = vec3.fromValues(b0.yvector4![0], b0.yvector4![1], b0.yvector4![2])
            vec3.scale(tail3, tail3, 4)
            vec3.transformMat4(tail3, tail3, b0.matPoseGlobal!)
        } else {
            const j1 = this.children[0]
            const b1 = skeleton.getBone(j1.name)
            tail3 = vec3.create()
            vec3.transformMat4(tail3, tail3, b1.matPoseGlobal!)
        }

        //
        // calculate restGlobal and restRelative
        //
        let normal = vec3.fromValues(0, 1, 0)

        this.matRestGlobal = getMatrix(head3, tail3, normal)
        this.length = vec3.distance(head3, tail3)
        if (this.parent === undefined) {
            this.matRestRelative = this.matRestGlobal
        } else {
            this.matRestRelative = mat4.mul(
                mat4.create(),
                mat4.invert(mat4.create(), this.parent.matRestGlobal!),
                this.matRestGlobal
            )
        }
        this.yvector4 = vec4.fromValues(0, this.length, 0, 1)

        if (this.children !== undefined) {
            for(const j1 of this.children) {
                j1.build(skeleton)
            }
        }
    }

    // update matPoseGlobal
    update() {
        const matPose = bones.get(`${this.branch}/${this.id}`)!
        if (this.parent !== undefined) {
            this.matPoseGlobal = mat4.multiply(
                mat4.create(),
                this.parent.matPoseGlobal!,
                mat4.multiply(mat4.create(), this.matRestRelative!, matPose!)
            )
        } else {
            this.matPoseGlobal = mat4.multiply(mat4.create(), this.matRestRelative!, matPose!)
        }
        if (this.children !== undefined) {
            for(const j1 of this.children) {
                j1.update()
            }
        }
    }
}

// prettier-ignore
const chordataSkeleton = new Joint(5, 40, "root", [
    new Joint(5, 41, "spine02", [ // dorsal (poseunits: spine05, spine04, spine03, spine02)
        new Joint(5, 42, "neck02"), // neck (poseunits: spine01, neck01, neck02, neck03, head)
        new Joint(6, 40, "upperarm01.L", [ // l-upperarm (poseunits: clavicle.R, soulder01.R, upperarm01.R)
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

class SkeletonMesh {
    skeleton: Skeleton
    constructor(skeleton: Skeleton, joint: Joint) {
        this.skeleton = skeleton
        this.addJoint(joint)
    }

    vertex: number[] = []
    indices: number[] = []

    addVec(j: vec3) {
        this.vertex.push(...j)
        this.indices.push(this.indices.length)
    }

    addBone(m: mat4, p: vec3) {
        const head = vec3.create()
        const tail = vec3.copy(vec3.create(), p)
        const center = vec3.scale(vec3.create(), tail, 0.2)

        const r = 0.3 // distance from center

        const a = center[0]
        const b = center[1]
        const c = center[2]
        const q0 = vec3.fromValues(b + c, c - a, -a - b)
        vec3.normalize(q0, q0)
        vec3.scale(q0, q0, r)
        const d0 = vec3.add(vec3.create(), center, q0)

        const q1 = vec3.cross(vec3.create(), center, q0)
        vec3.normalize(q1, q1)
        vec3.scale(q1, q1, r)
        const d1 = vec3.add(vec3.create(), q1, center)

        const q2 = vec3.scale(vec3.create(), q0, -1)
        const d2 = vec3.add(vec3.create(), q2, center)

        const q3 = vec3.scale(vec3.create(), q1, -1)
        const d3 = vec3.add(vec3.create(), q3, center)

        vec3.transformMat4(head, head, m)
        vec3.transformMat4(tail, tail, m)
        vec3.transformMat4(d0, d0, m)
        vec3.transformMat4(d1, d1, m)
        vec3.transformMat4(d2, d2, m)
        vec3.transformMat4(d3, d3, m)

        this.addVec(head)
        this.addVec(d0)
        this.addVec(d1)

        this.addVec(head)
        this.addVec(d1)
        this.addVec(d2)

        this.addVec(head)
        this.addVec(d2)
        this.addVec(d3)

        this.addVec(head)
        this.addVec(d3)
        this.addVec(d0)

        this.addVec(d0)
        this.addVec(d1)
        this.addVec(tail)

        this.addVec(d1)
        this.addVec(d2)
        this.addVec(tail)

        this.addVec(d2)
        this.addVec(d3)
        this.addVec(tail)

        this.addVec(d3)
        this.addVec(d0)
        this.addVec(tail)
    }

    addJoint(j0: Joint) {
        this.addBone(j0.matPoseGlobal, j0.yvector4! as vec3)
        if (j0.children !== undefined) {
            for (const j1 of j0.children) {
                this.addJoint(j1)
            }
        }
    }
}

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

    bones.set("5/41", euler_matrix(settings.X0.value / D, settings.Y0.value / D, settings.Z0.value / D))
    bones.set("5/42", euler_matrix(settings.X1.value / D, settings.Y1.value / D, settings.Z1.value / D))

    chordataSkeleton.build(scene.skeleton)
    chordataSkeleton.update()

    const mesh = new SkeletonMesh(scene.skeleton, chordataSkeleton)
    const s = new RenderMesh(gl, new Float32Array(mesh.vertex), mesh.indices, undefined, undefined, false)

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

    bones.forEach((m, name) => {
        // create model view matrix which places bone at (x, y, -25)
        const modelViewMatrix = mat4.create()
        mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, -25.0]) // move the model away

        // rotate bone using Chordata quaternion
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
