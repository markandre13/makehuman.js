import { mat4, quat2 } from "gl-matrix"
import { BoneQuat2 } from "blendshapes/BoneQuat2"
import { Skeleton } from "skeleton/Skeleton"
import { AnimationTrack, BiovisionHierarchy } from "lib/BiovisionHierarchy"
import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { poseUnit2matPose } from "./Blendshape2PoseConverter"

export enum PoseUnit2MatPose {
    /**
     * convert pose unit to matPose when pose units are loaded, substracting
     * influence from the initial morph (TODO: might as well be the matRestGlobal
     * from the BVH file?)
     */
    ONLOAD,
    /**
     * classic MakeHuman: convert pose unit to matPose after blending all pose units
     * together, substracting influence from the current morph
     * (TODO: this one currently looks slightly better?)
     */
    ONBLEND,
}

export let poseUnit2mapPose: PoseUnit2MatPose = PoseUnit2MatPose.ONLOAD

/**
 * MakeHuman's face pose units (blendshapes)
 */
export class MHFacePoseUnits {
    private static _blendshape2bone: Map<string, BoneQuat2[]>
    private static _animationTrack: mat4[]
    private static _poseUnitName2Frame: Map<string, number>

    blendshape2bone: Map<string, BoneQuat2[]>

    constructor(skeleton: Skeleton) {
        if (MHFacePoseUnits._blendshape2bone !== undefined) {
            this.blendshape2bone = MHFacePoseUnits._blendshape2bone
        } else {
            this.blendshape2bone = MHFacePoseUnits._blendshape2bone = new Map()

            const facePoseUnits = new BiovisionHierarchy().fromFile("data/poseunits/face-poseunits.bvh", "auto", "none")
            MHFacePoseUnits._animationTrack = facePoseUnits.createAnimationTrack(
                skeleton,
                "Expression-Face-PoseUnits"
            ).data

            const facePoseUnitsNames = JSON.parse(FileSystemAdapter.readFile("data/poseunits/face-poseunits.json"))
                .framemapping as string[]

            MHFacePoseUnits._poseUnitName2Frame = new Map<string, number>()
            facePoseUnitsNames.forEach((name, index) => MHFacePoseUnits._poseUnitName2Frame.set(name, index))

            this.setBlendshape2Bone(skeleton)
        }
    }

    setBlendshape2Bone(skeleton: Skeleton) {
        const identity = mat4.create()
        const nBones = skeleton.boneslist!.length

        for (let [name, frame] of MHFacePoseUnits._poseUnitName2Frame) {
            const list: BoneQuat2[] = []
            for (let b_idx = 0; b_idx < nBones; ++b_idx) {
                let m = MHFacePoseUnits._animationTrack[frame * nBones + b_idx]

                if (poseUnit2mapPose == PoseUnit2MatPose.ONLOAD) {
                    m = poseUnit2matPose(m, skeleton.boneslist![b_idx].matRestGlobal!)
                }

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
