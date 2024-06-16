import { Bone } from "skeleton/Bone"
import { mat4, quat, quat2 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { PoseUnitsModel } from "../expression/PoseUnitsModel"
import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { NumberRelModel } from "expression/NumberRelModel"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { calcWebGL } from "expression/calcWebGL"
import { euler_from_matrix } from "lib/euler_matrix"
import { isZero } from "mesh/HumanMesh"

interface BodyPoseUnits {
    name: string
    poses: any
}

export class PoseModel extends PoseUnitsModel {

    skeleton: Skeleton
    base_anim: mat4[] = []
    poseUnitName2Frame = new Map<string, number>()

    constructor(skeleton: Skeleton) {
        super()

        this.skeleton = skeleton

        const bones = this.getRelevantBones(skeleton)

        const poseUnitNames: string[] = []

        const poseunits: BodyPoseUnits = JSON.parse(FileSystemAdapter.readFile("data/poseunits/body-poseunits.json"))

        // NOTE: see also facePoseUnits.createAnimationTrack(skeleton, "Expression-Face-PoseUnits")
        const identity = mat4.create()
        for (let poseUnitName of Object.getOwnPropertyNames(poseunits.poses)) {
            poseUnitNames.push(poseUnitName)
        }

        // const facePoseUnitsNames = expressionManager.facePoseUnitsNames
        // const skeleton = expressionManager.skeleton
        this.createPoseUnits(poseUnitNames)

        const poseUnitName2Model = new Map<string, NumberRelModel>()
        for(const x of this.poseUnits) {
            poseUnitName2Model.set(x.label!, x)
        }

        for (let poseUnitName of Object.getOwnPropertyNames(poseunits.poses)) {
            const pose = poseunits.poses[poseUnitName]
            const pu = poseUnitName2Model.get(poseUnitName)!
            this.poseUnitName2Frame.set(poseUnitName, this.poseUnitName2Frame.size)
            const frameIndex = this.base_anim.length
            this.base_anim.push(...new Array(skeleton.getBones().length).fill(identity)) // TODO: maybe without face bones?

            // rather do it the other way around, we seem to have bone names in body-postunit.json which
            // are not in the skeleton, e.g. heel instead of foot? platysma03.L?

            // could find out the history of it, tweak it or just come up with my own solution

            for (const bone of skeleton.getBones()) {
                const xyzw: number[] = pose[bone.name]
                if (xyzw === undefined) {
                    continue
                }
                const q = quat.fromValues(xyzw[0], xyzw[1], xyzw[2], xyzw[3])
                this.base_anim[frameIndex + bone.index] = mat4.fromQuat(mat4.create(), q)

                const node = skeleton.poseNodes.find(bone.name)!
                pu.observe(node.x)
                pu.observe(node.y)
                pu.observe(node.z)
            }
        }

        this.observeBones(bones, skeleton)
        // this.observePoseNodes(expressionManager) // specific
    }

    override getRelevantBones(skeleton: Skeleton): Set<string> {
                // all face expression bones
        // (we have to use all below 'head' as face-poseunits.bvh also affects toes, which is a bug i guess)
        const faceBones = new Set<string>()
        foo(skeleton.bones.get("root")!)
        function foo(bone: Bone) {
            faceBones.add(bone.name)
            if (bone.name === "head") {
                return
            }
            bone.children.forEach((child) => foo(child))
        }
        return faceBones
        // throw new Error("Method not implemented.")
    }

    //
    // TODO: BELOW IS COPY'N PASTED FROM EXPRESSION MANAGER
    //

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

        for (const poseUnit of this.poseUnits) {
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
                console.log(`PoseModel: no pose node found for bone ${bone.name}`)
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
