import { mat4, vec3 } from "gl-matrix"
import { ArrowMesh } from "mediapipe/ArrowMesh"
import { ColorShader } from "render/shader/ColorShader"
import { BlazePoseLandmarks, BlazePoseConverter, Blaze } from "./BlazePoseConverter"

export function renderAxes(
    programColor: ColorShader,
    arrowMesh: ArrowMesh,
    modelViewMatrix: mat4,
    bpl: BlazePoseLandmarks,
    bpc: BlazePoseConverter) {
    const leftShoulder = bpl.getVec(Blaze.LEFT_SHOULDER)
    const rightShoulder = bpl.getVec(Blaze.RIGHT_SHOULDER)
    const leftHip = bpl.getVec(Blaze.LEFT_HIP)
    const rightHip = bpl.getVec(Blaze.RIGHT_HIP)
    const leftKnee = bpl.getVec(Blaze.LEFT_KNEE)
    const rightKnee = bpl.getVec(Blaze.RIGHT_KNEE)
    const leftAnkle = bpl.getVec(Blaze.LEFT_ANKLE)
    const rightAnkle = bpl.getVec(Blaze.RIGHT_ANKLE)

    // HIP
    const hipCenter = vec3.add(vec3.create(), leftHip, rightHip)
    vec3.scale(hipCenter, hipCenter, 0.5)

    const m = mat4.create()
    mat4.translate(m, modelViewMatrix, hipCenter)
    const hip = bpc.getHip(bpl)
    mat4.mul(m, m, hip)
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // const debug = document.getElementById("debug1")
    // if (debug != null) {
    //     const d = vec3.sub(vec3.create(), rightHip, leftHip)
    //     const e = euler_from_matrix(hip)
    //     debug.innerHTML = `
    //         vec  : ${d[0].toFixed(4)}, ${d[1].toFixed(4)}, ${d[2].toFixed(4)}<br/>
    //         euler: ${rad2deg(e.x).toFixed(4)}, ${rad2deg(e.y).toFixed(4)}, ${rad2deg(e.z).toFixed(4)}`
    // }
    // SHOULDER
    const shoulderCenter = vec3.add(vec3.create(), leftShoulder, rightShoulder)
    vec3.scale(shoulderCenter, shoulderCenter, 0.5)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, shoulderCenter)
    mat4.mul(m, m, bpc.getShoulder(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // HEAD
    const leftEar = bpl.getVec(Blaze.LEFT_EAR)
    const rightEar = bpl.getVec(Blaze.RIGHT_EAR)
    const headCenter = vec3.add(vec3.create(), leftEar, rightEar)
    vec3.scale(headCenter, headCenter, 0.5)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, headCenter)
    mat4.mul(m, m, bpc.getHead(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // LEFT UPPER ARM
    const leftElbow = bpl.getVec(Blaze.LEFT_ELBOW)
    const leftWrist = bpl.getVec(Blaze.LEFT_WRIST)

    const leftUpperArmCenter = vec3.create()
    vec3.sub(leftUpperArmCenter, leftElbow, leftShoulder)
    vec3.scale(leftUpperArmCenter, leftUpperArmCenter, 0.5)
    vec3.add(leftUpperArmCenter, leftUpperArmCenter, leftShoulder)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, leftUpperArmCenter)
    mat4.mul(m, m, bpc.getLeftUpperArmWithAdjustment(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // LEFT LOWER ARM
    const leftLowerArmCenter = vec3.create()
    vec3.sub(leftLowerArmCenter, leftWrist, leftElbow)
    vec3.scale(leftLowerArmCenter, leftLowerArmCenter, 0.5)
    vec3.add(leftLowerArmCenter, leftLowerArmCenter, leftElbow)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, leftLowerArmCenter)
    mat4.mul(m, m, bpc.getLeftLowerArm(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // LEFT HAND
    // const leftWrist = this.bpl.getVec(Blaze.LEFT_HEEL)
    const leftPinky = bpl.getVec(Blaze.LEFT_PINKY)
    const leftIndex = bpl.getVec(Blaze.LEFT_INDEX)
    const leftHandCenter = vec3.create()
    vec3.sub(leftHandCenter, leftPinky, leftIndex)
    vec3.scale(leftHandCenter, leftHandCenter, 0.5)
    vec3.add(leftHandCenter, leftHandCenter, leftIndex)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, leftHandCenter) // thumb
    mat4.mul(m, m, bpc.getLeftHand(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // LEFT UPPER LEG
    const leftUpperLegCenter = vec3.create()
    vec3.sub(leftUpperLegCenter, leftKnee, leftHip)
    vec3.scale(leftUpperLegCenter, leftUpperLegCenter, 0.5)
    vec3.add(leftUpperLegCenter, leftUpperLegCenter, leftHip)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, leftUpperLegCenter)
    mat4.mul(m, m, bpc.getLeftUpperLegWithAdjustment(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // LEFT LOWER LEG
    const leftLowerLegCenter = vec3.create()
    vec3.sub(leftLowerLegCenter, leftAnkle, leftKnee)
    vec3.scale(leftLowerLegCenter, leftLowerLegCenter, 0.5)
    vec3.add(leftLowerLegCenter, leftLowerLegCenter, leftKnee)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, leftLowerLegCenter)
    mat4.mul(m, m, bpc.getLeftLowerLeg(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // LEFT FOOT
    const leftHeel = bpl.getVec(Blaze.LEFT_HEEL)
    const leftFootIndex = bpl.getVec(Blaze.LEFT_FOOT_INDEX)
    const leftFootCenter = vec3.create()
    vec3.sub(leftFootCenter, leftFootIndex, leftHeel)
    vec3.scale(leftFootCenter, leftFootCenter, 0.1)
    vec3.add(leftFootCenter, leftFootCenter, leftHeel)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, leftFootCenter)
    mat4.mul(m, m, bpc.getLeftFoot(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // RIGHT UPPER LEG
    const rightUpperLegCenter = vec3.create()
    vec3.sub(rightUpperLegCenter, rightKnee, rightHip)
    vec3.scale(rightUpperLegCenter, rightUpperLegCenter, 0.5)
    vec3.add(rightUpperLegCenter, rightUpperLegCenter, rightHip)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, rightUpperLegCenter)
    mat4.mul(m, m, bpc.getRightUpperLegWithAdjustment(bpl))
    // mat4.mul(m, m, this.bpc.getRightUpperLegWithAdjustment(this.bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // RIGHT LOWER LEG
    const rightLowerLegCenter = vec3.create()
    vec3.sub(rightLowerLegCenter, rightAnkle, rightKnee)
    vec3.scale(rightLowerLegCenter, rightLowerLegCenter, 0.5)
    vec3.add(rightLowerLegCenter, rightLowerLegCenter, rightKnee)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, rightLowerLegCenter)
    mat4.mul(m, m, bpc.getRightLowerLeg(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)

    // LEFT FOOT
    const rightHeel = bpl.getVec(Blaze.RIGHT_HEEL)
    const rightFootIndex = bpl.getVec(Blaze.RIGHT_FOOT_INDEX)
    const rightFootCenter = vec3.create()
    vec3.sub(rightFootCenter, rightFootIndex, rightHeel)
    vec3.scale(rightFootCenter, rightFootCenter, 0.1)
    vec3.add(rightFootCenter, rightFootCenter, rightHeel)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, rightFootCenter)
    mat4.mul(m, m, bpc.getRightFoot(bpl))
    programColor.setModelViewMatrix(m)
    arrowMesh.draw(programColor)
}
