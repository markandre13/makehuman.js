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
            .parse(FileSystemAdapter.getInstance().readFile("data/poseunits/face-poseunits.json"))
            .framemapping as string[]
        this.facePoseUnitsNames.forEach((name, index) => this.poseUnitName2Frame.set(name, index))

        this.expressions = FileSystemAdapter.getInstance()
            .listDir("expressions")
            .filter(filename => filename.endsWith(".mhpose"))
            .map(filename => filename.substring(0, filename.length - 7))
    }

    setExpression(expression: number | string, poseNodes: PoseNode) {
        this.fromPoseUnit(expression)
    }

    fromPoseUnit(expression: number | string): mat4[] {
        if (typeof expression === "string") {
            const name = expression
            expression = this.expressions.findIndex(e => e === name)
            if (expression === -1) {
                throw Error(`'${name} is not a known expression'`)
            }
        }

        const expressionName = this.expressions[expression]
        const unit_poses = expression = JSON.parse(FileSystemAdapter.getInstance().readFile(`data/expressions/${expressionName}.mhpose`))
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

    // calculateExpression(expression: number) {
    //     const expressionName = this.expressions[expression]
    //     const unit_poses = expression = JSON.parse(FileSystemAdapter.getInstance().readFile(`data/expressions/${expressionName}.mhpose`))
    //         .unit_poses as any

    //     const facePose = new Map<string, number[]>()
    //     for (let prop of Object.getOwnPropertyNames(unit_poses)) {
    //         const value = unit_poses[prop]
    //         const frame = this.poseUnitName2Frame.get(prop)!!
    //         // console.log(`${prop} (${frame}) = ${value}`)
    //         for (const joint of this.facePoseUnits.bvhJoints) {
    //             if (joint.name === "End effector") {
    //                 continue
    //             }
    //             const start = frame * joint.channels.length
    //             const rotation = [
    //                 value * joint.frames[start],
    //                 value * joint.frames[start + 1],
    //                 value * joint.frames[start + 2]
    //             ] as number[]

    //             let r = facePose.get(joint.name)
    //             if (r === undefined) {
    //                 r = [0, 0, 0]
    //                 facePose.set(joint.name, r)
    //             }
    //             // console.log(`rotate joint ${joint.name} by [${rotation[0]}, ${rotation[1]}, ${rotation[2]}]`)
    //             r[0] -= rotation[0]
    //             r[1] -= rotation[1]
    //             r[2] -= rotation[2]
    //         }
    //     }
    //     return facePose
    // }

    // applyExpression(expression: number, poseNodes: PoseNode) {
    //     //
    //     // calculate face pose from expression
    //     //
    //     const facePose = this.calculateExpression(expression)

    //     //
    //     // copy final rotation to pose
    //     //
    //     function d(num: number) {
    //         return Math.round((num + Number.EPSILON) * 1000000) / 1000000
    //     }

    //     function applyToPose(node: PoseNode | undefined) {
    //         if (node === undefined) {
    //             return
    //         }
    //         if (node.bone.name !== "head") {
    //             let r = facePose.get(node.bone.name)
    //             if (r === undefined) {
    //                 r = [0, 0, 0]
    //             }

    //             // const pm = mat4.create()
    //             // let pmIdx = node.bone.index * 12
    //             // for (let j = 0; j < 12; ++j) {
    //             //     pm[j] = laugh01_IN[pmIdx++]
    //             // }
    //             // mat4.transpose(pm, pm)
    //             // let out = pm

    //             let out = mat4.create()
    //             let tmp = mat4.create()
    //             mat4.multiply(out, out, mat4.fromXRotation(tmp, -r[0] / 360 * 2 * Math.PI))
    //             mat4.multiply(out, out, mat4.fromYRotation(tmp, -r[1] / 360 * 2 * Math.PI))
    //             mat4.multiply(out, out, mat4.fromZRotation(tmp, -r[2] / 360 * 2 * Math.PI))

    //             let out2 = calcWebGL(out, node.bone.matRestGlobal!)
    //             node.bone.matPose = out2

    //             // const { x, y, z } = toEuler(out2)
    //             // this.bone.matPose = out

    //             // if (node.bone.name === "jaw") {
    //             //     console.log("JAW")
    //             //     console.log(mrg)
    //             //     console.log(r)
    //             //     console.log(out)
    //             // }

    //             // node.x.value = x / (2 * Math.PI) * 360
    //             // node.y.value = y / (2 * Math.PI) * 360
    //             // node.z.value = z / (2 * Math.PI) * 360
    //             const e = 0.00003
    //             // if (Math.abs(r[0]) > e || Math.abs(r[1]) > e || Math.abs(r[2]) > e) {
    //             //     console.log(`${node.bone.name} := [${d(r[0])}, ${d(r[1])}, ${d(r[2])}] (${x}, ${y}, ${z})`)
    //             // }
    //         }
    //         applyToPose(node.next)
    //         applyToPose(node.down)
    //     }
    //     applyToPose(poseNodes.find("head"))
    // }
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