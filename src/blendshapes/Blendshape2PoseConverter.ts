import { mat4, quat2, vec3 } from "gl-matrix"
import { quaternion_slerp } from "lib/quaternion_slerp"
import { isZero } from "mesh/HumanMesh"
import { REST_QUAT } from "UpdateManager"
import { BlendshapeModel } from "./BlendshapeModel"
import { Skeleton } from "skeleton/Skeleton"
import { IBlendshapeConverter } from "./IBlendshapeConverter"
import { poseUnit2mapPose, PoseUnit2MatPose } from "./MHFacePoseUnits"
import { Application } from "Application"

export class Blendshape2PoseConverter implements IBlendshapeConverter {
    app: Application

    constructor(app: Application) {
        this.app = app
    }

    /**
     * Apply the weights in the BlendshapeModel to the Skeleton using the mapping
     * in BlendshapeToPose
     */
    applyToSkeleton(blendshapeModel: BlendshapeModel) {
        const ql = new Array<quat2 | undefined>(this.app.skeleton.boneslist!.length)
        ql.fill(undefined)
        blendshapeModel.forEach((blendshapeName, weight) => {
            const boneQuatList = this.app.blendshape2pose!.get(blendshapeName)
            if (boneQuatList === undefined) {
                // console.log(`could not find ${name}`)
                return
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
        // * at weight 0, the pose the one we got from the morph
        // * at weight 1, the pose is not adjusted to the morph
        //   but taken as is from the pose unit file

        ql.forEach((q, i) => {
            const bone = this.app.skeleton.boneslist![i]
            if (q !== undefined) {
                switch (poseUnit2mapPose) {
                    case PoseUnit2MatPose.ONBLEND:
                        const poseMat = mat4.fromQuat2(mat4.create(), q)
                        bone.matUserPoseRelative = poseUnit2matPose(poseMat, bone.matRestGlobal!)
                        break
                    case PoseUnit2MatPose.ONLOAD:
                        bone.matUserPoseRelative = mat4.fromQuat2(mat4.create(), q)
                        break
                }
            } else {
                mat4.identity(bone.matUserPoseRelative!)
            }
        })

        // TODO: i'm not quite sure how the slerp, poseUnit2matPose stuff goes all together
        //       but i guess that we want the additional bone rotation to be part of it
        //       that means, the additional bone transformation needs to be added later
        blendshapeModel.forEach((blendshapeName, weight) => {
            const boneTransform = this.app.blendshapeToPoseConfig!.get(blendshapeName)?.boneTransform
            if (boneTransform === undefined) {
                return
            }
            boneTransform.forEach((q2, bone) => {
                // get the translation from quat2
                const t = quat2.getTranslation(vec3.create(), q2)
                // multiply by weight
                vec3.scale(t, t, weight)
                // add to bone
                mat4.translate(bone.matUserPoseRelative!, bone.matUserPoseRelative!, t)
            })
        })
    }
}

// what we want to do now, is move the call to poseUnit2matPose()
// BlendshapePose.convert() or earlier, so that BlendshapePose.boneTransform
// get's the ability to translate bones (which we might need for the mouth)
// START THIS CHANGE WITH TESTS!!!

/**
 * pose units are in global coordinates. remove translation and set relative to rest pose
 */
export function poseUnit2matPose(poseMat: mat4, matRestGlobal: mat4): mat4 {
    // prettier-ignore
    let matPose = mat4.clone(poseMat)
    // let matPose = mat4.fromValues(
    //     poseMat[0], poseMat[1], poseMat[2],  0,
    //     poseMat[4], poseMat[5], poseMat[6],  0,
    //     poseMat[8], poseMat[9], poseMat[10], 0,
    //     0,          0,          0,           1  )
    const invRest = mat4.invert(mat4.create(), matRestGlobal)
    const m0 = mat4.multiply(mat4.create(), invRest, matPose)
    mat4.multiply(matPose, m0, matRestGlobal)
    matPose[12] = matPose[13] = matPose[14] = 0
    // matPose[12] = poseMat[12]
    // matPose[13] = poseMat[13]
    // matPose[14] = poseMat[14]
    return matPose
}
