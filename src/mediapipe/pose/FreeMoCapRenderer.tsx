import { Application } from "Application"
import { mat4, vec3 } from "gl-matrix"
import { ArrowMesh } from "mediapipe/ArrowMesh"
import { RenderHandler, GLView } from "render/GLView"
import { RenderMesh } from "render/RenderMesh"
import { Blaze, BlazePoseConverter, BlazePoseLandmarks } from "./BlazePoseConverter"
import {
    createModelViewMatrix,
    createNormalMatrix,
    createProjectionMatrix,
    prepareCanvas,
    prepareViewport,
} from "render/util"
import { deg2rad, rad2deg } from "lib/calculateNormals"
import { euler_from_matrix } from "lib/euler_matrix"

let a = 0

export class FreeMoCapRenderer extends RenderHandler {
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
        if (view.overlay.children.length !== 0) {
            view.overlay.replaceChildren()
        }

        if (app.frontend._poseLandmarks === undefined) {
            return
        }

        if (this.arrowMesh === undefined) {
            this.arrowMesh = new ArrowMesh(view.gl, 1)
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
        const modelViewMatrix = createModelViewMatrix(view.ctx.rotateX, view.ctx.rotateY)
        const normalMatrix = createNormalMatrix(modelViewMatrix)
        programRGBA.init(projectionMatrix, modelViewMatrix, normalMatrix)

        // adjust freemocap data to opengl screen space
        const landmarks = app.frontend._poseLandmarks
        const data = new Float32Array(landmarks)

        // move blaze skeleton to origin to ease debugging
        if (true) {
            this.bpl.data = landmarks
            const root = vec3.add(vec3.create(), this.bpl.getVec(Blaze.LEFT_HIP), this.bpl.getVec(Blaze.RIGHT_HIP))
            vec3.scale(root, root, 0.5)
            for (let i = 0; i < data.length; i += 3) {
                data[i] -= root[0]
                data[i + 1] -= root[1]
                data[i + 2] -= root[2]
            }
        }
        this.bpl.data = data

        if (this.mesh0 === undefined) {
            this.mesh0 = new RenderMesh(gl, data, this.line0, undefined, undefined, false)
        } else {
            this.mesh0.update(data)
        }

        // draw blaze
        programRGBA.setColor([1, 1, 1, 1])
        this.mesh0.bind(programRGBA)
        gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)

        /*
        // draw blaze model from which we calculate additional rotations
        // THERE'S JUMP FROM 160 to 161... looks like when upper & lower leg are almost in a straight line
        programRGBA.setColor([1, 0.5, 0, 1])
        const pose2 = this.bpl.clone()

        let leftUpperLeg = this.bpc.getLeftUpperLeg(this.bpl)
        const inv = mat4.create()
        mat4.invert(inv, leftUpperLeg)

        const t = mat4.create()
        // mat4.rotateX(t, t, deg2rad(-90))
        mat4.mul(t, t, inv)
        pose2.mul(t)

        this.mesh0.bind(programRGBA)
        this.mesh0.update(pose2.data)
        gl.drawElements(gl.LINES, this.line0.length, gl.UNSIGNED_SHORT, 0)
*/
        // draw rotations
        this.bpl.data = data
        const leftShoulder = this.bpl.getVec(Blaze.LEFT_SHOULDER)
        const rightShoulder = this.bpl.getVec(Blaze.RIGHT_SHOULDER)
        const leftHip = this.bpl.getVec(Blaze.LEFT_HIP)
        const rightHip = this.bpl.getVec(Blaze.RIGHT_HIP)
        const leftKnee = this.bpl.getVec(Blaze.LEFT_KNEE)
        const rightKnee = this.bpl.getVec(Blaze.RIGHT_KNEE)
        const leftAnkle = this.bpl.getVec(Blaze.LEFT_ANKLE)
        const rightAnkle = this.bpl.getVec(Blaze.RIGHT_ANKLE)

        programColor.init(projectionMatrix, modelViewMatrix, normalMatrix)

        // HIP
        const hipCenter = vec3.add(vec3.create(), leftHip, rightHip)
        vec3.scale(hipCenter, hipCenter, 0.5)

        const m = mat4.create()
        mat4.translate(m, modelViewMatrix, hipCenter)
        const hip = this.bpc.getHip(this.bpl)
        mat4.mul(m, m, hip)
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        const debug = document.getElementById("debug1")
        if (debug != null) {
            const d = vec3.sub(vec3.create(), rightHip, leftHip)
            const e = euler_from_matrix(hip)
            debug.innerHTML = `
                vec  : ${d[0].toFixed(4)}, ${d[1].toFixed(4)}, ${d[2].toFixed(4)}<br/>
                euler: ${rad2deg(e.x).toFixed(4)}, ${rad2deg(e.y).toFixed(4)}, ${rad2deg(e.z).toFixed(4)}`
        }

        // SHOULDER
        const shoulderCenter = vec3.add(vec3.create(), leftShoulder, rightShoulder)
        vec3.scale(shoulderCenter, shoulderCenter, 0.5)

        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, shoulderCenter)
        mat4.mul(m, m, this.bpc.getShoulder(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // HEAD
        const leftEar = this.bpl.getVec(Blaze.LEFT_EAR)
        const rightEar = this.bpl.getVec(Blaze.RIGHT_EAR)
        const headCenter = vec3.add(vec3.create(), leftEar, rightEar)
        vec3.scale(headCenter, headCenter, 0.5)

        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, headCenter)
        mat4.mul(m, m, this.bpc.getHead(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // LEFT UPPER LEG
        const leftUpperLegCenter = vec3.create()
        vec3.sub(leftUpperLegCenter, leftKnee, leftHip)
        vec3.scale(leftUpperLegCenter, leftUpperLegCenter, 0.5)
        vec3.add(leftUpperLegCenter, leftUpperLegCenter, leftHip)

        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, leftUpperLegCenter)
        mat4.mul(m, m, this.bpc.getLeftUpperLegWithAdjustment(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // LEFT LOWER LEG
        const leftLowerLegCenter = vec3.create()
        vec3.sub(leftLowerLegCenter, leftAnkle, leftKnee)
        vec3.scale(leftLowerLegCenter, leftLowerLegCenter, 0.5)
        vec3.add(leftLowerLegCenter, leftLowerLegCenter, leftKnee)

        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, leftLowerLegCenter)
        mat4.mul(m, m, this.bpc.getLeftLowerLeg(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // LEFT FOOT
        const leftHeel = this.bpl.getVec(Blaze.LEFT_HEEL)
        const leftFootIndex = this.bpl.getVec(Blaze.LEFT_FOOT_INDEX)
        const leftFootCenter = vec3.create()
        vec3.sub(leftFootCenter, leftFootIndex, leftHeel)
        vec3.scale(leftFootCenter, leftFootCenter, 0.1)
        vec3.add(leftFootCenter, leftFootCenter, leftHeel)

        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, leftFootCenter)
        mat4.mul(m, m, this.bpc.getLeftFoot(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // RIGHT UPPER LEG
        const rightUpperLegCenter = vec3.create()
        vec3.sub(rightUpperLegCenter, rightKnee, rightHip)
        vec3.scale(rightUpperLegCenter, rightUpperLegCenter, 0.5)
        vec3.add(rightUpperLegCenter, rightUpperLegCenter, rightHip)

        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, rightUpperLegCenter)
        mat4.mul(m, m, this.bpc.getRightUpperLegWithAdjustment(this.bpl))
        // mat4.mul(m, m, this.bpc.getRightUpperLegWithAdjustment(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // RIGHT LOWER LEG
        const rightLowerLegCenter = vec3.create()
        vec3.sub(rightLowerLegCenter, rightAnkle, rightKnee)
        vec3.scale(rightLowerLegCenter, rightLowerLegCenter, 0.5)
        vec3.add(rightLowerLegCenter, rightLowerLegCenter, rightKnee)

        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, rightLowerLegCenter)
        mat4.mul(m, m, this.bpc.getRightLowerLeg(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor)

        // LEFT FOOT
        const rightHeel = this.bpl.getVec(Blaze.RIGHT_HEEL)
        const rightFootIndex = this.bpl.getVec(Blaze.RIGHT_FOOT_INDEX)
        const rightFootCenter = vec3.create()
        vec3.sub(rightFootCenter, rightFootIndex, rightHeel)
        vec3.scale(rightFootCenter, rightFootCenter, 0.1)
        vec3.add(rightFootCenter, rightFootCenter, rightHeel)

        mat4.identity(m)
        mat4.translate(m, modelViewMatrix, rightFootCenter)
        mat4.mul(m, m, this.bpc.getRightFoot(this.bpl))
        programColor.setModelViewMatrix(m)
        this.arrowMesh.draw(view.programColor) 
    }
}
