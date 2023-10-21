import { ExpressionManager } from "expression/ExpressionManager"
import { Bone } from "skeleton/Bone"
import { mat4 } from "gl-matrix"
import { Skeleton } from "skeleton/Skeleton"
import { PoseUnitsModel } from "./PoseUnitsModel"


export class ExpressionModel extends PoseUnitsModel {
    constructor(expressionManager: ExpressionManager) {
        super()
        const facePoseUnitsNames = expressionManager.facePoseUnitsNames
        const skeleton = expressionManager.skeleton
        this.createPoseUnits(facePoseUnitsNames)
        const faceBones = this.getRelevantBones(skeleton) // specific
        this.observeBones(faceBones, skeleton)
        this.observePoseNodes(expressionManager) // specifig
    }

    override getRelevantBones(skeleton: Skeleton) {
        // all face expression bones
        // (we have to use all below 'head' as face-poseunits.bvh also affects toes, which is a bug i guess)
        const faceBones = new Set<string>()
        foo(skeleton.bones.get("head")!)
        function foo(bone: Bone) {
            faceBones.add(bone.name)
            bone.children.forEach((child) => foo(child))
        }
        return faceBones
    }

    observePoseNodes(expressionManager: ExpressionManager) {
        // ALSO GENERATE OWN CHANGE NOTIFICATION WHEN THOSE MODELS CHANGE!!!
        // register dependencies from pose unit to bone
        const skeleton = expressionManager.skeleton
        const identity = mat4.create()
        const nBones = skeleton.boneslist!.length
        for (const pu of this.poseUnits) {
            const frame = expressionManager.poseUnitName2Frame.get(pu.label!)!
            for (let b_idx = 0; b_idx < nBones; ++b_idx) {
                const m = expressionManager.base_anim[frame * nBones + b_idx]
                if (!mat4.equals(m, identity)) {
                    // if (isPoseUnitBoneUsed(pu.label!, b_idx)) {
                    const bone = skeleton.boneslist![b_idx]!
                    const node = skeleton.poseNodes.find(bone.name)!
                    pu.observe(node.x)
                    pu.observe(node.y)
                    pu.observe(node.z)
                }
            }
        }
    }
}
