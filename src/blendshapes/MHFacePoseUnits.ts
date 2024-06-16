import { mat4, quat2 } from "gl-matrix"
import { BoneQuat2 } from "blendshapes/BoneQuat2"
import { Skeleton } from "skeleton/Skeleton"
import { BiovisionHierarchy } from "lib/BiovisionHierarchy"
import { FileSystemAdapter } from "filesystem/FileSystemAdapter"

/**
 * MakeHuman's face pose units (blendshapes)
 */
export class MHFacePoseUnits {
    blendshape2bone = new Map<string, BoneQuat2[]>();

    constructor(skeleton: Skeleton) {
        const facePoseUnits = new BiovisionHierarchy().fromFile("data/poseunits/face-poseunits.bvh", "auto", "none")
        const animationTrack = facePoseUnits.createAnimationTrack(skeleton, "Expression-Face-PoseUnits").data

        const facePoseUnitsNames = JSON.parse(FileSystemAdapter.readFile("data/poseunits/face-poseunits.json"))
            .framemapping as string[]
        const poseUnitName2Frame = new Map<string, number>()
        facePoseUnitsNames.forEach((name, index) => poseUnitName2Frame.set(name, index))

        const identity = mat4.create()
        const nBones = skeleton.boneslist!.length

        for (let [name, frame] of poseUnitName2Frame) {
            const list: BoneQuat2[] = []
            for (let b_idx = 0; b_idx < nBones; ++b_idx) {
                const m = animationTrack[frame * nBones + b_idx]
                if (!mat4.equals(identity, m)) {
                    list.push({
                        bone: skeleton.boneslist![b_idx],
                        q: quat2.fromMat4(quat2.create(), m),
                    })
                }
            }
            if (list.length !== 0) {
                this.blendshape2bone.set(name, list)
            }
        }
    }
}
