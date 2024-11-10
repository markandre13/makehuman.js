import { vec3 } from "gl-matrix"
import { GLView } from "render/GLView"
import { RenderMesh } from "render/RenderMesh"
import { Blaze } from "./Blaze"
import { FreeMoCapRenderer } from "./FreeMoCapRenderer"

export function renderReconstructedBlaze(t: FreeMoCapRenderer, view: GLView) {
    // re-create blaze pose skeleton from blaze pose converter
    const programRGBA = view.programRGBA
    const gl = view.gl
    const bpc = t.bpc
    const bpl = t.bpl

    const leftHip = bpl.getVec(Blaze.LEFT_HIP)
    const rightHip = bpl.getVec(Blaze.RIGHT_HIP)
    const lengthHip = vec3.length(vec3.sub(vec3.create(), rightHip, leftHip))

    const hip = bpc.getHip(bpl)
    const shoulder = bpc.getShoulder(bpl)

    const leftHip2 = vec3.fromValues(lengthHip, 0, 0)
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

    const torso = bpc.getSpine(bpl)
    const shoulderCenter2 = vec3.fromValues(0, lengthTorso, 0)
    vec3.transformMat4(shoulderCenter2, shoulderCenter2, torso)

    const leftShoulder2 = vec3.fromValues(lengthShoulder / 2, 0, 0)
    vec3.transformMat4(leftShoulder2, leftShoulder2, shoulder)
    vec3.add(leftShoulder2, leftShoulder2, shoulderCenter2)

    const rightShoulder2 = vec3.fromValues(-lengthShoulder / 2, 0, 0)
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

    const rightElbow = bpl.getVec(Blaze.RIGHT_ELBOW)
    const lengthUpperRightArm = length(rightShoulder, rightElbow)
    const rotRightElbow = bpc.getRightUpperArmWithAdjustment(bpl)
    const rightElbow2 = vec3.fromValues(0, -lengthUpperRightArm, 0)
    vec3.transformMat4(rightElbow2, rightElbow2, rotRightElbow)
    vec3.add(rightElbow2, rightElbow2, rightShoulder2)

    const rightWrist = bpl.getVec(Blaze.RIGHT_WRIST)
    const lengthLowerRightArm = length(rightElbow, rightWrist)
    const rotRightWrist = bpc.getRightLowerArm(bpl)
    const rightWrist2 = vec3.fromValues(0, -lengthLowerRightArm, 0)
    vec3.transformMat4(rightWrist2, rightWrist2, rotRightWrist)
    vec3.add(rightWrist2, rightWrist2, rightElbow2)

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
        ...leftElbow2, ...leftWrist2,
        ...rightShoulder2, ...rightElbow2,
        ...rightElbow2, ...rightWrist2,
    ])

    if (t.mesh1 === undefined) {
        const a = Array.from({ length: data1.length / 3 }, (v, i) => i)
        t.mesh1 = new RenderMesh(gl, data1, a, undefined, undefined, false)
    } else {
        t.mesh1.update(data1)
    }
    programRGBA.useProgram()
    programRGBA.setColor([1, 0.5, 0, 1])
    t.mesh1.bind(programRGBA)
    t.mesh1.draw(programRGBA, gl.LINES)
}
