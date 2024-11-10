import { mat4, vec3 } from "gl-matrix"
import { deg2rad, rad2deg } from "lib/calculateNormals"
import { easeMedianAngle, medianAngle } from "lib/medianAngle"
import { Blaze } from "./Blaze"
import { BlazePoseLandmarks } from "./BlazePoseLandmarks"

function vecFromTo(from: vec3, to: vec3) {
    return vec3.sub(vec3.create(), to, from)
}

// * the technical term is 'retarget' instead of 'convert'
// * https://github.com/freemocap/freemocap_blendarmocap does a similar thing

/**
 * Convert Mediapipe's Pose Landmark Model (BlazePose GHUM 3D) to Makehuman Pose
 */
export class BlazePoseConverter {
    leftLowerLeg?: mat4
    rightLowerLeg?: mat4
    leftLowerArm?: mat4
    rightLowerArm?: mat4

    getHipCenter(pose: BlazePoseLandmarks): vec3 {
        const left = pose.getVec(Blaze.LEFT_HIP)
        const right = pose.getVec(Blaze.RIGHT_HIP)
        const center = vec3.add(vec3.create(), left, right)
        vec3.scale(center, center, 0.5)
        return center
    }

    private getShoulderCenter(pose: BlazePoseLandmarks): vec3 {
        const shoulderLeft = pose.getVec(Blaze.LEFT_SHOULDER)
        const shoulderRight = pose.getVec(Blaze.RIGHT_SHOULDER)
        const center = vec3.add(vec3.create(), shoulderLeft, shoulderRight)
        vec3.scale(center, center, 0.5)
        return center
    }

    getSpine(pose: BlazePoseLandmarks) {
        const hip = this.getHipCenter(pose)
        const shoulder = this.getShoulderCenter(pose)
        const spineDirection = vec3.sub(vec3.create(), shoulder, hip)

        const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const hipRight = pose.getVec(Blaze.RIGHT_HIP)
        const hipDirection = vec3.sub(vec3.create(), hipRight, hipLeft) // left --> right

        const m = matFromDirection(spineDirection, hipDirection)
        mat4.rotateX(m, m, deg2rad(90))
        mat4.rotateY(m, m, deg2rad(-90))

        return m
    }

    getHip(pose: BlazePoseLandmarks): mat4 {
        const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const hipRight = pose.getVec(Blaze.RIGHT_HIP)
        const hipDirection = vec3.sub(vec3.create(), hipRight, hipLeft) // left --> right
        vec3.normalize(hipDirection, hipDirection)

        const shoulderLeft = pose.getVec(Blaze.LEFT_SHOULDER)
        const shoulderRight = pose.getVec(Blaze.RIGHT_SHOULDER)
        const left = vec3.sub(vec3.create(), shoulderLeft, hipLeft) // hip -> shoulder
        const right = vec3.sub(vec3.create(), shoulderRight, hipRight)
        const t0 = vec3.add(vec3.create(), left, right)
        vec3.normalize(t0, t0)

        const m = matFromDirection(hipDirection, t0)
        mat4.rotateY(m, m, deg2rad(90))

        return m
    }

    /**
     * Interpolates the missing y-rotation of the blaze model of the upper leg by using the upper legs.
     */
    getHipWithAdjustment(pose: BlazePoseLandmarks): mat4 {
        let rootPoseGlobal = this.getHip(pose)

        const pose2 = pose.clone()
        const inv = mat4.create()
        mat4.invert(inv, rootPoseGlobal)
        pose2.mul(inv)

        const hipLeft = pose2.getVec(Blaze.LEFT_HIP)
        const hipRight = pose2.getVec(Blaze.RIGHT_HIP)
        const kneeLeft = pose2.getVec(Blaze.LEFT_KNEE)
        const kneeRight = pose2.getVec(Blaze.RIGHT_KNEE)

        let left = rad2deg(Math.atan2(kneeLeft[1] - hipLeft[1], kneeLeft[2] - hipLeft[2]) + Math.PI / 2)
        if (left >= 170) {
            left -= 360
        }
        let right = rad2deg(Math.atan2(kneeRight[1] - hipRight[1], kneeRight[2] - hipRight[2]) + Math.PI / 2)
        if (right >= 170) {
            right -= 360
        }

        const adjustment = (left + right) / 4 // add 1/4, improve by looking at real body

        mat4.rotateX(rootPoseGlobal, rootPoseGlobal, deg2rad(adjustment))

        return rootPoseGlobal
    }

    getShoulder(pose: BlazePoseLandmarks): mat4 {
        const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const hipRight = pose.getVec(Blaze.RIGHT_HIP)
        const shoulderLeft = pose.getVec(Blaze.LEFT_SHOULDER)
        const shoulderRight = pose.getVec(Blaze.RIGHT_SHOULDER)

        const shoulderDirection = vec3.sub(vec3.create(), shoulderRight, shoulderLeft) // left --> right
        vec3.normalize(shoulderDirection, shoulderDirection)

        // todo...
        const left = vec3.sub(vec3.create(), shoulderLeft, hipLeft) // hip -> shoulder
        const right = vec3.sub(vec3.create(), shoulderRight, hipRight)
        const t0 = vec3.add(vec3.create(), left, right)
        vec3.normalize(t0, t0)

        const m = matFromDirection(shoulderDirection, t0)
        mat4.rotateY(m, m, deg2rad(90))
        return m
    }

    getLeftUpperArm(pose: BlazePoseLandmarks): mat4 {
        const leftShoulder = pose.getVec(Blaze.LEFT_SHOULDER)
        const rightShoulder = pose.getVec(Blaze.RIGHT_SHOULDER)

        const shoulderDirection = vec3.sub(vec3.create(), rightShoulder, leftShoulder)

        const leftElbow = pose.getVec(Blaze.LEFT_ELBOW)
        const upperArmDirection = vecFromTo(leftElbow, leftShoulder)
        const m = matFromDirection(upperArmDirection, shoulderDirection)
        mat4.rotateX(m, m, deg2rad(90))
        mat4.rotateY(m, m, deg2rad(-90))

        return m
    }

    // FOR DEBUGGING, LOOK AROUND FRAME 801ff
    getLeftUpperArmWithAdjustment(pose: BlazePoseLandmarks) {
        let upper = this.getLeftUpperArm(pose)

        const pose2 = pose.clone()
        pose2.mul(mat4.invert(mat4.create(), upper))

        // X & Z of lower leg
        const top = pose2.getVec(Blaze.LEFT_SHOULDER)
        const middle = pose2.getVec(Blaze.LEFT_ELBOW)
        const bottom = pose2.getVec(Blaze.LEFT_WRIST)

        const d0 = vec3.sub(vec3.create(), middle, top)
        const d1 = vec3.sub(vec3.create(), bottom, middle)

        const x = d1[0],
            z = d1[2]

        let adjustmentByLower = 0,
            adjustmentByEffector = 0

        const angle = rad2deg(vec3.angle(d0, d1))
        {
            adjustmentByLower = rad2deg(Math.atan2(x, z) - Math.PI)
            adjustmentByLower -= 180 // ellenbogen knick richtung vorne, im gegensatz zu knie
            
            // make 'a' easier to reason about
            while (adjustmentByLower < 0) {
                adjustmentByLower += 360
            }
        }
        {
            // KNEE TO FOOT INDEX IS A BIT HACKY (INSTEAD OF HEEL TO INDEX) BUT AT THE MOMENT BETTER
            const leftHeel = pose2.getVec(Blaze.LEFT_WRIST)

            // the result of the hand y-rotation can be improved by rotating it along x & z into a straight line
            // or calculate the hand position relative to the lower arm and then extract the y rotation
            const l0 = pose2.getVec(Blaze.LEFT_PINKY)
            const l1 = pose2.getVec(Blaze.LEFT_INDEX)
            const handCenter = vec3.add(vec3.create(), l0, l1)
            vec3.scale(handCenter, handCenter, 0.5)

            // const leftFootIndex = pose2.getVec(Blaze.LEFT_INDEX)
            const x = handCenter[0] - leftHeel[0]
            const z = handCenter[2] - leftHeel[2]
            adjustmentByEffector = rad2deg(Math.atan2(x, z))
            while (adjustmentByEffector < 0) {
                adjustmentByEffector += 360
            }
            // adjustmentByEffector = 0
        }

        const debug = document.getElementById("debug1")
        if (debug != null) {
            debug.innerHTML = `adjustmentBy a: ${angle.toFixed(4)}, e: ${adjustmentByEffector.toFixed(4)}, l: ${adjustmentByLower.toFixed(4)}`
        }

        // blauer pfeil muss in die ellenbogen beuge zeigen!!!
        // hand bewegt sich mehr als fuss, darum schauen wir erst [5,10] statt [15,25] auf sie

        let adjustment = easeMedianAngle(angle, 5, 10, adjustmentByEffector, adjustmentByLower)
        // adjustment = adjustmentByLower
        // adjustment = adjustmentByEffector

        // const adjustment = ++counter

        mat4.rotateY(upper, upper, deg2rad(adjustment))

        this.leftLowerArm = mat4.clone(upper)
        mat4.rotateX(this.leftLowerArm, this.leftLowerArm, deg2rad(-angle))

        return upper
    }

    getLeftLowerArm(pose: BlazePoseLandmarks): mat4 {
        return this.leftLowerArm!
    }

    getLeftHand(pose: BlazePoseLandmarks): mat4 {
        const leftWrist = pose.getVec(Blaze.LEFT_WRIST)
        const leftPinky = pose.getVec(Blaze.LEFT_PINKY)
        const leftIndex = pose.getVec(Blaze.LEFT_INDEX)

        const handCenter = vec3.create()
        vec3.sub(handCenter, leftPinky, leftIndex)
        vec3.scale(handCenter, handCenter, 0.5)
        vec3.add(handCenter, handCenter, leftIndex)

        const forward = vec3.sub(vec3.create(), leftIndex, leftPinky)
        const up = vec3.sub(vec3.create(), leftWrist, handCenter)
        const m = matFromDirection(up, forward)
        mat4.rotateX(m, m, deg2rad(90))
        mat4.rotateY(m, m, deg2rad(180))

        return m
    }

    getRightUpperArm(pose: BlazePoseLandmarks): mat4 {
        const leftShoulder = pose.getVec(Blaze.LEFT_SHOULDER)
        const rightShoulder = pose.getVec(Blaze.RIGHT_SHOULDER)

        const shoulderDirection = vec3.sub(vec3.create(), rightShoulder, leftShoulder)

        const elbow = pose.getVec(Blaze.RIGHT_ELBOW)
        const upperArmDirection = vecFromTo(elbow, rightShoulder)
        const m = matFromDirection(upperArmDirection, shoulderDirection)
        mat4.rotateX(m, m, deg2rad(90))
        mat4.rotateY(m, m, deg2rad(-90))

        return m
    }

    // FOR DEBUGGING, LOOK AROUND FRAME 801ff
    getRightUpperArmWithAdjustment(pose: BlazePoseLandmarks) {
        let upper = this.getRightUpperArm(pose)

        const pose2 = pose.clone()
        pose2.mul(mat4.invert(mat4.create(), upper))

        // X & Z of lower leg
        const top = pose2.getVec(Blaze.RIGHT_SHOULDER)
        const middle = pose2.getVec(Blaze.RIGHT_ELBOW)
        const bottom = pose2.getVec(Blaze.RIGHT_WRIST)

        const d0 = vec3.sub(vec3.create(), middle, top)
        const d1 = vec3.sub(vec3.create(), bottom, middle)

        const x = d1[0],
            z = d1[2]

        let adjustmentByLower = 0,
            adjustmentByEffector = 0

        const angle = rad2deg(vec3.angle(d0, d1))
        {
            adjustmentByLower = rad2deg(Math.atan2(x, z) - Math.PI)
            adjustmentByLower -= 180 // ellenbogen knick richtung vorne, im gegensatz zu knie
            
            // make 'a' easier to reason about
            while (adjustmentByLower < 0) {
                adjustmentByLower += 360
            }
        }
        {
            // KNEE TO FOOT INDEX IS A BIT HACKY (INSTEAD OF HEEL TO INDEX) BUT AT THE MOMENT BETTER
            const leftHeel = pose2.getVec(Blaze.RIGHT_WRIST)

            // the result of the hand y-rotation can be improved by rotating it along x & z into a straight line
            // or calculate the hand position relative to the lower arm and then extract the y rotation
            const l0 = pose2.getVec(Blaze.RIGHT_PINKY)
            const l1 = pose2.getVec(Blaze.RIGHT_INDEX)
            const handCenter = vec3.add(vec3.create(), l0, l1)
            vec3.scale(handCenter, handCenter, 0.5)

            // const leftFootIndex = pose2.getVec(Blaze.LEFT_INDEX)
            const x = handCenter[0] - leftHeel[0]
            const z = handCenter[2] - leftHeel[2]
            adjustmentByEffector = rad2deg(Math.atan2(x, z))
            while (adjustmentByEffector < 0) {
                adjustmentByEffector += 360
            }
            // adjustmentByEffector = 0
        }

        // blauer pfeil muss in die ellenbogen beuge zeigen!!!
        // hand bewegt sich mehr als fuss, darum schauen wir erst [5,10] statt [15,25] auf sie

        let adjustment = easeMedianAngle(angle, 5, 10, adjustmentByEffector, adjustmentByLower)
        // adjustment = adjustmentByLower
        // adjustment = adjustmentByEffector

        // const adjustment = ++counter

        mat4.rotateY(upper, upper, deg2rad(adjustment))

        this.rightLowerArm = mat4.clone(upper)
        mat4.rotateX(this.rightLowerArm, this.rightLowerArm, deg2rad(-angle))

        return upper
    }

    getRightLowerArm(pose: BlazePoseLandmarks): mat4 {
        return this.rightLowerArm!
    }

    getRightHand(pose: BlazePoseLandmarks): mat4 {
        const wrist = pose.getVec(Blaze.RIGHT_WRIST)
        const pinky = pose.getVec(Blaze.RIGHT_PINKY)
        const index = pose.getVec(Blaze.RIGHT_INDEX)

        const handCenter = vec3.create()
        vec3.sub(handCenter, pinky, index)
        vec3.scale(handCenter, handCenter, 0.5)
        vec3.add(handCenter, handCenter, index)

        const forward = vec3.sub(vec3.create(), index, pinky)
        const up = vec3.sub(vec3.create(), wrist, handCenter)
        const m = matFromDirection(up, forward)
        mat4.rotateX(m, m, deg2rad(90))
        mat4.rotateY(m, m, deg2rad(180))

        return m
    }

    getHead(pose: BlazePoseLandmarks): mat4 {
        const nose = pose.getVec(Blaze.NOSE)
        const leftEar = pose.getVec(Blaze.LEFT_EAR)
        const rightEar = pose.getVec(Blaze.RIGHT_EAR)
        const headCenter = vec3.add(vec3.create(), leftEar, rightEar)
        vec3.scale(headCenter, headCenter, 0.5)

        const up = vec3.sub(vec3.create(), leftEar, rightEar)
        const forward = vec3.sub(vec3.create(), nose, headCenter)

        const m = matFromDirection(forward, up)
        mat4.rotateZ(m, m, deg2rad(90))
        return m
    }

    /**
     * Get matrix for left upper leg without adjustment for y-rotation.
     *
     * y-rotation will need to be interpolated from lower leg or foot
     */
    getLeftUpperLeg(pose: BlazePoseLandmarks): mat4 {
        const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const hipRight = pose.getVec(Blaze.RIGHT_HIP)

        const hipDirection = vecFromTo(hipRight, hipLeft)

        const kneeLeft = pose.getVec(Blaze.LEFT_KNEE)
        const upperLegDirection = vecFromTo(kneeLeft, hipLeft)
        const m = matFromDirection(upperLegDirection, hipDirection)
        mat4.rotateY(m, m, deg2rad(90))
        mat4.rotateZ(m, m, deg2rad(90))

        return m
    }

    getRightUpperLeg(pose: BlazePoseLandmarks): mat4 {
        const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const hipRight = pose.getVec(Blaze.RIGHT_HIP)

        const hipDirection = vecFromTo(hipRight, hipLeft)

        const rightKnee = pose.getVec(Blaze.RIGHT_KNEE)
        const upperLegDirection = vecFromTo(rightKnee, hipRight)
        const m = matFromDirection(upperLegDirection, hipDirection)
        mat4.rotateY(m, m, deg2rad(90))
        mat4.rotateZ(m, m, deg2rad(90))

        return m
    }

    /**
     * Interpolates the missing y-rotation of the blaze model of the upper leg by using lower leg and foot.
     *
     * When the knee is bend, we can calculate the exact y-rotation.
     *
     * Otherwise, we can interpolate from the foot, past and future knee bends.
     */

    // FIXME: IT'S UNSTABLE
    // FOR DEBUGGING I NEED TO BE ABLE NAVIGATE THE TIMELINE

    getLeftUpperLegWithAdjustment(pose: BlazePoseLandmarks) {
        let upperLeg = this.getLeftUpperLeg(pose)

        const pose2 = pose.clone()
        pose2.mul(mat4.invert(mat4.create(), upperLeg))

        // X & Z of lower leg
        const hip = pose2.getVec(Blaze.LEFT_HIP)
        const knee = pose2.getVec(Blaze.LEFT_KNEE)
        const ankle = pose2.getVec(Blaze.LEFT_ANKLE)

        const d0 = vec3.sub(vec3.create(), knee, hip)
        const d1 = vec3.sub(vec3.create(), ankle, knee)

        const x = d1[0],
            z = d1[2]

        let adjustmentByLowerLeg = 0,
            adjustmentByFoot = 0

        const kneeAngle = rad2deg(vec3.angle(d0, d1))
        {
            adjustmentByLowerLeg = rad2deg(Math.atan2(x, z) - Math.PI)
            // make 'a' easier to reason about
            if (adjustmentByLowerLeg < 0) {
                adjustmentByLowerLeg += 360
            }
            // around frame 537, a's where y-axis is flipped: yes: 157 167 170 178 183 184
            //
            //           0
            //
            //
            // 270               90
            //
            //    225         134
            //          180
            //
            // i'm not sure why this flips at all. atan2 should be 360 degree. is it because of the inverted pose2?
            if (90 < adjustmentByLowerLeg && adjustmentByLowerLeg < 270) {
                adjustmentByLowerLeg -= 180
            }
        }
        {
            // KNEE TO FOOT INDEX IS A BIT HACKY (INSTEAD OF HEEL TO INDEX) BUT AT THE MOMENT BETTER
            const leftHeel = pose2.getVec(Blaze.LEFT_ANKLE)
            const leftFootIndex = pose2.getVec(Blaze.LEFT_FOOT_INDEX)
            const x = leftFootIndex[0] - leftHeel[0]
            const z = leftFootIndex[2] - leftHeel[2]
            adjustmentByFoot = rad2deg(Math.atan2(x, z))
        }

        const adjustment = easeMedianAngle(kneeAngle, 10, 25, adjustmentByFoot, adjustmentByLowerLeg)

        mat4.rotateY(upperLeg, upperLeg, deg2rad(adjustment))

        this.leftLowerLeg = mat4.clone(upperLeg)
        mat4.rotateX(this.leftLowerLeg, this.leftLowerLeg, deg2rad(kneeAngle))

        return upperLeg
    }

    getRightUpperLegWithAdjustment(pose: BlazePoseLandmarks) {
        let upperLeg = this.getRightUpperLeg(pose)

        const pose2 = pose.clone()
        pose2.mul(mat4.invert(mat4.create(), upperLeg))

        // X & Z of lower leg
        const hip = pose2.getVec(Blaze.RIGHT_HIP)
        const knee = pose2.getVec(Blaze.RIGHT_KNEE)
        const ankle = pose2.getVec(Blaze.RIGHT_ANKLE)

        const d0 = vec3.sub(vec3.create(), knee, hip)
        const d1 = vec3.sub(vec3.create(), ankle, knee)

        const x = d1[0],
            z = d1[2]

        let adjustmentByLowerLeg = 0,
            adjustmentByFoot = 0

        const kneeAngle = rad2deg(vec3.angle(d0, d1))
        {
            adjustmentByLowerLeg = rad2deg(Math.atan2(x, z) - Math.PI)
            // make 'a' easier to reason about
            if (adjustmentByLowerLeg < 0) {
                adjustmentByLowerLeg += 360
            }
            // around frame 537, a's where y-axis is flipped: yes: 157 167 170 178 183 184
            //
            //           0
            //
            //
            // 270               90
            //
            //    225         134
            //          180
            //
            // i'm not sure why this flips at all. atan2 should be 360 degree. is it because of the inverted pose2?
            if (90 < adjustmentByLowerLeg && adjustmentByLowerLeg < 270) {
                adjustmentByLowerLeg -= 180
            }
        }
        {
            // KNEE TO FOOT INDEX IS A BIT HACKY (INSTEAD OF HEEL TO INDEX) BUT AT THE MOMENT BETTER
            const leftHeel = pose2.getVec(Blaze.RIGHT_ANKLE)
            const leftFootIndex = pose2.getVec(Blaze.RIGHT_FOOT_INDEX)
            const x = leftFootIndex[0] - leftHeel[0]
            const z = leftFootIndex[2] - leftHeel[2]
            adjustmentByFoot = rad2deg(Math.atan2(x, z))
        }

        const adjustment = easeMedianAngle(kneeAngle, 10, 25, adjustmentByFoot, adjustmentByLowerLeg)

        mat4.rotateY(upperLeg, upperLeg, deg2rad(adjustment))

        this.rightLowerLeg = mat4.clone(upperLeg)
        mat4.rotateX(this.rightLowerLeg, this.rightLowerLeg, deg2rad(kneeAngle))

        return upperLeg
    }

    getLeftLowerLeg(pose: BlazePoseLandmarks): mat4 {
        return this.leftLowerLeg!
    }

    getRightLowerLeg(pose: BlazePoseLandmarks): mat4 {
        return this.rightLowerLeg!
    }

    getLeftFoot(pose: BlazePoseLandmarks): mat4 {
        const leftAnkle = pose.getVec(Blaze.LEFT_ANKLE)
        const leftHeel = pose.getVec(Blaze.LEFT_HEEL)
        const leftIndex = pose.getVec(Blaze.LEFT_FOOT_INDEX)

        const forward = vec3.sub(vec3.create(), leftIndex, leftHeel)
        const up = vec3.sub(vec3.create(), leftAnkle, leftHeel)
        return matFromDirection(forward, up)
    }

    getRightFoot(pose: BlazePoseLandmarks): mat4 {
        const leftAnkle = pose.getVec(Blaze.RIGHT_ANKLE)
        const leftHeel = pose.getVec(Blaze.RIGHT_HEEL)
        const leftIndex = pose.getVec(Blaze.RIGHT_FOOT_INDEX)

        const forward = vec3.sub(vec3.create(), leftIndex, leftHeel)
        const up = vec3.sub(vec3.create(), leftAnkle, leftHeel)
        return matFromDirection(forward, up)
    }
}

// https://stackoverflow.com/questions/18558910/direction-vector-to-rotation-matrix
const _up = vec3.fromValues(0, 1, 0)
function matFromDirection(direction: vec3, up: vec3 = _up) {
    const zaxis = vec3.normalize(vec3.create(), direction)
    const xaxis = vec3.cross(vec3.create(), up, zaxis)
    vec3.normalize(xaxis, xaxis)
    const yaxis = vec3.cross(vec3.create(), zaxis, xaxis)
    vec3.normalize(yaxis, yaxis)
    // prettier-ignore
    return mat4.fromValues(
        xaxis[0], xaxis[1], xaxis[2], 0,
        yaxis[0], yaxis[1], yaxis[2], 0,
        zaxis[0], zaxis[1], zaxis[2], 0,
        0,        0,        0,        1
    )
}
