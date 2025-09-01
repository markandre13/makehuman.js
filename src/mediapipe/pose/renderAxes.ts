import { mat4, vec3 } from "gl-matrix"
import { ArrowMesh } from "mediapipe/ArrowMesh"
import { BlazePoseConverter } from "./BlazePoseConverter"
import { BlazePoseLandmarks } from "./BlazePoseLandmarks"
import { Blaze } from "./Blaze"
import { ShaderShadedColored } from "gl/shaders/ShaderShadedColored"

let counter = 0

export function renderAxes(
    gl: WebGL2RenderingContext,
    programColor: ShaderShadedColored,
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
    const hip = bpc.getHipWithAdjustment(bpl)
    mat4.mul(m, m, hip)
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // SHOULDER
    const shoulderCenter = vec3.add(vec3.create(), leftShoulder, rightShoulder)
    vec3.scale(shoulderCenter, shoulderCenter, 0.5)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, shoulderCenter)
    mat4.mul(m, m, bpc.getShoulder(bpl))
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // SPINE
    const spineCenter = vec3.add(vec3.create(), hipCenter, shoulderCenter)
    vec3.scale(spineCenter, spineCenter, 0.5)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, spineCenter)
    mat4.mul(m, m, bpc.getSpine(bpl))
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // HEAD
    const leftEar = bpl.getVec(Blaze.LEFT_EAR)
    const rightEar = bpl.getVec(Blaze.RIGHT_EAR)
    const headCenter = vec3.add(vec3.create(), leftEar, rightEar)
    vec3.scale(headCenter, headCenter, 0.5)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, headCenter)
    mat4.mul(m, m, bpc.getHead(bpl))
    programColor.setModelView(gl, m)
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
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // LEFT LOWER ARM
    const leftLowerArmCenter = vec3.create()
    vec3.sub(leftLowerArmCenter, leftWrist, leftElbow)
    vec3.scale(leftLowerArmCenter, leftLowerArmCenter, 0.5)
    vec3.add(leftLowerArmCenter, leftLowerArmCenter, leftElbow)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, leftLowerArmCenter)
    mat4.mul(m, m, bpc.getLeftLowerArm(bpl))
    programColor.setModelView(gl, m)
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
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // RIGHT UPPER ARM
    const rightElbow = bpl.getVec(Blaze.RIGHT_ELBOW)
    const rightWrist = bpl.getVec(Blaze.RIGHT_WRIST)

    const rightUpperArmCenter = vec3.create()
    vec3.sub(rightUpperArmCenter, rightElbow, rightShoulder)
    vec3.scale(rightUpperArmCenter, rightUpperArmCenter, 0.5)
    vec3.add(rightUpperArmCenter, rightUpperArmCenter, rightShoulder)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, rightUpperArmCenter)
    mat4.mul(m, m, bpc.getRightUpperArmWithAdjustment(bpl))
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // RIGHT LOWER ARM
    const rightLowerArmCenter = vec3.create()
    vec3.sub(rightLowerArmCenter, rightWrist, rightElbow)
    vec3.scale(rightLowerArmCenter, rightLowerArmCenter, 0.5)
    vec3.add(rightLowerArmCenter, rightLowerArmCenter, rightElbow)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, rightLowerArmCenter)
    mat4.mul(m, m, bpc.getRightLowerArm(bpl))
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // RIGHT HAND
    const rightPinky = bpl.getVec(Blaze.RIGHT_PINKY)
    const rightIndex = bpl.getVec(Blaze.RIGHT_INDEX)
    const rightHandCenter = vec3.create()
    vec3.sub(leftHandCenter, rightPinky, rightIndex)
    vec3.scale(rightHandCenter, rightHandCenter, 0.5)
    vec3.add(rightHandCenter, rightHandCenter, rightIndex)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, rightHandCenter) // thumb
    mat4.mul(m, m, bpc.getRightHand(bpl))
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // LEFT UPPER LEG
    const leftUpperLegCenter = vec3.create()
    vec3.sub(leftUpperLegCenter, leftKnee, leftHip)
    vec3.scale(leftUpperLegCenter, leftUpperLegCenter, 0.5)
    vec3.add(leftUpperLegCenter, leftUpperLegCenter, leftHip)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, leftUpperLegCenter)
    mat4.mul(m, m, bpc.getLeftUpperLegWithAdjustment(bpl))
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // LEFT LOWER LEG
    const leftLowerLegCenter = vec3.create()
    vec3.sub(leftLowerLegCenter, leftAnkle, leftKnee)
    vec3.scale(leftLowerLegCenter, leftLowerLegCenter, 0.5)
    vec3.add(leftLowerLegCenter, leftLowerLegCenter, leftKnee)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, leftLowerLegCenter)
    mat4.mul(m, m, bpc.getLeftLowerLeg(bpl))
    programColor.setModelView(gl, m)
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
    programColor.setModelView(gl, m)
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
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)

    // RIGHT LOWER LEG
    const rightLowerLegCenter = vec3.create()
    vec3.sub(rightLowerLegCenter, rightAnkle, rightKnee)
    vec3.scale(rightLowerLegCenter, rightLowerLegCenter, 0.5)
    vec3.add(rightLowerLegCenter, rightLowerLegCenter, rightKnee)

    mat4.identity(m)
    mat4.translate(m, modelViewMatrix, rightLowerLegCenter)
    mat4.mul(m, m, bpc.getRightLowerLeg(bpl))
    programColor.setModelView(gl, m)
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
    programColor.setModelView(gl, m)
    arrowMesh.draw(programColor)
}
