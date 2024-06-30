import { calcWebGL } from "expression/calcWebGL"
import { mat4, quat2 } from "gl-matrix"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { isZero } from "mesh/HumanMesh"
import { BlendshapeToPose } from "./BlendshapeToPose"
import { REST_QUAT } from "UpdateManager"
import { BlendshapeModel } from "./BlendshapeModel"
import { Skeleton } from "skeleton/Skeleton"
import { IBlendshapeConverter } from "./IBlendshapeConverter"

export class Blendshape2PoseConverter implements IBlendshapeConverter {
    private blendshape2pose: BlendshapeToPose

    constructor(
        blendshape2pose: BlendshapeToPose,
    ) {
        this.blendshape2pose = blendshape2pose
    }

    /**
     * Apply the weights in the BlendshapeModel to the Skeleton using the mapping
     * in BlendshapeToPose
     */
    convert(blendshapeModel: BlendshapeModel, skeleton: Skeleton) {
        const ql = new Array<quat2 | undefined>(skeleton.boneslist!.length)
        ql.fill(undefined)
        blendshapeModel.forEach((name, weight) => {
            const boneQuatList = this.blendshape2pose!.get(name)
            if (boneQuatList === undefined) {
                // console.log(`could not find ${name}`)
                return
            }
            // tweaks for mediapipe
            // if (name === "mouthFunnel") {
            //     weight *= 2.5
            // }
            // if (name === "jawOpen") {
            //     weight *= 1.5
            // }
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
                const bone = skeleton.boneslist![i]
                bone.matPose = calcWebGL(poseMat, bone.matRestGlobal!)
            } else {
                mat4.identity(skeleton.boneslist![i].matPose)
            }
        })

    }
}
