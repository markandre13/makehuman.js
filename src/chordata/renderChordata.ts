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
import { ChordataSettings } from "./ChordataSettings"
import { HumanMesh } from "mesh/HumanMesh"
import { Context } from "render/Context"
import { Projection } from "render/render"
import { SkeletonMesh } from "./SkeletonMesh"
import { ColorShader } from "render/shader/ColorShader"
import { span, text } from "toad.js"
import { Skeleton } from "./Skeleton"
import { euler_from_matrix, euler_matrix } from "lib/euler_matrix"

export const D = 180 / Math.PI

// const skeleton = new Skeleton()
export let skeleton: Skeleton

// in no avatar/scan has been configured
const kceptorName2boneName = new Map<string, string>([
    ["kc_0x40branch1", "r-upperleg"],
    ["kc_0x41branch1", "r-lowerleg"],
    ["kc_0x42branch1", "r-foot"],
    ["kc_0x40branch3", "l-upperleg"],
    ["kc_0x41branch3", "l-lowerleg"],
    ["kc_0x42branch3", "l-foot"],
    ["kc_0x40branch4", "l-upperarm"],
    ["kc_0x41branch4", "l-lowerarm"],
    ["kc_0x42branch4", "l-hand"],
    ["kc_0x40branch5", "base"],
    ["kc_0x41branch5", "dorsal"],
    ["kc_0x42branch5", "neck"],
    ["kc_0x40branch6", "r-upperarm"],
    ["kc_0x41branch6", "r-lowerarm"],
    ["kc_0x42branch6", "r-hand"],
])

/**
 * Convert Chordata/Blender quaternion to OpenGL matrix
 *
 * Chordata stores quaternions as [w, x, y, z], gl-matrix as [x, y, z, w]
 *
 * Chordata uses a right-hand coordinate system with Z being up:
 * ```
 *     Z    _ Y
 *     ^    /|
 *     |  /
 *     |/
 *     +----> X
 * ```
 * OpenGL uses a right-hand coordinate system with Y being up, and a
 * left-handed in screen-space
 * ```
 *     Y    _ Z
 *     ^    /|
 *     |  /
 *     |/
 *     +----> X
 * ```
 */
function chordataQuat2glMatrix(chordataQuaternion: number[]) {
    const [w, x, y, z] = chordataQuaternion
    const m = mat4.fromQuat(mat4.create(), quat.fromValues(x, z, -y, w))
    return m
}

// save the result of a decoded COOP packet
export function setBones(newBones: Map<string, number[]>) {
    // console.log(newBones)
    newBones.forEach((value, key) => {
        if (value.length !== 4) {
            return
        }
        // in case we got a kceptor name, convert it to a bone name
        let name = key.substring(3)
        const boneName = kceptorName2boneName.get(name)
        if (boneName !== undefined) {
            name = boneName
        }
        // store for rendering
        const m = chordataQuat2glMatrix(value)
        skeleton.setKCeptor(name, m)
    })
}

// assume the sensors are now in rest pose
export function calibrateNPose() {
    skeleton.startCalibration()
}

export function resetCalibration() {
    skeleton.resetCalibration()
}

export function renderChordata(
    ctx: Context,
    gl: WebGL2RenderingContext,
    programRGBA: RGBAShader,
    overlay: HTMLElement,
    scene: HumanMesh,
    settings: ChordataSettings
) {
    if (skeleton === undefined) {
        skeleton = new Skeleton()
        // set an initial COOP packet
        setBones(
            new Map<string, number[]>([
                ["/%/base", [0, 0, 0, 0]],
                ["/%/dorsal", [0, 0, 0, 0]],
                ["/%/neck", [0, 0, 0, 0]],
                ["/%/l-upperarm", [0, 0, 0, 0]],
                ["/%/l-lowerarm", [0, 0, 0, 0]],
                ["/%/l-hand", [0, 0, 0, 0]],
                ["/%/r-upperarm", [0, 0, 0, 0]],
                ["/%/r-lowerarm", [0, 0, 0, 0]],
                ["/%/r-hand", [0, 0, 0, 0]],
                ["/%/l-upperleg", [0, 0, 0, 0]],
                ["/%/l-lowerleg", [0, 0, 0, 0]],
                ["/%/l-foot", [0, 0, 0, 0]],
                ["/%/r-upperleg", [0, 0, 0, 0]],
                ["/%/r-lowerleg", [0, 0, 0, 0]],
                ["/%/r-foot", [0, 0, 0, 0]],
            ])
        )
    }

    const canvas = gl.canvas as HTMLCanvasElement
    prepareCanvas(canvas)
    prepareViewport(gl, canvas)

    gl.disable(gl.CULL_FACE)
    gl.depthMask(true)

    // skeleton.setKCeptor(
    //     "l-upperarm",
    //     euler_matrix(settings.v0.value[0] / D, settings.v0.value[1] / D, settings.v0.value[2] / D)
    // )
    // skeleton.setKCeptor(
    //     "l-lowerarm",
    //     euler_matrix(settings.v1.value[0] / D, settings.v1.value[1] / D, settings.v1.value[2] / D)
    // )

    if (!settings.mountKCeptorView.value) {
        if (overlay.children.length > 0) {
            overlay.replaceChildren()
        }
        // skeleton.root.build(scene.skeleton)
        // skeleton.root.update(settings)

        // const mesh = new SkeletonMesh(scene.skeleton, skeleton.root)
        // const s = new RenderMesh(gl, new Float32Array(mesh.vertex), mesh.indices, undefined, undefined, false)

        // const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        // const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
        // const normalMatrix = createNormalMatrix(modelViewMatrix)

        // programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
        // programRGBA.setColor([1, 1, 1, 1])
        // s.draw(programRGBA, gl.TRIANGLES)
    } else {
        const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        const vertex: number[] = []
        const fvertex: number[] = []
        const color: number[] = []
        const index: number[] = []

        const drawArrow = (m: mat4, rgb: number[]) => {
            const n = 16
            const coneRadius = 0.2
            const pipeRadius = 0.05
            const D = 2 * Math.PI
            const step = D / n
            const a0 = 1 // top
            const a1 = 0.5 // cone bottom
            const a2 = 0 // arrow bottom
            const vps = 6 // vertices per side
            const coneBottomCenter = vec3.fromValues(0, 0, a1)
            const coneBottomNormal = vec3.fromValues(0, 0, -1)
            const coneSideLength = Math.sqrt(Math.pow(coneRadius, 2) + Math.pow(a0 - a1, 2))

            vec3.transformMat4(coneBottomCenter, coneBottomCenter, m)
            vec3.transformMat4(coneBottomNormal, coneBottomNormal, m)

            const idx = vertex.length / 3
            for (let i = 0; i < n; ++i) {
                const x0 = Math.cos(i * step)
                const y0 = Math.sin(i * step)
                const x1 = Math.cos((i + 0.5) * step)
                const y1 = Math.sin((i + 0.5) * step)

                const coneTop = vec3.fromValues(0, 0, a0)
                const coneButtom = vec3.fromValues(x0 * coneRadius, y0 * coneRadius, a1)
                const pipeTop = vec3.fromValues(x0 * pipeRadius, y0 * pipeRadius, a1)
                const pipeBottom = vec3.fromValues(x0 * pipeRadius, y0 * pipeRadius, a2)
                const pipeNorm = vec3.fromValues(x0, y0, 0)

                const coneSideBottomNormal = vec3.fromValues(coneSideLength * x0, coneSideLength * y0, coneRadius)
                const coneSideTopNormal = vec3.fromValues(coneSideLength * x1, coneSideLength * y1, coneRadius)
                vec3.normalize(coneSideBottomNormal, coneSideBottomNormal)
                vec3.normalize(coneSideTopNormal, coneSideTopNormal)

                vec3.transformMat4(coneTop, coneTop, m)
                vec3.transformMat4(coneButtom, coneButtom, m)
                vec3.transformMat4(pipeTop, pipeTop, m)
                vec3.transformMat4(pipeBottom, pipeBottom, m)

                vec3.transformMat4(coneSideTopNormal, coneSideTopNormal, m)
                vec3.transformMat4(coneSideBottomNormal, coneSideBottomNormal, m)
                vec3.transformMat4(pipeNorm, pipeNorm, m)

                vertex.push(...coneTop, ...coneButtom, ...pipeTop, ...pipeBottom, ...coneButtom, ...coneBottomCenter)
                fvertex.push(
                    ...coneSideTopNormal,
                    ...coneSideBottomNormal,
                    ...pipeNorm,
                    ...pipeNorm,
                    ...coneBottomNormal,
                    ...coneBottomNormal
                )
                color.push(...rgb, ...rgb, ...rgb, ...rgb, ...rgb, ...rgb)

                index.push(
                    // cone side
                    idx + vps * i,
                    idx + vps * i + 1,
                    idx + ((vps * i + vps + 1) % (vps * n)),

                    // cylinder 1
                    idx + vps * i + 2,
                    idx + vps * i + 3,
                    idx + ((vps * i + vps + 3) % (vps * n)),

                    // cylinder 2
                    idx + vps * i + 2,
                    idx + ((vps * i + vps + 3) % (vps * n)),
                    idx + ((vps * i + vps + 2) % (vps * n)),

                    // cone bottom
                    idx + vps * i + 4,
                    idx + vps * i + 5,
                    idx + ((vps * i + vps + 4) % (vps * n))
                )
            }
        }

        let idx = 0
        const overlayChildren: HTMLElement[] = []

        // NTSC rgb to gray, based on average persons perception of brightness of red, green and blue
        function rgb2gray(r: number, g: number, b: number) {
            return 0.299 * r + 0.587 * g + 0.114 * b
        }

        const drawAxis = (x: number, y: number, chordataName: string) => {
            const m = mat4.create()
            mat4.translate(m, m, vec3.fromValues(x, y, 0))
            const joint = skeleton.getJoint(chordataName)

            mat4.multiply(m, m, joint.getCalibrated())

            mat4.rotateY(m, m, (2 * Math.PI) / 4)
            if (joint.pre === undefined) {
                const a = rgb2gray(1, 0, 0)
                drawArrow(m, [a, a, a])
            } else {
                drawArrow(m, [1, 0, 0])
            }
            mat4.rotateY(m, m, (2 * Math.PI) / 4)
            if (joint.pre === undefined) {
                const a = rgb2gray(0, 1, 0)
                drawArrow(m, [a, a, a])
            } else {
                drawArrow(m, [0, 1, 0])
            }
            mat4.rotateX(m, m, (-2 * Math.PI) / 4)
            if (joint.post === undefined) {
                const a = rgb2gray(0, 0, 1)
                drawArrow(m, [a, a, a])
            } else {
                drawArrow(m, [0, 0, 1])
            }

            const m0 = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix)
            mat4.multiply(m0, m0, m)
            const point = vec4.fromValues(0, 0, 0, 1) // this is the front top right corner
            const clipspace = vec4.transformMat4(point, point, m0)
            clipspace[0] /= clipspace[3]
            clipspace[1] /= clipspace[3]
            const pixelX = (clipspace[0] * 0.5 + 0.5) * gl.canvas.width
            const pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height

            // console.log(`${name} ${pixelX}, ${pixelY}`)
            // console.log(`${name} ${point[0]}, ${point[1]}`)

            let label: HTMLElement
            if (overlay.children.length === 0) {
                label = span(text(chordataName))
                label.style.position = "absolute"
                label.style.color = "#fff"
                overlayChildren.push(label)
            } else {
                label = overlay.children[idx++] as HTMLElement
            }
            label.style.left = `${pixelX}px`
            label.style.top = `${pixelY}px`
        }

        drawAxis(0, 2, "base")
        drawAxis(0, 4, "dorsal")
        drawAxis(0, 6, "neck")

        drawAxis(-3, 4, "r-upperarm")
        drawAxis(-3, 2, "r-lowerarm")
        drawAxis(-3, 0, "r-hand")
        drawAxis(3, 4, "l-upperarm")
        drawAxis(3, 2, "l-lowerarm")
        drawAxis(3, 0, "l-hand")

        drawAxis(-1.5, -2, "r-upperleg")
        drawAxis(-1.5, -4, "r-lowerleg")
        drawAxis(-1.5, -6, "r-foot")
        drawAxis(1.5, -2, "l-upperleg")
        drawAxis(1.5, -4, "l-lowerleg")
        drawAxis(1.5, -6, "l-foot")

        if (overlay.children.length === 0) {
            overlay.replaceChildren(...overlayChildren)
        }

        // console.log(index)

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
}
