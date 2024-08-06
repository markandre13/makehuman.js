import { vec3 } from "gl-matrix"
import { euler_matrix } from "lib/euler_matrix"

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
 * Convert Mediapipe's Pose Landmark Model (BlazePose GHUM 3D) to Makehuman Pose
 */
export class BlazePoseLandmarks {
    data: Float32Array
    constructor(data: Float32Array = new Float32Array(3 * 33).fill(0)) {
        this.data = data
    }
    rotate(x: number, y: number, z: number) {
        const m = euler_matrix(x, y, z)
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
    setVec(index: Blaze, x: number, y: number, z: number) {
        const i = index * 3
        this.data[i] = x
        this.data[i + 1] = y
        this.data[i + 2] = z
    }
}

export class BlazePoseConverter {
    getRootY(pose: BlazePoseLandmarks) {
        const hipLeft = pose.getVec(Blaze.LEFT_HIP)
        const hipRight = pose.getVec(Blaze.RIGHT_HIP)
        const hipDirection = vec3.sub(vec3.create(), hipRight, hipLeft) // left --> right
        vec3.normalize(hipDirection, hipDirection)
        return Math.atan2(hipDirection[0], -hipDirection[2]) + Math.PI / 2
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