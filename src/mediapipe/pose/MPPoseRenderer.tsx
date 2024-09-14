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
import { simulatedModel } from "./PoseTab"
import { deg2rad, rad2deg } from "lib/calculateNormals"
import { html } from "toad.js"

let a = 0

let flag = true

export class MPPoseRenderer extends RenderHandler {
    mesh0?: RenderMesh
    mesh1?: RenderMesh

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

        const landmarks = simulatedModel.simulatedOnOff.value ? simulatedModel.pose.data : app.frontend._poseLandmarks

        if (this.mesh0 === undefined) {
            this.mesh0 = new RenderMesh(gl, landmarks, this.line0, undefined, undefined, false)
        } else {
            this.mesh0.update(landmarks)
        }

        // draw blaze skeleton
        programRGBA.setColor([1, 1, 1, 1])
        this.mesh0.bind(programRGBA)
        gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)

        const rootPoseGlobal = this.bpc.getRoot(this.bpl)

        // get the normalized pose
        const pose2 = new BlazePoseLandmarks(landmarks.slice())
        const inv = mat4.create()
        mat4.invert(inv, rootPoseGlobal)
        pose2.mul(inv)
        if (this.mesh1 === undefined) {
            this.mesh1 = new RenderMesh(gl, pose2.data, this.line0, undefined, undefined, false)
        } else {
            this.mesh1.update(pose2.data)
        }
        programRGBA.setColor([1, 0, 0, 1])
        this.mesh1.bind(programRGBA)
        gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)

        const id = document.getElementById("debug")
        if (id) {
            const kneeLeft = pose2.getVec(Blaze.LEFT_KNEE)
            const kneeRight = pose2.getVec(Blaze.RIGHT_KNEE)
            const left = rad2deg(Math.atan2(kneeLeft[1], kneeLeft[0]) + Math.PI / 2)
            const right = rad2deg(Math.atan2(kneeRight[1], kneeRight[0]) + Math.PI / 2)
            ++a
            id.innerHTML = html`
            ${a}<br/>
            ${kneeLeft[0].toFixed(4)}, ${kneeLeft[1].toFixed(4)}, ${kneeLeft[2].toFixed(4)}: ${left.toFixed(1)}<br />
            ${kneeRight[0].toFixed(4)}, ${kneeRight[1].toFixed(4)}, ${kneeRight[2].toFixed(4)}: ${right.toFixed(1)}`
        }

        // now use the normalized pose to...

        //
        // to skeleton
        //

        const debug = document.getElementById("debug")

        this.bpl.data = landmarks!!

        const colorShader = view.programColor
        colorShader.init(projectionMatrix, modelViewMatrix, normalMatrix)

        colorShader.setModelViewMatrix(mat4.mul(mat4.create(), modelViewMatrix, rootPoseGlobal))
        this.arrowMesh.draw(view.programColor)

        if (flag) {
            flag = false
            console.log(`DEBUG LEFT  HIP      ${this.bpl.getVec(Blaze.LEFT_HIP)}`)
            console.log(`DEBUG RIGHT HIP      ${this.bpl.getVec(Blaze.RIGHT_HIP)}`)
            console.log(`DEBUG LEFT  SHOULDER ${this.bpl.getVec(Blaze.LEFT_SHOULDER)}`)
            console.log(`DEBUG RIGHT SHOULDER ${this.bpl.getVec(Blaze.RIGHT_SHOULDER)}`)
            console.log(`DEBUG LEFT  KNEE     ${this.bpl.getVec(Blaze.LEFT_KNEE)}`)
            console.log(`DEBUG RIGHT KNEE     ${this.bpl.getVec(Blaze.RIGHT_KNEE)}`)
        }

        // TODO
        // [ ] getRoot() is not complete yet
        //     write test, then TDD the result
        // [ ] neck, arm or leg

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
