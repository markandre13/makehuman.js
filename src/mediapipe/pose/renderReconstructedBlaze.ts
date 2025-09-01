import { vec3 } from "gl-matrix"
import { RenderMesh } from "render/RenderMesh"
import { Blaze } from "./Blaze"
import { FreeMoCapRenderer } from "./FreeMoCapRenderer"
import { RenderView } from "render/glview/RenderView"

/**
 * re-create blaze pose skeleton from blaze pose converter
 * 
 * @param t 
 * @param view 
 */
export function renderReconstructedBlaze(t: FreeMoCapRenderer, view: RenderView) {
    const programRGBA = view.programRGBA
    const gl = view.gl
    const bpc = t.bpc
    const bpl = t.bpl

    const centerHip = bpc.getHipCenter(bpl)

    const leftHipX = bpl.getVec(Blaze.LEFT_HIP)
    const rightHipX = bpl.getVec(Blaze.RIGHT_HIP)
    const lengthHip = vec3.length(vec3.sub(vec3.create(), rightHipX, leftHipX))

    const hip = bpc.getHipWithAdjustment(bpl)
    const shoulder = bpc.getShoulder(bpl)

    const leftHip2 = vec3.fromValues(lengthHip/2, 0, 0)
    vec3.transformMat4(leftHip2, leftHip2, hip)
    vec3.add(leftHip2, leftHip2, centerHip)

    const rightHip2 = vec3.fromValues(-lengthHip/2, 0, 0)
    vec3.transformMat4(rightHip2, rightHip2, hip)
    vec3.add(rightHip2, rightHip2, centerHip)

    const leftShoulderX = bpl.getVec(Blaze.LEFT_SHOULDER)
    const rightShoulderX = bpl.getVec(Blaze.RIGHT_SHOULDER)
    const centerShoulderX = vec3.add(vec3.create(), leftShoulderX, rightShoulderX)
    vec3.scale(centerShoulderX, centerShoulderX, 0.5)

    const lengthTorso = length(centerHip, centerShoulderX)
    const lengthShoulder = length(rightShoulderX, leftShoulderX)

    const torso = bpc.getSpine(bpl)
    const shoulderCenter2 = vec3.fromValues(0, lengthTorso, 0)
    vec3.transformMat4(shoulderCenter2, shoulderCenter2, torso)
    vec3.add(shoulderCenter2, shoulderCenter2, centerHip)

    const leftShoulder2 = vec3.fromValues(lengthShoulder / 2, 0, 0)
    vec3.transformMat4(leftShoulder2, leftShoulder2, shoulder)
    vec3.add(leftShoulder2, leftShoulder2, shoulderCenter2)

    const rightShoulder2 = vec3.fromValues(-lengthShoulder / 2, 0, 0)
    vec3.transformMat4(rightShoulder2, rightShoulder2, shoulder)
    vec3.add(rightShoulder2, rightShoulder2, shoulderCenter2)

    const leftKnee = bpl.getVec(Blaze.LEFT_KNEE)
    const lengthLeftUpperLeg = length(leftHipX, leftKnee)
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
    const lengthRightUpperLeg = length(rightHipX, rightKnee)
    const rotRightKnee = bpc.getRightUpperLegWithAdjustment(bpl)
    const rightKnee2 = vec3.fromValues(0, -lengthRightUpperLeg, 0)
    vec3.transformMat4(rightKnee2, rightKnee2, rotRightKnee)
    vec3.add(rightKnee2, rightKnee2, rightHip2)

    const rightAnkle = bpl.getVec(Blaze.RIGHT_ANKLE)
    const lengthLowerRightLeg = length(rightKnee, rightAnkle)
    const rotRightAnkle = bpc.getRightLowerLeg(bpl)
    const rightAnkle2 = vec3.fromValues(0, -lengthLowerRightLeg, 0)
    vec3.transformMat4(rightAnkle2, rightAnkle2, rotRightAnkle)
    vec3.add(rightAnkle2, rightAnkle2, rightKnee2)

    const leftElbow = bpl.getVec(Blaze.LEFT_ELBOW)
    const lengthUpperLeftArm = length(leftShoulderX, leftElbow)
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
    const lengthUpperRightArm = length(rightShoulderX, rightElbow)
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
        ...rightHip2, ...leftHip2,
        ...centerHip, ...shoulderCenter2,
        ...rightHip2, ...rightShoulder2,
        ...leftHip2, ...leftShoulder2,
        ...rightShoulder2, ...leftShoulder2,
        ...leftHip2, ...leftKnee2,
        ...leftKnee2, ...leftAnkle2,
        ...rightHip2, ...rightKnee2,
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
    programRGBA.use(gl)
    programRGBA.setColor(gl, [1, 0.5, 0, 1])
    t.mesh1.bind(programRGBA)
    t.mesh1.draw(programRGBA, gl.LINES)
}

function length(p0: vec3, p1: vec3) {
    return vec3.length(vec3.sub(vec3.create(), p0, p1))
}
