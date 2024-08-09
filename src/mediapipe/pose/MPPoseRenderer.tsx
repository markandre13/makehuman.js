import { Application } from "Application"
import { mat4, vec3 } from "gl-matrix"
import { RenderHandler, GLView } from "render/GLView"
import { RenderMesh } from "render/RenderMesh"
import { RGBAShader } from "render/shader/RGBAShader"
import {
    prepareCanvas,
    prepareViewport,
    createProjectionMatrix,
    createNormalMatrix,
    createModelViewMatrix,
} from "render/util"
import { Blaze, BlazePoseConverter, BlazePoseLandmarks } from "./BlazePoseConverter"
import { ArrowMesh } from "mediapipe/ArrowMesh"

let a = 0

export class MPPoseRenderer extends RenderHandler {
    mesh0?: RenderMesh

    arrowMesh?: ArrowMesh
    bpl = new BlazePoseLandmarks()
    bpc = new BlazePoseConverter()

    line0 = [
        11, 12, 12, 24, 24, 23, 23, 11, 11, 13, 13, 15, 12, 14, 14, 16, 24, 26, 26, 28, 23, 25, 25, 27,

        20, 18, 18, 16, 16, 20, 15, 19, 19, 17, 17, 15,

        28, 30, 30, 32, 32, 28, 27, 31, 31, 29, 29, 27,

        8, 7, 7, 0, 0, 8,
    ]

    override paint(app: Application, view: GLView): void {
        if (this.arrowMesh === undefined) {
            this.arrowMesh = new ArrowMesh(view.gl, 0.1)
        }

        a = a + 0.1
        if (app.frontend._poseLandmarks === undefined) {
            return
        }

        const canvas = view.canvas as HTMLCanvasElement
        const gl = view.gl
        prepareCanvas(canvas)
        prepareViewport(gl, canvas)

        gl.disable(gl.CULL_FACE)
        gl.depthMask(true)

        const programRGBA = new RGBAShader(gl)

        const projectionMatrix = createProjectionMatrix(canvas)
        const modelViewMatrix = mat4.create()
        // const modelViewMatrix = createModelViewMatrix(view.ctx.rotateX, view.ctx.rotateY)

        mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0, -3]) // obj file face centered
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        if (this.mesh0 === undefined) {
            this.mesh0 = new RenderMesh(gl, app.frontend._poseLandmarks, this.line0, undefined, undefined, false)
        } else {
            this.mesh0.update(app.frontend._poseLandmarks)
        }

        programRGBA.setColor([1.0, 1.0, 1.0, 1])
        this.mesh0.bind(programRGBA)
        gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)

        //
        // to skeleton
        //

        const debug = document.getElementById("debug")

        this.bpl.data = app.frontend._poseLandmarks!!

        // gl.enable(gl.CULL_FACE)
        // gl.cullFace(gl.BACK)
        // gl.depthMask(true)
        // gl.disable(gl.BLEND)

        const colorShader = view.programColor
        colorShader.init(projectionMatrix, modelViewMatrix, normalMatrix)

        // the following tasks are ordered from easy to difficult to learn along the way:
        // [X] root variant 1: just use the HIP to SHOULDER
        // [ ] the legs
        // [ ] the arms
        // [ ] head
        // [ ] foot
        // [ ] hands
        // [ ] root variant 2: combine root with the legs
        //   [ ] find smallest angle between torso and legs
        //   [ ] use related torso & legs to define a median
        // [ ] bend spine at one bone
        // [ ] bend spine at all spine bones
        const rootPoseGlobal = this.bpc.getRoot(this.bpl)

        colorShader.setModelViewMatrix(mat4.mul(mat4.create(), modelViewMatrix, rootPoseGlobal))
        this.arrowMesh.draw(view.programColor)

        // draw side view
        /*
        const inv2 = mat4.fromYRotation(mat4.create(), rootY + Math.PI / 2)
        const vertices = new Float32Array(app.frontend._poseLandmarks!!)
        this.bpl.data = vertices
        for (let i = 0; i < 33; ++i) {
            const v = this.bpl.getVec(i)
            vec3.transformMat4(v, v, inv2)
            this.bpl.setVec(i, v)
        }

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)
        programRGBA.setColor([1.0, 0.0, 0.0, 1])
        this.mesh0.bind(programRGBA)
        this.mesh0.update(vertices)
        gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)
        */
    }
}
