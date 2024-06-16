import { ExpressionManager } from "expression/ExpressionManager"
import { mat4, quat2 } from "gl-matrix"
import { blendshape2poseUnit } from "net/Frontend_impl"
import { BoneQuat2 } from "blendshapes/BoneQuat2"

export class ExpressionManager2 {
    blendshapes = new Map<string, BoneQuat2[]>();
    constructor(expressionManager: ExpressionManager) {
        // convert the BVH file data in ExpressionManager into a simplified data structure with quaternions
        const identity = mat4.create()
        const skeleton = expressionManager.skeleton
        const base_anim = expressionManager.base_anim
        const nBones = skeleton.boneslist!.length
        for (let [name, frame] of expressionManager.poseUnitName2Frame) {
            const list: BoneQuat2[] = []
            for (let b_idx = 0; b_idx < nBones; ++b_idx) {
                const m = base_anim[frame * nBones + b_idx]
                if (!mat4.equals(identity, m)) {
                    list.push({
                        bone: skeleton.boneslist![b_idx],
                        q: quat2.fromMat4(quat2.create(), m),
                    })
                }
            }
            if (list.length !== 0) {
                for (let pair of blendshape2poseUnit) {
                    if (pair[1] === name) {
                        this.blendshapes.set(pair[0], list)
                        // console.log(`set blendshape ${name}`)
                    }
                }
            }
        }
    }
}
