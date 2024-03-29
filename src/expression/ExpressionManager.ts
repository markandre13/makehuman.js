import { FileSystemAdapter } from "../filesystem/FileSystemAdapter"
import { BiovisionHierarchy } from "lib/BiovisionHierarchy"
import { mat4, quat2 } from "gl-matrix"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { Skeleton } from "skeleton/Skeleton"
import { ExpressionModel } from "./ExpressionModel"
import { euler_from_matrix } from "lib/euler_matrix"

export class ExpressionManager {
    // FIXME: move the data into the model

    skeleton: Skeleton
    base_anim: mat4[] // face pose units as mat4[] (joints x pose units)
    facePoseUnitsNames: string[] // poseunit_names
    poseUnitName2Frame = new Map<string, number>()
    expressions: string[] // list of predefined expressions

    model: ExpressionModel

    constructor(skeleton: Skeleton) {
        // TODO: check if some of the json files contain some of the filenames being hardcoded here
        this.skeleton = skeleton

        // the BVH contains an animation frame for each pose unit ()
        const facePoseUnits = new BiovisionHierarchy().fromFile("data/poseunits/face-poseunits.bvh", "auto", "none")
        // the BVH as all matrices for all bones for all animation frames: (frame0, bone0), (frame0, bone1), ... , (frame0, boneX), (frame1, bone0), ...
        this.base_anim = facePoseUnits.createAnimationTrack(skeleton, "Expression-Face-PoseUnits").data
        // pose unit names for each frame
        this.facePoseUnitsNames = JSON.parse(FileSystemAdapter.readFile("data/poseunits/face-poseunits.json"))
            .framemapping as string[]
        this.facePoseUnitsNames.forEach((name, index) => this.poseUnitName2Frame.set(name, index))

        // predefines expressions using the face pose units
        this.expressions = FileSystemAdapter.listDir("expressions")
            .filter((filename) => filename.endsWith(".mhpose"))
            .map((filename) => filename.substring(0, filename.length - 7))

        this.model = new ExpressionModel(this)
    }

    // set the face expression pose units from on of the pre-defined expressions
    setExpression(expression: number | string) {
        if (typeof expression === "string") {
            const name = expression
            expression = this.expressions.findIndex((e) => e === name)
            if (expression === -1) {
                throw Error(`'${name} is not a known expression'`)
            }
        }

        const expressionName = this.expressions[expression]
        const poseUnit2Weight = JSON.parse(FileSystemAdapter.readFile(`data/expressions/${expressionName}.mhpose`))
            .unit_poses as any

        this.model.clear()
        for (let poseUnitName of Object.getOwnPropertyNames(poseUnit2Weight)) {
            const weight = poseUnit2Weight[poseUnitName]
            this.model.setPoseUnit(poseUnitName, weight)
        }
    }

    // take the current face expression pose units and apply them to the skeleton's bone pose nodes
    poseUnitsToPoseNodes() {
        this.applyPoseToPoseUnits(this.getBlendedPose())
    }

    // calculate the blended (combined) pose from all the pose units
    // PoseUnit(AnimationTrack): getBlendedPose(self, poses, weights, additiveBlending=True, only_data=False):
    getBlendedPose(): mat4[] {
        // console.log(`ExpressionManager.getBlendedPose()`)

        const skeleton = this.skeleton
        const base_anim = this.base_anim
        const poses: number[] = []
        const weights: number[] = []
        const additiveBlending = true

        for (const poseUnit of this.model.poseUnits) {
            poses.push(this.poseUnitName2Frame.get(poseUnit.label!)!)
            weights.push(poseUnit.value)
        }

        const f_idxs = poses
        const nBones = skeleton.boneslist!.length

        if (!additiveBlending) {
            throw Error(`yikes`)
        }

        const result: mat4[] = new Array(nBones)

        if (f_idxs.length === 1) {
            throw Error(`yikes`)
        } else {
            const REST_QUAT = quat2.create()

            // iterate over all bones in the skeleton
            for (let b_idx = 0; b_idx < nBones; ++b_idx) {
                // begin with frame 0 and 1
                const m1 = base_anim[f_idxs[0] * nBones + b_idx]
                const m2 = base_anim[f_idxs[1] * nBones + b_idx]

                let q1 = quat2.fromMat4(quat2.create(), m1)
                let q2 = quat2.fromMat4(quat2.create(), m2)

                q1 = quaternion_slerp(REST_QUAT, q1, weights[0])
                q2 = quaternion_slerp(REST_QUAT, q2, weights[1])

                let quat = quat2.multiply(quat2.create(), q2, q1)

                // continue with frame 2 onward
                for (let i = 2; i < f_idxs.length; ++i) {
                    const m = base_anim[f_idxs[i] * nBones + b_idx]
                    let q = quat2.fromMat4(quat2.create(), m)
                    q = quaternion_slerp(REST_QUAT, q, weights[i])
                    quat2.multiply(quat, q, quat)
                }
                result[b_idx] = mat4.fromQuat2(mat4.create(), quat)
            }
        }
        return result
    }

    applyPoseToPoseUnits(blendedPose: mat4[]) {
        for (let boneIdx = 0; boneIdx < this.skeleton.boneslist!.length; ++boneIdx) {
            const bone = this.skeleton.boneslist![boneIdx]
            if (bone.name === "head") {
                continue
            }
            const mrg = bone.matRestGlobal!
            const m = calcWebGL(blendedPose[boneIdx], mrg)
            const poseNode = this.skeleton.poseNodes.find(bone.name)
            if (!poseNode) {
                console.log(`ExpressionManager: no pose node found for bone ${bone.name}`)
                return
            }

            let { x, y, z } = euler_from_matrix(m)
            // enforce zero: looks nicer in the ui and also avoid the math going crazy in some situations
            if (isZero(x)) {
                x = 0
            }
            if (isZero(y)) {
                y = 0
            }
            if (isZero(z)) {
                z = 0
            }

            poseNode.x.value = poseNode.x.default = (x * 360) / (2 * Math.PI)
            poseNode.y.value = poseNode.y.default = (y * 360) / (2 * Math.PI)
            poseNode.z.value = poseNode.z.default = (z * 360) / (2 * Math.PI)
        }
    }
}

export function calcWebGL(poseMat: mat4, matRestGlobal: mat4) {
    // prettier-ignore
    let matPose = mat4.fromValues(
        poseMat[0], poseMat[1], poseMat[2],  0,
        poseMat[4], poseMat[5], poseMat[6],  0,
        poseMat[8], poseMat[9], poseMat[10], 0,
        0,          0,          0,           1  )
    const invRest = mat4.invert(mat4.create(), matRestGlobal)
    const m0 = mat4.multiply(mat4.create(), invRest, matPose)
    mat4.multiply(matPose, m0, matRestGlobal)
    matPose[12] = matPose[13] = matPose[14] = 0
    return matPose
}

const epsilon = 0.00001

function isZero(a: number): boolean {
    return Math.abs(a) <= epsilon
}
function isEqual(a: number, b: number) {
    return isZero(a - b)
}
function eql(a: mat4, b: mat4) {
    for (let i = 0; i < a.length; ++i) {
        if (!isEqual(a[i], b[i])) {
            return false
        }
    }
    return true
}
