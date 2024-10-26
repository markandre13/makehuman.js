import { mat4, vec3 } from "gl-matrix"
import { deg2rad, rad2deg } from "lib/calculateNormals"
import { euler_matrix } from "lib/euler_matrix"
import { isZero } from "mesh/HumanMesh"

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

        // todo...
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

    getLeftUpperLeg(pose: BlazePoseLandmarks): mat4 {
        const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const hipRight = pose.getVec(Blaze.RIGHT_HIP)

        const t = vec3.sub(vec3.create(), hipLeft, hipRight)

        const kneeLeft = pose.getVec(Blaze.LEFT_KNEE)
        const d = vec3.sub(vec3.create(), hipLeft, kneeLeft)
        const m = matFromDirection(d, t)
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
    // FIXME: this works with the simulated blaze model, but not with real data...
    getLeftUpperLegWithAdjustment(pose: BlazePoseLandmarks) {
        let leftUpperLeg = this.getLeftUpperLeg(pose)

        const pose2 = pose.clone()
        const inv = mat4.create()
        mat4.invert(inv, leftUpperLeg)
        pose2.mul(inv)

        // X & Z of lower leg
        const kneeLeft = pose2.getVec(Blaze.LEFT_KNEE)
        const ankleLeft = pose2.getVec(Blaze.LEFT_ANKLE)

        const x = ankleLeft[0] - kneeLeft[0]
        const y = ankleLeft[1] - kneeLeft[1]
        const z = ankleLeft[2] - kneeLeft[2]

        let a = 0, adjustment0 = 0, adjustment1 = 0
        if (!isZero(z)) {
            if (z < 0) {
                a = adjustment0 = rad2deg(Math.atan2(x, z) - Math.PI)
            } else {
                a = adjustment0 = rad2deg(Math.atan2(-x, -z) - Math.PI)
            }
            // if (a > -225 && a > -270) {
            //     a += 180
            // }
        } else {
            const leftHeel = pose2.getVec(Blaze.LEFT_HEEL)
            const leftFootIndex = pose2.getVec(Blaze.LEFT_FOOT_INDEX)
            const x = leftFootIndex[0] - leftHeel[0]
            const y = leftFootIndex[1] - leftHeel[1]
            const z = leftFootIndex[2] - leftHeel[2]
            a = adjustment1 = rad2deg(Math.atan2(x, z))
        }

        // const debug = document.getElementById("debug")
        // if (debug != null) {
        //     debug.innerHTML = `x: ${x.toFixed(4)}, y: ${y.toFixed(4)}, z: ${z.toFixed(4)}, a0: ${adjustment0}, a1: ${adjustment1}`
        // }

        // const rot = mat4.fromYRotation(mat4.create(), deg2rad(a))
        // mat4.mul(leftUpperLeg, leftUpperLeg, rot)
        mat4.rotateY(leftUpperLeg, leftUpperLeg, deg2rad(a))

        return leftUpperLeg
    }

    getLeftLowerLeg(pose: BlazePoseLandmarks) {

        // const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        // const kneeLeft = pose.getVec(Blaze.LEFT_KNEE)
        // const ankleLeft = pose.getVec(Blaze.LEFT_ANKLE)
     
        // const d0 = vec3.sub(vec3.create(), hipLeft, kneeLeft)
        // const d1 = vec3.sub(vec3.create(), ankleLeft, kneeLeft)

        // const m = matFromDirection(d1, d0)
        // mat4.rotateX(m, m, deg2rad(90))
        // mat4.rotateZ(m, m, deg2rad(180))

        // return m

        let leftUpperLeg = this.getLeftUpperLegWithAdjustment(pose)

        const pose2 = pose.clone()
        const inv = mat4.create()
        mat4.invert(inv, leftUpperLeg)
        pose2.mul(inv)

        // const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const kneeLeft = pose.getVec(Blaze.LEFT_KNEE)
        const ankleLeft = pose.getVec(Blaze.LEFT_ANKLE)
     
        // const d0 = vec3.sub(vec3.create(), hipLeft, kneeLeft)
        const d1 = vec3.sub(vec3.create(), ankleLeft, kneeLeft)

        const m = matFromDirection(d1)
        mat4.rotateX(m, m, deg2rad(90))
        // mat4.rotateZ(m, m, deg2rad(180))

        return m


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
