import { ExpressionManager, calcWebGL } from "expression/ExpressionManager"
import { mat4, quat2 } from "gl-matrix"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { isZero } from "mesh/HumanMesh"
import { ExpressionManager2 } from "blendshapes/ExpressionManager2"
import { REST_QUAT } from "UpdateManager"
import { BlendshapeModel } from "./BlendshapeModel"

export class BlendshapeConverter {
    private blendshapeModel: BlendshapeModel
    private expressionManager: ExpressionManager
    private em2?: ExpressionManager2

    constructor(blendshapeModel: BlendshapeModel, expressionManager: ExpressionManager) {
        this.blendshapeModel = blendshapeModel
        this.expressionManager = expressionManager
    }

    convert() {
        if (this.em2 === undefined) {
            this.em2 = new ExpressionManager2(this.expressionManager)
        }
        const ql = new Array<quat2 | undefined>(this.expressionManager.skeleton.boneslist!.length)
        this.blendshapeModel.forEach((name, weight) => {
            const boneQuatList = this.em2!.blendshape2bone.get(name)
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
                const bone = this.expressionManager.skeleton.boneslist![i]
                bone.matPose = calcWebGL(poseMat, bone.matRestGlobal!)
            } else {
                mat4.identity(this.expressionManager.skeleton.boneslist![i].matPose)
            }
        })

    }
}
