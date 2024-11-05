import { mat4, vec3 } from "gl-matrix"
import { deg2rad, rad2deg } from "lib/calculateNormals"
import { euler_from_matrix, euler_matrix } from "lib/euler_matrix"
import { easeMedianAngle, medianAngle } from "lib/medianAngle"
import { isZero } from "mesh/HumanMesh"

let dynamic = 0

/**
 * Indices for Mediapipe's Pose Landmark Model (BlazePose GHUM 3D)
 */
export enum Blaze {
    NOSE, // 0
    LEFT_EYE_INNER, // 1
    LEFT_EYE, // 2
    LEFT_EYE_OUTER, // 3
    RIGHT_EYE_INNER, // 4
    RIGHT_EYE, // 5
    RIGHT_EYE_OUTER, // 6
    LEFT_EAR, // 7
    RIGHT_EAR, // 8
    MOUTH_LEFT, // 9
    MOUT_RIGHT, // 10
    LEFT_SHOULDER, // 11
    RIGHT_SHOULDER, // 12
    LEFT_ELBOW, // 13
    RIGHT_ELBOW, // 14
    LEFT_WRIST, // 15
    RIGHT_WRIST, // 16
    LEFT_PINKY, // 17
    RIGHT_PINKY, // 18
    LEFT_INDEX, // 19
    RIGHT_INDEX, // 20
    LEFT_THUMB, // 21
    RIGHT_THUMB, // 22
    LEFT_HIP, // 23
    RIGHT_HIP, // 24
    LEFT_KNEE, // 25
    RIGHT_KNEE, // 26
    LEFT_ANKLE, // 27
    RIGHT_ANKLE, // 28
    LEFT_HEEL, // 29
    RIGHT_HEEL, // 30
    LEFT_FOOT_INDEX, // 31
    RIGHT_FOOT_INDEX, // 32
}

function vecFromTo(from: vec3, to: vec3) {
    return vec3.sub(vec3.create(), to, from)
}

/**
 * Wrapper for Mediapipe's Pose Landmark Model (BlazePose GHUM 3D)
 */
export class BlazePoseLandmarks {
    data: Float32Array
    constructor(data: Float32Array = new Float32Array(3 * 33).fill(0)) {
        this.data = data
    }
    clone() {
        return new BlazePoseLandmarks(this.data.slice())
    }
    /**
     * rotate all landmarks (used for testing)
     */
    rotate(x: number, y: number, z: number) {
        this.mul(euler_matrix(x, y, z))
    }
    mul(m: mat4) {
        for (let i = 0; i < 33; ++i) {
            const v = this.getVec(i)
            vec3.transformMat4(v, v, m)
            this.setVec(i, v[0], v[1], v[2])
        }
    }
    getVec(index: Blaze) {
        const i = index * 3
        return vec3.fromValues(this.data[i], this.data[i + 1], this.data[i + 2])
    }
    getVec0(index: Blaze) {
        const i = index * 3
        return vec3.fromValues(this.data[i], this.data[i + 1], this.data[i + 2])
    }

    setVec(index: Blaze, x: number, y: number, z: number): void
    setVec(index: Blaze, v: vec3): void
    setVec(index: Blaze, x: number | vec3, y?: number, z?: number): void {
        const i = index * 3
        if (typeof x === "number") {
            this.data[i] = x
            this.data[i + 1] = y!
            this.data[i + 2] = z!
        } else {
            const v = x as vec3
            this.data[i] = v[0]
            this.data[i + 1] = v[1]
            this.data[i + 2] = v[2]
        }
    }
}

let prev = 0,
    dy = 0,
    dz = 0

// * the technical term is 'retarget' instead of 'convert'
// * https://github.com/freemocap/freemocap_blendarmocap does a similar thing

/**
 * Convert Mediapipe's Pose Landmark Model (BlazePose GHUM 3D) to Makehuman Pose
 */
export class BlazePoseConverter {
    leftLowerLeg?: mat4

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
        let leftUpperLeg = this.getLeftUpperLeg(pose)

        const pose2 = pose.clone()
        pose2.mul(mat4.invert(mat4.create(), leftUpperLeg))

        // X & Z of lower leg
        const hipLeft = pose2.getVec(Blaze.LEFT_HIP)
        const kneeLeft = pose2.getVec(Blaze.LEFT_KNEE)
        const ankleLeft = pose2.getVec(Blaze.LEFT_ANKLE)

        const d0 = vec3.sub(vec3.create(), kneeLeft, hipLeft)
        const d1 = vec3.sub(vec3.create(), ankleLeft, kneeLeft)

        const x = d1[0],
            y = d1[1],
            z = d1[2]

        function vec2str(v: vec3) {
            return `(${v[0].toFixed(4)}, ${v[1].toFixed(4)}, ${v[2].toFixed(4)})`
        }

        // left leg movement: frame 949 to
        // frame 2273 doesn't work

        let adjustmentByLowerLeg = 0,
            adjustmentByFoot = 0
        // TODO
        // [ ] instead of looking on z, we should look at the radius to be independent of lengths
        // [ ] jumping from one approach to another causes jumps, try to transition
        //     or interpolate from beginning to end when leg is too straight to calculate y-rotation
        //     it might be still wrong but will look better. and at the moment that's all i'm after.
        // [ ] once the above works, try to map on makehuman skeleton
        // [ ] then the foot (should be easy as it has 3 points)
        // [ ] only then the other leg
        // [ ] refactor to share code between left and right leg
        // [ ] do the arm
        // [ ] try to share arm and leg code
        // [ ] MH.JS' internal stack should map chordata & freemocap to the same rest position and
        //     from there apply to the MH skeleton. this way the code becomes cleaner and we could
        //     even try to interpolate between the two
        // NOTE: FRAME 1490 IS A MESS when "if (Math.abs(z) > 0.1) {" INSTEAD OF "if (Math.abs(z) > 0.2) {""
        // NOTE: 1492 to 1493 has a jump
        // 1492
        // d0: (0.0000, -4.2358, 0.0000)
        // d1: (-0.4994, -3.5933, -0.0252)
        // a0: 87.11481047318046
        // a1: 6.757578019024761
        // 1493
        // d0: (0.0000, -4.2342, 0.0000)
        // d1: (-0.5267, -3.5832, 0.0071) // z flips
        // a0: -89.2234629711096
        // a1: 6.428447043278795

        const kneeAngle = rad2deg(vec3.angle(d0, d1))
        {
            // if (z < 0) {
            //     adjustment0 = rad2deg(Math.atan2(x, z) - Math.PI)
            // } else {
            //     adjustment0 = rad2deg(Math.atan2(x, -z) - Math.PI)
            // }

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
            const y = leftFootIndex[1] - leftHeel[1]
            const z = leftFootIndex[2] - leftHeel[2]
            adjustmentByFoot = rad2deg(Math.atan2(x, z))
        }

        const adjustment = easeMedianAngle(kneeAngle, 10, 25, adjustmentByFoot, adjustmentByLowerLeg)

        // const debug = document.getElementById("debug")
        // if (debug != null) {
        //     debug.innerHTML = `d0: ${vec2str(d0)}<br/>d1: ${vec2str(
        //         d1
        //     )}<br/>a: ${adjustment}<br/>a0: ${adjustmentByLowerLeg}<br/>a1: ${adjustmentByFoot}<br/>kneeAngle: ${kneeAngle}`
        // }

        mat4.rotateY(leftUpperLeg, leftUpperLeg, deg2rad(adjustment))

        this.leftLowerLeg = mat4.clone(leftUpperLeg)
        mat4.rotateX(this.leftLowerLeg, this.leftLowerLeg, deg2rad(kneeAngle))

        return leftUpperLeg
    }

    getLeftLowerLeg(pose: BlazePoseLandmarks): mat4 {
        return this.leftLowerLeg!
    }

    getLeftFoot(pose: BlazePoseLandmarks): mat4 {
        const leftAnkle = pose.getVec(Blaze.LEFT_ANKLE)
        const leftHeel = pose.getVec(Blaze.LEFT_HEEL)
        const leftIndex = pose.getVec(Blaze.LEFT_FOOT_INDEX)

        const forward = vec3.sub(vec3.create(), leftIndex, leftHeel)
        const up = vec3.sub(vec3.create(), leftAnkle, leftHeel)
        return matFromDirection(forward, up)
        // return this.leftLowerLeg!
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
