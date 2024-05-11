import { Application } from "Application"
import { GLView, Projection, RenderHandler } from "GLView"
import { WavefrontObj } from "mesh/WavefrontObj"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport
} from "render/util"
import { RenderMesh } from "render/RenderMesh"
import { Frontend_impl } from "./Frontend_impl"
import { Target } from "target/Target"
import { isZero } from "mesh/HumanMesh"

const blendshapeNames = [
    "_neutral", // 0
    "browDownLeft", // 1
    "browDownRight", // 2
    "browInnerUp", // 3
    "browOuterUpLeft", // 4
    "browOuterUpRight", // 5
    "cheekPuff", // 6
    "cheekSquintLeft", // 7
    "cheekSquintRight", // 8
    "eyeBlinkLeft", // 9
    "eyeBlinkRight", // 10
    "eyeLookDownLeft", // 11
    "eyeLookDownRight", // 12
    "eyeLookInLeft", // 13
    "eyeLookInRight", // 14
    "eyeLookOutLeft", // 15
    "eyeLookOutRight", // 16
    "eyeLookUpLeft", // 17
    "eyeLookUpRight", // 18
    "eyeSquintLeft", // 19
    "eyeSquintRight", // 20
    "eyeWideLeft", // 21
    "eyeWideRight", // 22
    "jawForward", // 23
    "jawLeft", // 24
    "jawOpen", // 25
    "jawRight", // 26
    "mouthClose", // 27
    "mouthDimpleLeft", // 28
    "mouthDimpleRight", // 29
    "mouthFrownLeft", // 30
    "mouthFrownRight", // 31
    "mouthFunnel", // 32
    "mouthLeft", // 33
    "mouthLowerDownLeft", // 34
    "mouthLowerDownRight", // 35
    "mouthPressLeft", // 36
    "mouthPressRight", // 37
    "mouthPucker", // 38
    "mouthRight", // 39
    "mouthRollLower", // 40
    "mouthRollUpper", // 41
    "mouthShrugLower", // 42
    "mouthShrugUpper", // 43
    "mouthSmileLeft", // 44
    "mouthSmileRight", // 45
    "mouthStretchLeft", // 46
    "mouthStretchRight", // 47
    "mouthUpperUpLeft", // 48
    "mouthUpperUpRight", // 49
    "noseSneerLeft", // 50
    "noseSneerRight", // 51
]

/**
 * Render MediaPipe's 3d face landmarks
 */
export class FaceARKitRenderer extends RenderHandler {
    mesh!: RenderMesh
    frontend: Frontend_impl
    neutral: WavefrontObj
    targets = new Array<Target>(blendshapeNames.length)

    constructor(frontend: Frontend_impl) {
        super()
        this.frontend = frontend

        const scale = 80
        this.neutral = new WavefrontObj("data/blendshapes/arkit/Neutral.obj")
        for (let i = 0; i < this.neutral.vertex.length; ++i) {
            this.neutral.vertex[i] = this.neutral.vertex[i] * scale
        }
        for (let blendshape = 0; blendshape < blendshapeNames.length; ++blendshape) {
            if (blendshape === 0) {
                continue
            }
            const name = blendshapeNames[blendshape]
            const dst = new WavefrontObj(`data/blendshapes/arkit/${name}.obj`)
            for (let i = 0; i < this.neutral.vertex.length; ++i) {
                dst.vertex[i] = dst.vertex[i] * scale
            }
            const target = new Target()
            target.diff(this.neutral.vertex, dst.vertex)
            this.targets[blendshape] = target
        }
    }

    override paint(app: Application, view: GLView): void {
        const gl = view.gl
        const ctx = view.ctx
        const programRGBA = view.programRGBA

        const vertex = new Float32Array(this.neutral.vertex.length)
        vertex.set(this.neutral!.vertex)
        for(let blendshape=0; blendshape<blendshapeNames.length; ++blendshape) {
            if (blendshape === 0) {
                continue
            }
            const weight = this.frontend.getBlendshapeWeight(blendshapeNames[blendshape])
            if (isZero(weight)) {
                continue
            }
            this.targets[blendshape].apply(vertex, weight)
        }
        if (this.mesh) {
            this.mesh.update(vertex)
        } else {
            this.mesh = new RenderMesh(gl, vertex, this.neutral.fxyz, undefined, undefined, false)
        }

        const canvas = app.glview.canvas as HTMLCanvasElement
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)
        const projectionMatrix = createProjectionMatrix(canvas, ctx.projection === Projection.PERSPECTIVE)
        const modelViewMatrix = createModelViewMatrix(ctx.rotateX, ctx.rotateY)
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
        gl.depthMask(true)
        gl.disable(gl.BLEND)

        programRGBA.setColor([1, 0.8, 0.7, 1])
        this.mesh.bind(programRGBA)
        gl.drawElements(gl.TRIANGLES, this.neutral.fxyz.length, gl.UNSIGNED_SHORT, 0)
    }
}
