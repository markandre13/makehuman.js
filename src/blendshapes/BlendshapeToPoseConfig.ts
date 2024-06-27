import { BoneQuat2 } from "blendshapes/BoneQuat2"
import { MHFacePoseUnits } from "./MHFacePoseUnits"
import { quat2 } from "gl-matrix"
import { isZero } from "mesh/HumanMesh"
import { Bone } from "skeleton/Bone"
import { REST_QUAT } from "UpdateManager"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { BlendshapeToPose } from "./BlendshapeToPose"

export class BlendshapePose {
    // face poseunit name to weight
    poseUnitWeight = new Map<string, number>()
    // 
    boneTransform = new Map<Bone, quat2>()
}

export class BlendshapeToPoseConfig extends Map<string, BlendshapePose> {

    convert(poseunits: MHFacePoseUnits, out: BlendshapeToPose) {
        for (const [blendshapeName, cfg] of this) {
            const mapOut = new Map<Bone, quat2>()

            // add pose units to mapOut
            for (const [poseUnitName, weight] of cfg.poseUnitWeight) {
                if (!isZero(weight)) {
                    const bone2quats = poseunits.blendshape2bone.get(poseUnitName)!
                    for (const bq of bone2quats) {
                        const q = quaternion_slerp(REST_QUAT, bq.q, weight)
                        const outQ = mapOut.get(bq.bone)
                        if (outQ === undefined) {
                            mapOut.set(bq.bone, q)
                        } else {
                            quat2.multiply(outQ, q, outQ)
                        }
                    }
                }
            }

            // add bone transform to mapOut
            cfg.boneTransform.forEach((q, bone) => {
                const outQ = mapOut.get(bone)
                if (outQ === undefined) {
                    mapOut.set(bone, q)
                } else {
                    quat2.multiply(outQ, q, outQ)
                }
            })

            // convert mapOut to array
            const arrayOut: BoneQuat2[] = []
            mapOut.forEach((q, bone) => {
                arrayOut.push({ bone, q })
            })

            out.set(blendshapeName, arrayOut)
        }
    }
}
