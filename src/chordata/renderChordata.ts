import { mat4, quat } from "gl-matrix"
import { RenderMesh } from "../render/RenderMesh"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "../render/util"
import { RGBAShader } from "../render/shader/RGBAShader"
import { ChordataSettings } from "./ChordataSettings"
import { HumanMesh } from "mesh/HumanMesh"
import { Context } from "render/Context"
import { Projection } from "render/render"
import { Joint } from "./Joint"
import { SkeletonMesh } from "./SkeletonMesh"

export const bones = new Map<string, mat4>()

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

// assume the sensors are now in rest pose
export function calibrateNPose(joint?: Joint) {
    if (joint === undefined) {
        joint = chordataSkeleton
    }
    const matPose = bones.get(`${joint.branch}/${joint.id}`)!
    joint.matNPoseInv = mat4.invert(mat4.create(), matPose)
    if (joint.children !== undefined) {
        for(const child of joint.children) {
            calibrateNPose(child)
        }
    }
}

// set an initial COOP packet
setBones(
    new Map<string, number[]>([
        // ["/%/kc_0x42branch6", [-0.0116586, 0.351683, 0.928858, -0.115784]],
        // ["/%/kc_0x41branch6", [-0.0157049, 0.612659, 0.789144, -0.0406618]],
        // ["/%/kc_0x40branch6", [-0.0206191, 0.282804, 0.95885, -0.0142731]],
        // ["/%/kc_0x42branch5", [-0.437385, 0.408202, 0.547886, -0.584711]],
        // ["/%/kc_0x41branch5", [-0.740224, -0.437169, 0.169961, -0.481731]],
        // ["/%/kc_0x40branch5", [-0.281567, -0.781, 0.219733, -0.512325]],
        // ["/%/kc_0x42branch4", [-0.0397931, 0.449987, 0.892107, 0.00862156]],
        // ["/%/kc_0x41branch4", [-0.0155865, 0.737169, 0.674928, -0.0285038]],
        // ["/%/kc_0x40branch4", [-0.0438127, 0.157583, 0.98258, -0.088229]],
        // ["/%/kc_0x42branch3", [0.0170646, 0.948076, 0.313278, 0.0521385]],
        // ["/%/kc_0x41branch3", [0.0807505, 0.524097, 0.358437, -0.768326]],
        // ["/%/kc_0x40branch3", [-0.0202535, 0.48423, 0.462811, -0.742238]],
        // ["/%/kc_0x42branch1", [0.113668, 0.315253, 0.921183, -0.197781]],
        // ["/%/kc_0x41branch1", [-0.392768, -0.498948, 0.532651, -0.559524]],
        // ["/%/kc_0x40branch1", [-0.428276, -0.163105, 0.552124, -0.696517]],
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

    // bones.set("5/41", euler_matrix(settings.X0.value / D, settings.Y0.value / D, settings.Z0.value / D))
    // bones.set("5/42", euler_matrix(settings.X1.value / D, settings.Y1.value / D, settings.Z1.value / D))

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
