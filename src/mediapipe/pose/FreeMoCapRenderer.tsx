import { Application } from "Application"
import { mat4, quat2, vec3 } from "gl-matrix"
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
import { renderAxes } from "./renderAxes"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { REST_QUAT } from "UpdateManager"

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
        programRGBA.setColor([0, 0.5, 1, 1])
        this.mesh0.bind(programRGBA)
        this.mesh0.draw(programRGBA, gl.LINES)

        // draw rotations
        programColor.init(projectionMatrix, modelViewMatrix, normalMatrix)
        renderAxes(programColor, this.arrowMesh, modelViewMatrix, this.bpl, this.bpc)

        // re-create blaze pose skeleton from blaze pose converter
        const bpc = this.bpc
        const bpl = this.bpl

        const leftHip = bpl.getVec(Blaze.LEFT_HIP)
        const rightHip = bpl.getVec(Blaze.RIGHT_HIP)
        const lenghtHip = vec3.length(vec3.sub(vec3.create(), rightHip, leftHip))

        const hip = bpc.getHip(bpl)
        const shoulder = bpc.getShoulder(bpl)

        const leftHip2 = vec3.fromValues(lenghtHip, 0, 0)
        vec3.transformMat4(leftHip2, leftHip2, hip)
        vec3.add(leftHip2, leftHip2, rightHip)

        const leftShoulder = bpl.getVec(Blaze.LEFT_SHOULDER)
        const rightShoulder = bpl.getVec(Blaze.RIGHT_SHOULDER)
        const shoulderCenter = vec3.add(vec3.create(), leftShoulder, rightShoulder)
        vec3.scale(shoulderCenter, shoulderCenter, 0.5)

        function length(p0: vec3, p1: vec3) {
            return vec3.length(vec3.sub(vec3.create(), p0, p1))
        }

        const lengthTorso = length(vec3.create(), shoulderCenter)
        const lengthShoulder = length(rightShoulder, leftShoulder)

        // TODO: the following needs to be somehow incooperated into BlazePoseConverter's results
        //       AND to be calculated differently: use the vector from hip to shoulder center
        const q0Torso = quat2.fromMat4(quat2.create(), hip)
        const q1Torso = quat2.fromMat4(quat2.create(), shoulder)
        const torso = mat4.fromQuat2(mat4.create(), quaternion_slerp(q0Torso, q1Torso, 0.5))

        const shoulderCenter2 = vec3.fromValues(0, lengthTorso, 0)
        vec3.transformMat4(shoulderCenter2, shoulderCenter2, torso)

        const leftShoulder2 = vec3.fromValues(lengthShoulder/2, 0, 0)
        vec3.transformMat4(leftShoulder2, leftShoulder2, shoulder)
        vec3.add(leftShoulder2, leftShoulder2, shoulderCenter2)

        const rightShoulder2 = vec3.fromValues(-lengthShoulder/2, 0, 0)
        vec3.transformMat4(rightShoulder2, rightShoulder2, shoulder)
        vec3.add(rightShoulder2, rightShoulder2, shoulderCenter2)

        const leftKnee = bpl.getVec(Blaze.LEFT_KNEE)
        const lengthLeftUpperLeg = length(leftHip, leftKnee)
        const rotLeftKnee = bpc.getLeftUpperLegWithAdjustment(bpl)
        const leftKnee2 = vec3.fromValues(0, -lengthLeftUpperLeg, 0)
        vec3.transformMat4(leftKnee2, leftKnee2, rotLeftKnee)
        vec3.add(leftKnee2, leftKnee2, leftHip2)

        const leftAnkle = bpl.getVec(Blaze.LEFT_ANKLE)
        const lengthLowerLeftLeg = length(leftKnee, leftAnkle)
        const rotLeftAnkle = bpc.getLeftLowerLeg(bpl)
        const leftAnkle2 = vec3.fromValues(0, -lengthLowerLeftLeg, 0)
        vec3.transformMat4(leftAnkle2, leftAnkle2, rotLeftAnkle)
        vec3.add(leftAnkle2, leftAnkle2, leftKnee2)

        const rightKnee = bpl.getVec(Blaze.RIGHT_KNEE)
        const lengthRightUpperLeg = length(rightHip, rightKnee)
        const rotRightKnee = bpc.getRightUpperLegWithAdjustment(bpl)
        const rightKnee2 = vec3.fromValues(0, -lengthRightUpperLeg, 0)
        vec3.transformMat4(rightKnee2, rightKnee2, rotRightKnee)
        vec3.add(rightKnee2, rightKnee2, rightHip)

        const rightAnkle = bpl.getVec(Blaze.RIGHT_ANKLE)
        const lengthLowerRightLeg = length(rightKnee, rightAnkle)
        const rotRightAnkle = bpc.getRightLowerLeg(bpl)
        const rightAnkle2 = vec3.fromValues(0, -lengthLowerRightLeg, 0)
        vec3.transformMat4(rightAnkle2, rightAnkle2, rotRightAnkle)
        vec3.add(rightAnkle2, rightAnkle2, rightKnee2)

        const leftElbow = bpl.getVec(Blaze.LEFT_ELBOW)
        const lengthUpperLeftArm = length(leftShoulder, leftElbow)
        const rotLeftElbow = bpc.getLeftUpperArmWithAdjustment(bpl)
        const leftElbow2 = vec3.fromValues(0, -lengthUpperLeftArm, 0)
        vec3.transformMat4(leftElbow2, leftElbow2, rotLeftElbow)
        vec3.add(leftElbow2, leftElbow2, leftShoulder2)

        const leftWrist = bpl.getVec(Blaze.LEFT_WRIST)
        const lengthLowerLeftArm = length(leftElbow, leftWrist)
        const rotLeftWrist = bpc.getLeftLowerArm(bpl)
        const leftWrist2 = vec3.fromValues(0, -lengthLowerLeftArm, 0)
        vec3.transformMat4(leftWrist2, leftWrist2, rotLeftWrist)
        vec3.add(leftWrist2, leftWrist2, leftElbow2)

        // prettier-ignore
        const data1 = new Float32Array([
            ...rightHip, ...leftHip2,
            0, 0, 0, ...shoulderCenter2,
            ...rightHip, ...rightShoulder2,
            ...leftHip2, ...leftShoulder2,
            ...rightShoulder2, ...leftShoulder2,
            ...leftHip2, ...leftKnee2,
            ...leftKnee2, ...leftAnkle2,
            ...rightHip, ...rightKnee2,
            ...rightKnee2, ...rightAnkle2,
            ...leftShoulder2, ...leftElbow2,
            ...leftElbow2, ...leftWrist2
        ])

        if (this.mesh1 === undefined) {
            const a = Array.from({length: data1.length / 3}, (v, i) => i)
            this.mesh1 = new RenderMesh(gl, data1, a, undefined, undefined, false)
        } else {
            this.mesh1.update(data1)
        }
        programRGBA.useProgram()
        programRGBA.setColor([1, 0.5, 0, 1])
        this.mesh1.bind(programRGBA)
        this.mesh1.draw(programRGBA, gl.LINES)
    }
}
