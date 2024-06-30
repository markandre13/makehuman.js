import { BoneQuat2 } from "blendshapes/BoneQuat2"
import { MHFacePoseUnits } from "./MHFacePoseUnits"
import { quat2 } from "gl-matrix"
import { isZero } from "mesh/HumanMesh"
import { Bone } from "skeleton/Bone"
import { REST_QUAT } from "UpdateManager"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { BlendshapeToPose } from "./BlendshapeToPose"
import { Skeleton } from "skeleton/Skeleton"
import { Signal } from "toad.js/Signal"

export class BlendshapePose {
    // face poseunit name to weight
    poseUnitWeight = new Map<string, number>()
    //
    boneTransform = new Map<Bone, quat2>()

    toJSON() {
        const poseUnitWeight = {} as any
        for (const [name, weight] of this.poseUnitWeight) {
            poseUnitWeight[name] = weight
        }
        const boneTransform = {} as any
        for (const [bone, q] of this.boneTransform) {
            boneTransform[bone.name] = [q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7]]
        }
        return { poseUnitWeight, boneTransform }
    }

    static fromJSON(skeleton: Skeleton, data: any) {
        const obj = new BlendshapePose()
        for(const name of Object.getOwnPropertyNames(data.poseUnitWeight)) {
            obj.poseUnitWeight.set(name, data.poseUnitWeight[name])
        }
        for(const name of Object.getOwnPropertyNames(data.boneTransform)) {
            const q = data.boneTransform[name] as number[]
            obj.boneTransform.set(skeleton.getBone(name), quat2.fromValues(q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7]))
        }
        
        return obj
    }
}

export class BlendshapeToPoseConfig extends Map<string, BlendshapePose> {
    modified = new Signal()
    toJSON() {
        const out = {} as any
        for (const [blendshapeName, pose] of this) {
            if (blendshapeName === "_neutral") {
                continue
            }
            out[blendshapeName] = pose.toJSON()
        }
        return out
    }

    static fromJSON(skeleton: Skeleton, data: any) {
        const obj = new BlendshapeToPoseConfig()
        for(const name of Object.getOwnPropertyNames(data)) {
            obj.set(name, BlendshapePose.fromJSON(skeleton, data[name]))
        }
        return obj
    }

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
