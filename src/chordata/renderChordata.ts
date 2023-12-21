import { mat4, quat, vec3 } from "gl-matrix"
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
import { euler_matrix } from "lib/euler_matrix"
import { ColorShader } from "render/shader/ColorShader"

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
        for (const child of joint.children) {
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

    // bones.set("6/41", euler_matrix(settings.X0.value / D, settings.Y0.value / D, settings.Z0.value / D))
    // bones.set("6/42", euler_matrix(settings.X1.value / D, settings.Y1.value / D, settings.Z1.value / D))
    //
    // chordataSkeleton.build(scene.skeleton)
    // chordataSkeleton.update()
    //
    // const mesh = new SkeletonMesh(scene.skeleton, chordataSkeleton)
    // const s = new RenderMesh(gl, new Float32Array(mesh.vertex), mesh.indices, undefined, undefined, false)
    //
    // const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
    // const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
    // const normalMatrix = createNormalMatrix(modelViewMatrix)
    //
    // programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
    // programRGBA.setColor([1, 1, 1, 1])
    // s.draw(programRGBA, gl.TRIANGLES)

    const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
    const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
    const normalMatrix = createNormalMatrix(modelViewMatrix)

    const vertex: number[] = []
    const fvertex: number[] = []
    const color: number[] = []
    const index: number[] = []

    //
    //    1
    //  0   2
    //    3
    //

    function normal(p0: vec3, p1: vec3, p2: vec3) {
        const u = vec3.create(),
            v = vec3.create(),
            n = vec3.create()
        vec3.subtract(u, p1, p0)
        vec3.subtract(v, p2, p0)
        vec3.cross(n, u, v)
        return n
    }

    const n = 16
    const outerRadius = 1
    const innerRadius = 0.2
    const D = 2 * Math.PI
    const step = D / n
    const a0 = 5 // top
    const a1 = 2 // cone bottom
    const a2 = 0 // arrow bottom
    const vps = 6 // vertices per side
    const rgb = [1, 0, 0]
    const coneBottomCenter = vec3.fromValues(0, 0, a1)
    const coneBottomNormal = [0, 0, -1]

    const foo = Math.sqrt(Math.pow(outerRadius, 2) + Math.pow(a0 - a1, 2))

    const idx = index.length
    for (let i = 0; i < n; ++i) {
        const x0 = Math.cos(i * step)
        const y0 = Math.sin(i * step)
        const x1 = Math.cos((i + 0.5) * step)
        const y1 = Math.sin((i + 0.5) * step)

        const coneTop = vec3.fromValues(0, 0, a0)
        const coneButtom = vec3.fromValues(x0 * outerRadius, y0 * outerRadius, a1)
        const pipeTop = vec3.fromValues(x0 * innerRadius, y0 * innerRadius, a1)
        const pipeBottom = vec3.fromValues(x0 * innerRadius, y0 * innerRadius, a2)
        const pipeNorm = vec3.fromValues(x0, y0, 0)

        vertex.push(...coneTop, ...coneButtom, ...pipeTop, ...pipeBottom, ...coneButtom, ...coneBottomCenter)

        const n0 = vec3.fromValues(foo * x1, foo * y1, outerRadius)
        const n1 = vec3.fromValues(foo * x0, foo * y0, outerRadius)
        vec3.normalize(n0, n0)
        vec3.normalize(n1, n1)
        fvertex.push(...n0, ...n1, ...pipeNorm, ...pipeNorm, ...coneBottomNormal, ...coneBottomNormal)

        color.push(...rgb, ...rgb, ...rgb, ...rgb, ...rgb, ...rgb)
        index.push(
            idx + vps * i,
            idx + vps * i + 1,
            (idx + vps * i + vps + 1) % (vps * n),

            idx + vps * i + 2,
            idx + vps * i + 3,
            (idx + vps * i + vps + 3) % (vps * n),

            idx + vps * i + 2,
            (idx + vps * i + vps + 3) % (vps * n),
            (idx + vps * i + vps + 2) % (vps * n),

            idx + vps * i + 4,
            idx + vps * i + 5,
            (idx + vps * i + vps + 4) % (vps * n)
        )
    }

    const glVertex = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, glVertex)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex), gl.STATIC_DRAW)

    const glNormal = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, glNormal)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(fvertex), gl.STATIC_DRAW)

    const glColor = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, glColor)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW)

    const glIndices = gl.createBuffer()!
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, glIndices)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(index), gl.STATIC_DRAW)

    const s = new ColorShader(gl)
    s.init(projectionMatrix, modelViewMatrix, normalMatrix)

    s.bind(glIndices, glVertex, glNormal, glColor)
    gl.drawElements(gl.TRIANGLES, index.length, gl.UNSIGNED_SHORT, 0)

    // const v = gl.createBuffer()
    // gl.bufferData(v, this.gl.ARRAY_BUFFER, this.gl.STATIC_DRAW)
}
