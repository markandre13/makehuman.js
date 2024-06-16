import { calcWebGL } from "expression/ExpressionManager"
import { mat4, quat2 } from "gl-matrix"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { isZero } from "mesh/HumanMesh"
import { MHFaceBlendshapes } from "blendshapes/MHFaceBlendshapes"
import { REST_QUAT } from "UpdateManager"
import { BlendshapeModel } from "./BlendshapeModel"
import { MHFacePoseUnits } from "./MHFacePoseUnits"
import { Skeleton } from "skeleton/Skeleton"

export class BlendshapeConverter {
    private blendshapeModel: BlendshapeModel
    private skeleton: Skeleton
    private blendshapes2quat2s?: MHFaceBlendshapes

    constructor(blendshapeModel: BlendshapeModel, skeleton: Skeleton) {
        this.blendshapeModel = blendshapeModel
        this.skeleton = skeleton
    }

    convert() {
        if (this.blendshapes2quat2s === undefined) {
            this.blendshapes2quat2s = new MHFaceBlendshapes(new MHFacePoseUnits(this.skeleton))
        }
        const ql = new Array<quat2 | undefined>(this.skeleton.boneslist!.length)
        this.blendshapeModel.forEach((name, weight) => {
            const boneQuatList = this.blendshapes2quat2s!.blendshape2bone.get(name)
            if (boneQuatList === undefined) {
                // console.log(`could not find ${name}`)
                return
            }
            // tweaks for mediapipe
            // if (name === "mouthFunnel") {
            //     weight *= 2.5
            // }
            if (name === "jawOpen") {
                weight *= 1.5
            }
            if (isZero(weight)) {
                return
            }
            // console.log(`${name} has weight ${weight}`)
            for (let bq of boneQuatList) {
                const q = quaternion_slerp(REST_QUAT, bq.q, weight)
                if (ql[bq.bone.index] === undefined) {
                    ql[bq.bone.index] = q
                } else {
                    quat2.multiply(ql[bq.bone.index]!, q, ql[bq.bone.index]!)
                }
            }
        })
        // copy to skeleton
        ql.forEach((q, i) => {
            if (q !== undefined) {
                const poseMat = mat4.fromQuat2(mat4.create(), q)
                const bone = this.skeleton.boneslist![i]
                bone.matPose = calcWebGL(poseMat, bone.matRestGlobal!)
            } else {
                mat4.identity(this.skeleton.boneslist![i].matPose)
            }
        })

    }
}
