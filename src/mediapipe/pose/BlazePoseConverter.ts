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
    getRoot(pose: BlazePoseLandmarks): mat4 {
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

        // const t0 = vec3.fromValues(0, 1, 0)

        // const yaxis = this.getRootY(pose)
        // const pose2 = pose.clone()
        // pose2.rotate(0, yaxis, 0)
        /*
        const leftShoulder = pose.getVec(Blaze.LEFT_SHOULDER)
        const rightShoulder = pose.getVec(Blaze.RIGHT_SHOULDER)
        const leftHip = pose.getVec(Blaze.LEFT_HIP)
        const rightHip = pose.getVec(Blaze.RIGHT_HIP)
        const leftKnee = pose.getVec(Blaze.LEFT_KNEE)
        const rightKnee = pose.getVec(Blaze.RIGHT_KNEE)

        const dirRightShoulder = vec3.sub(vec3.create(), rightShoulder, rightHip) // hip --> shoulder
        vec3.normalize(dirRightShoulder, dirRightShoulder)

        const dirLeftShoulder = vec3.sub(vec3.create(), leftShoulder, leftHip) // hip --> shoulder
        vec3.normalize(dirLeftShoulder, dirLeftShoulder)

        const dirRightKnee = vec3.sub(vec3.create(), rightHip, rightKnee) // knee -> hip
        vec3.normalize(dirRightKnee, dirRightKnee)

        const dirLeftKnee = vec3.sub(vec3.create(), leftHip, leftKnee) // knee => hip
        vec3.normalize(dirLeftKnee, dirLeftKnee)

        const dir = vec3.create()
        vec3.add(dir, dir, dirRightShoulder)
        vec3.add(dir, dir, dirLeftShoulder)
        vec3.add(dir, dir, dirRightKnee)
        vec3.add(dir, dir, dirLeftKnee)
        vec3.normalize(dir, dir)

        return matFromDirection(hipDirection, dir)
        */
        return matFromDirection(hipDirection, t0)
    }

    /**
     * Get hip rotation with adjustment from legs to get a spine bending from Blaze along the x-axis.
     * 
     * @param pose 
     * @returns 
     */
    getHipWithAdjustment(pose: BlazePoseLandmarks): mat4 {
        let rootPoseGlobal = this.getRoot(pose)

        const pose2 = pose.clone()
        const inv = mat4.create()
        mat4.invert(inv, rootPoseGlobal)
        pose2.mul(inv)

        const hipLeft = pose2.getVec(Blaze.LEFT_HIP)
        const hipRight = pose2.getVec(Blaze.RIGHT_HIP)
        const kneeLeft = pose2.getVec(Blaze.LEFT_KNEE)
        const kneeRight = pose2.getVec(Blaze.RIGHT_KNEE)

        let left = rad2deg(Math.atan2(kneeLeft[1] - hipLeft[1], kneeLeft[0] - hipLeft[0]) + Math.PI / 2)
        if (left >= 170) {
            left -= 360
        }
        let right = rad2deg(Math.atan2(kneeRight[1] - hipRight[1], kneeRight[0] - hipRight[0]) + Math.PI / 2)
        if (right >= 170) {
            right -= 360
        }

        const adjustment = (left + right) / 8
        mat4.rotateY(rootPoseGlobal, rootPoseGlobal, deg2rad(-90))
        mat4.rotateX(rootPoseGlobal, rootPoseGlobal, deg2rad(adjustment))

        return rootPoseGlobal
    }

    getRoot1(pose: BlazePoseLandmarks): mat4 {
        const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const hipRight = pose.getVec(Blaze.RIGHT_HIP)
        const hipDirection = vec3.sub(vec3.create(), hipRight, hipLeft) // left --> right
        vec3.normalize(hipDirection, hipDirection)
        const rootY = Math.atan2(hipDirection[0], -hipDirection[2]) + Math.PI / 2

        const rootPoseGlobal = mat4.create()
        const inv = mat4.fromYRotation(mat4.create(), rootY)
        vec3.transformMat4(hipDirection, hipDirection, inv)
        const rootZ = Math.atan2(hipDirection[0], -hipDirection[1]) + Math.PI / 2

        // TODO: x-axis
        // variant 1: just use the HIP to SHOULDER
        // this doesn't seem to work when lying on the back
        const shoulderLeft = pose.getVec(Blaze.LEFT_SHOULDER)
        const shoulderRight = pose.getVec(Blaze.RIGHT_SHOULDER)
        const kneeLeft = pose.getVec(Blaze.LEFT_KNEE)
        const kneeRight = pose.getVec(Blaze.RIGHT_KNEE)

        // rootX := median of torso and legs
        const t0 = vec3.sub(vec3.create(), shoulderLeft, hipLeft)
        const t1 = vec3.sub(vec3.create(), kneeLeft, hipLeft)
        const t2 = vec3.sub(vec3.create(), shoulderRight, hipRight)
        const t3 = vec3.sub(vec3.create(), kneeRight, hipRight)
        vec3.normalize(t0, t0)
        vec3.normalize(t1, t1)
        vec3.normalize(t2, t2)
        vec3.normalize(t3, t3)
        vec3.transformMat4(t0, t0, inv)
        vec3.transformMat4(t1, t1, inv)
        vec3.transformMat4(t2, t2, inv)
        vec3.transformMat4(t3, t3, inv)

        let rootX = Math.atan2(t0[1], t0[2]) + Math.PI / 2
        rootX += Math.atan2(t0[1], t0[2]) + Math.PI / 2
        rootX += Math.atan2(t0[1], t0[2]) + Math.PI / 2
        rootX += Math.atan2(t0[1], t0[2]) + Math.PI / 2
        rootX /= 4
        rootX += Math.PI

        // FIXME: the x-axis isn't always correct, especially when lying on the back
        // try to at pause, step forward and backward and an editable frame/time counter
        // then find the position, write unit test, and solve it
        // or
        // use matFromDirection()
        mat4.rotateY(rootPoseGlobal, rootPoseGlobal, rootY)
        mat4.rotateX(rootPoseGlobal, rootPoseGlobal, rootX)
        mat4.rotateZ(rootPoseGlobal, rootPoseGlobal, rootZ)
        return rootPoseGlobal
    }

    /**
     * get rotation around y-axis based on hips in radians
     */
    getRootY(pose: BlazePoseLandmarks) {
        const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const hipRight = pose.getVec(Blaze.RIGHT_HIP)
        const hipDirection = vec3.sub(vec3.create(), hipRight, hipLeft) // left --> right
        vec3.normalize(hipDirection, hipDirection)
        return Math.atan2(hipDirection[0], -hipDirection[2]) + Math.PI / 2
    }
    getLeftShoulderAngle(pose: BlazePoseLandmarks) {
        const shoulder = pose.getVec(Blaze.RIGHT_SHOULDER)
        const elbow = pose.getVec(Blaze.LEFT_SHOULDER)
        const wrist = pose.getVec(Blaze.LEFT_ELBOW)
        const elbow2shoulder = vec3.sub(vec3.create(), shoulder, elbow)
        const elbow2wrist = vec3.sub(vec3.create(), wrist, elbow)
        return -vec3.angle(elbow2shoulder, elbow2wrist)
    }
    getRightShoulderAngle(pose: BlazePoseLandmarks) {
        const shoulder = pose.getVec(Blaze.LEFT_SHOULDER)
        const elbow = pose.getVec(Blaze.RIGHT_SHOULDER)
        const wrist = pose.getVec(Blaze.RIGHT_ELBOW)
        const elbow2shoulder = vec3.sub(vec3.create(), shoulder, elbow)
        const elbow2wrist = vec3.sub(vec3.create(), wrist, elbow)
        return vec3.angle(elbow2shoulder, elbow2wrist)
    }
    getLeftArmAngle(pose: BlazePoseLandmarks) {
        const shoulder = pose.getVec(Blaze.LEFT_SHOULDER)
        const elbow = pose.getVec(Blaze.LEFT_ELBOW)
        const wrist = pose.getVec(Blaze.LEFT_WRIST)
        const elbow2shoulder = vec3.sub(vec3.create(), shoulder, elbow)
        const elbow2wrist = vec3.sub(vec3.create(), wrist, elbow)
        return vec3.angle(elbow2shoulder, elbow2wrist)
    }
    getRightArmAngle(pose: BlazePoseLandmarks) {
        const shoulder = pose.getVec(Blaze.RIGHT_SHOULDER)
        const elbow = pose.getVec(Blaze.RIGHT_ELBOW)
        const wrist = pose.getVec(Blaze.RIGHT_WRIST)
        const elbow2shoulder = vec3.sub(vec3.create(), shoulder, elbow)
        const elbow2wrist = vec3.sub(vec3.create(), wrist, elbow)
        return vec3.angle(elbow2shoulder, elbow2wrist)
    }
    getLeftLegAngle(pose: BlazePoseLandmarks) {
        const hip = pose.getVec(Blaze.LEFT_HIP)
        const knee = pose.getVec(Blaze.LEFT_KNEE)
        const ankle = pose.getVec(Blaze.LEFT_ANKLE)
        const knee2hip = vec3.sub(vec3.create(), hip, knee)
        const knee2ankle = vec3.sub(vec3.create(), ankle, knee)
        return vec3.angle(knee2hip, knee2ankle)
    }
    getRightLegAngle(pose: BlazePoseLandmarks) {
        const hip = pose.getVec(Blaze.RIGHT_HIP)
        const knee = pose.getVec(Blaze.RIGHT_KNEE)
        const ankle = pose.getVec(Blaze.RIGHT_ANKLE)
        const knee2hip = vec3.sub(vec3.create(), hip, knee)
        const knee2ankle = vec3.sub(vec3.create(), ankle, knee)
        return vec3.angle(knee2hip, knee2ankle)
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
