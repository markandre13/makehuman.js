import { PoseNode } from 'ui/poseView'
import { FileSystemAdapter } from './filesystem/FileSystemAdapter'
import { BiovisionHierarchy } from 'lib/BiovisionHierarchy'
import { mat4, quat2 } from 'gl-matrix'
import { quaternion_slerp } from 'lib/quaternion_slerp'
import { Skeleton } from 'skeleton/Skeleton'

export class ExpressionManager {
    facePoseUnits: BiovisionHierarchy               // BVH file with face pose units
    skeleton: Skeleton
    base_anim: mat4[]                               // face pose units as mat4[] (joints x pose units)
    facePoseUnitsNames: string[]                    // poseunit_names
    poseUnitName2Frame = new Map<string, number>();
    expressions: string[]                           // list of predefined expressions

    constructor(skeleton: Skeleton) {
        // TODO: check if some of the json files contain some of the filenames being hardcoded here
        this.facePoseUnits = new BiovisionHierarchy('data/poseunits/face-poseunits.bvh', 'auto', 'none')
        this.skeleton = skeleton
        this.base_anim = this.facePoseUnits.createAnimationTrack(skeleton, "Expression-Face-PoseUnits")

        this.facePoseUnitsNames = JSON
            .parse(FileSystemAdapter.readFile("data/poseunits/face-poseunits.json"))
            .framemapping as string[]
        this.facePoseUnitsNames.forEach((name, index) => this.poseUnitName2Frame.set(name, index))

        this.expressions = FileSystemAdapter
            .listDir("expressions")
            .filter(filename => filename.endsWith(".mhpose"))
            .map(filename => filename.substring(0, filename.length - 7))
    }

    setExpression(expression: number | string, poseNodes: PoseNode) {
        this.fromPoseUnit(expression)
    }

    // OO: do not return a value (pose name and weight is what we want to display)
    fromPoseUnit(expression: number | string): mat4[] {
        if (typeof expression === "string") {
            const name = expression
            expression = this.expressions.findIndex(e => e === name)
            if (expression === -1) {
                throw Error(`'${name} is not a known expression'`)
            }
        }

        const expressionName = this.expressions[expression]
        const unit_poses = expression = JSON.parse(FileSystemAdapter.readFile(`data/expressions/${expressionName}.mhpose`))
            .unit_poses as any

        const poses: number[] = []
        const weights: number[] = []
        for (let poseName of Object.getOwnPropertyNames(unit_poses)) {
            poses.push(this.poseUnitName2Frame.get(poseName)!)
            weights.push(unit_poses[poseName])
        }

        return this.getBlendedPose(this.skeleton, this.base_anim, poses, weights)
    }

    // PoseUnit(AnimationTrack): getBlendedPose(self, poses, weights, additiveBlending=True, only_data=False):
    getBlendedPose(
        skeleton: Skeleton,
        base_anim: mat4[],
        poses: number[],
        weights: number[],
        additiveBlending = true
    ): mat4[] {
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

            for (let b_idx = 0; b_idx < nBones; ++b_idx) {
                const m1 = base_anim[f_idxs[0] * nBones + b_idx]
                const m2 = base_anim[f_idxs[1] * nBones + b_idx]

                let q1 = quat2.fromMat4(quat2.create(), m1)
                let q2 = quat2.fromMat4(quat2.create(), m2)

                q1 = quaternion_slerp(REST_QUAT, q1, weights[0])
                q2 = quaternion_slerp(REST_QUAT, q2, weights[1])

                let quat = quat2.multiply(quat2.create(), q2, q1)

                for (let i = 2; i < f_idxs.length; ++i) {
                    const m = base_anim[f_idxs[i] * nBones + b_idx]
                    let q = quat2.fromMat4(quat2.create(), m)
                    q = quaternion_slerp(REST_QUAT, q, weights[i])
                    quat = quat2.multiply(quat2.create(), q, quat)
                }
                result[b_idx] = mat4.fromQuat2(mat4.create(), quat)
            }
        }
        return result
    }
}

export function calcWebGL(poseMat: mat4, matRestGlobal: mat4) {
    let matPose = mat4.fromValues(
        poseMat[0], poseMat[1], poseMat[2], 0,
        poseMat[4], poseMat[5], poseMat[6], 0,
        poseMat[8], poseMat[9], poseMat[10], 0,
        0, 0, 0, 1
    )
    const invRest = mat4.invert(mat4.create(), matRestGlobal)
    const m0 = mat4.multiply(mat4.create(), invRest, matPose)
    mat4.multiply(matPose, m0, matRestGlobal)
    matPose[12] = matPose[13] = matPose[14] = 0
    return matPose
}