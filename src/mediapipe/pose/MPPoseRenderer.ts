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
import { BlazePoseConverter } from "./BlazePoseConverter"
import { BlazePoseLandmarks } from "./BlazePoseLandmarks"
import { Blaze } from "./Blaze"
import { ArrowMesh } from "mediapipe/ArrowMesh"
import { simulatedModel } from "./PoseTab"
import { deg2rad, rad2deg } from "lib/calculateNormals"
import { html } from "toad.js"
import { ColorShader } from "render/shader/ColorShader"

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

        const programRGBA = view.programRGBA
        const programColor = view.programColor

        const projectionMatrix = createProjectionMatrix(canvas)
        const modelViewMatrix = mat4.create()
        // const modelViewMatrix = createModelViewMatrix(view.ctx.rotateX, view.ctx.rotateY)

        const landmarks = simulatedModel.simulatedOnOff.value ? simulatedModel.pose.data : app.frontend._poseLandmarks
        this.bpl.data = landmarks!!

        const v = this.bpl.getVec(Blaze.LEFT_HIP)
        // vec3.scale(v, v, -1)
        vec3.add(v, v, [0, 5, -10])
        // const v = vec3.fromValues(0, 0, -15)

        mat4.translate(modelViewMatrix, modelViewMatrix, v) // obj file face centered
        const normalMatrix = createNormalMatrix(modelViewMatrix)

        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        if (this.mesh0 === undefined) {
            this.mesh0 = new RenderMesh(gl, landmarks, this.line0, undefined, undefined, false)
        } else {
            this.mesh0.update(landmarks)
        }

        // programColor.init(projectionMatrix, modelViewMatrix, normalMatrix)
        // this.arrowMesh.draw(view.programColor)
        // return

        // const programColor = new ColorShader(gl)
        // programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        //
        // draw blaze skeleton
        //
        programRGBA.setColor([1, 1, 1, 1])
        this.mesh0.bind(programRGBA)
        gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)

        //
        // to skeleton
        //

        this.bpl.data = landmarks!!
        const shoulderLeft = this.bpl.getVec(Blaze.LEFT_SHOULDER)
        const shoulderRight = this.bpl.getVec(Blaze.RIGHT_SHOULDER)
        const hipLeft = this.bpl.getVec(Blaze.LEFT_HIP)
        const hipRight = this.bpl.getVec(Blaze.RIGHT_HIP)
        const kneeLeft = this.bpl.getVec(Blaze.LEFT_KNEE)
        const kneeRight = this.bpl.getVec(Blaze.RIGHT_KNEE)

        programColor.init(projectionMatrix, modelViewMatrix, normalMatrix)

        // HIP
        const hipMatrix = this.bpc.getHipWithAdjustment(this.bpl)
        programColor.setModelViewMatrix(mat4.mul(mat4.create(), modelViewMatrix, hipMatrix))
        this.arrowMesh.draw(view.programColor)

        // CENTER OF SHOULDER
        const middleOfShoulder = vec3.add(vec3.create(), shoulderLeft, shoulderRight)
        vec3.scale(middleOfShoulder, middleOfShoulder, 0.5)
        const middleOfShoulderMat = mat4.fromTranslation(mat4.create(), middleOfShoulder)

        // SHOULDER
        const shoulderMatrix = this.bpc.getShoulder(this.bpl)
        mat4.mul(shoulderMatrix, middleOfShoulderMat, shoulderMatrix)
        programColor.setModelViewMatrix(mat4.mul(mat4.create(), modelViewMatrix, shoulderMatrix))
        this.arrowMesh.draw(view.programColor)

        // LEFT UPPER LEG
        const leftUpperLegGlobal = this.bpc.getLeftUpperLegWithAdjustment(this.bpl)
        const leftUpperLeg = mat4.mul(mat4.create(), mat4.fromTranslation(mat4.create(), hipLeft), leftUpperLegGlobal)

        programColor.setModelViewMatrix(mat4.mul(mat4.create(), modelViewMatrix, leftUpperLeg))
        this.arrowMesh.draw(view.programColor)

        // LEFT LOWER LEG
        const leftLowerLegGlobal = this.bpc.getLeftLowerLeg(this.bpl)
        const leftLowerLeg = mat4.mul(mat4.create(), mat4.fromTranslation(mat4.create(), kneeLeft), leftLowerLegGlobal)

        programColor.setModelViewMatrix(mat4.mul(mat4.create(), modelViewMatrix, leftLowerLeg))
        this.arrowMesh.draw(view.programColor)

        // DRAW SIDE VIEW

        // const inv2 = mat4.invert(mat4.create(), hipMatrix)
        // const rot = mat4.fromYRotation(mat4.create(), deg2rad(90))
        // mat4.mul(inv2, rot, inv2)

        const inv2 = mat4.invert(mat4.create(), leftUpperLegGlobal)
        // const rotX = mat4.fromXRotation(mat4.create(), deg2rad(90))
        // mat4.mul(inv2, rotX, inv2)

        const vertices = new Float32Array(landmarks)
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
    }
}
