import { BoneQuat2 } from "blendshapes/BoneQuat2"
import { MHFacePoseUnits } from "./MHFacePoseUnits"
import { quat2 } from "gl-matrix"
import { blendshapeNames } from "mediapipe/blendshapeNames"
import { isZero } from "mesh/HumanMesh"
import { Bone } from "skeleton/Bone"
import { REST_QUAT } from "UpdateManager"
import { quaternion_slerp } from "lib/quaternion_slerp"

class BlendshapeSetConfig {
    blendshapes = new Map<string, BlendshapeConfig>()
}

class BlendshapeConfig {
    poseUnitWeight = new Map<string, number>()
    boneTransform = new Map<string, quat2>()
}

function makeDefaultBlendshapeSetConfig() {
    const blendshapeSet = new BlendshapeSetConfig()
    for(const blendshapeName of blendshapeNames) {
        const cfg = new BlendshapeConfig()
        const poseUnitName = blendshape2poseUnit.get(blendshapeName)
        if (poseUnitName !== undefined) {
            cfg.poseUnitWeight.set(poseUnitName, 1)
        }
        blendshapeSet.blendshapes.set(blendshapeName, cfg)
    }
    return blendshapeSet
}

/**
 * Take MakeHuman's face pose units and remap them to ARKit's blendshape names.
 * 
 * This is not a perfect mapping but serves as a demo and starting point for further
 * refinements.
 */
export class MHFaceBlendshapes {
    blendshape2bone = new Map<string, BoneQuat2[]>()
    // poseunits: MHFacePoseUnits

    constructor(poseunits: MHFacePoseUnits) {
        const cfgset = makeDefaultBlendshapeSetConfig()
        for(const [blendshapeName, cfg] of cfgset.blendshapes) {

            const mapOut = new Map<Bone, quat2>()
            for(const [poseUnitName, weight] of cfg.poseUnitWeight) {
                if (!isZero(weight)) {
                    const bone2quats = poseunits.blendshape2bone.get(poseUnitName)!
                    for(const bq of bone2quats) {
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

            // TODO: also add boneTransform to mapOut

            const arrayOut: BoneQuat2[] = []
            mapOut.forEach((q, bone) => {
                arrayOut.push({bone, q})
            })

            this.blendshape2bone.set(blendshapeName, arrayOut)
        }
        // this.poseunits = poseunits
        // poseunits.blendshape2bone.forEach( (quat2s, name) => {
        //     for (let pair of blendshape2poseUnit) {
        //         if (pair[1] === name) {
        //             this.blendshape2bone.set(pair[0], quat2s)
        //         }
        //     }
        // })
    }
}

// map some Google Mediapipe/Apple ARKit face blendshape names to Makehuman Face Poseunit names
// ideally, we would need new poseunits matching the blendshapes
// TODO:
// [ ] render the real blendshapes
//   [ ] render the mediapipe mesh
//   [ ] create morphtargets for the mediapipe blendshapes
//   [ ] apply the morphtargets using the mediapipe blendshape coefficnets
// [ ] create a tool to create custom poseunits (with the blendshapes we try
//     to approximate also shown)
// [ ] create a tool to manage custom pose unit sets
const blendshape2poseUnit = new Map<string, string>([
    // makehuman's skeleton can not move the outer eyebrows
    ["browDownLeft", "LeftBrowDown"], // actually the whole brow but pose unit is only inside
    ["browDownRight", "RightBrowDown"], // (see above)
    // ["browInnerUp", "LeftInnerBrowUp"], // missing: plus RightInnerBrowUp
    ["browOuterUpLeft", "LeftOuterBrowUp"],
    ["browOuterUpRight", "RightOuterBrowUp"],

    ["cheekSquintRight", "RightCheekUp"],
    ["cheekSquintLeft", "LeftCheekUp"],

    ["eyeBlinkLeft", "LeftUpperLidClosed"],
    ["eyeBlinkRight", "RightUpperLidClosed"],
    ["eyeLookDownLeft", "LeftEyeDown"],
    ["eyeLookDownRight", "RightEyeDown"],
    ["eyeLookInLeft", "LeftEyeturnRight"],
    ["eyeLookInRight", "RightEyeturnLeft"],
    ["eyeLookOutLeft", "LeftEyeturnLeft"],
    ["eyeLookOutRight", "RightEyeturnRight"],
    ["eyeLookUpLeft", "LeftEyeUp"],
    ["eyeLookUpRight", "RightEyeUp"],
    // ["eyeSquintLeft", ""],
    // ["eyeSquintRight", ""],
    ["eyeWideLeft", "LeftUpperLidOpen"],
    ["eyeWideRight", "RightUpperLidOpen"],
    ["jawForward", "ChinForward"],

    // these are kind of okay
    ["jawOpen", "JawDrop"],
    ["jawRight", "ChinRight"],
    ["jawLeft", "ChinLeft"],
    ["mouthRight", "MouthMoveRight"],
    ["mouthLeft", "MouthMoveLeft"],

    // ["mouthClose", ""],
    ["mouthDimpleLeft", "MouthLeftPullSide"],
    ["mouthDimpleRight", "MouthRightPullSide"],

    ["cheekPuff", "CheeksPump"],
    ["mouthFunnel", "LipsKiss"],

    // ["mouthPucker", "UpperLipForward"], // FIXME: should be less and also the lower lip

    ["mouthRollLower", "lowerLipBackward"],
    ["mouthRollUpper", "UpperLipBackward"],
    ["mouthShrugLower", "lowerLipUp"], // lower lip up
    ["mouthShrugUpper", "UpperLipUp"], // upper lip up

    ["mouthSmileLeft", "MouthLeftPullUp"],
    ["mouthSmileRight", "MouthRightPullUp"],
    // ["mouthPressLeft", ""],
    // ["mouthPressRight", ""],
    ["mouthDimpleLeft", "MouthLeftPullSide"],
    ["mouthDimpleRight", "MouthRightPullSide"],
    ["mouthStretchLeft", "MouthLeftPullDown"],
    ["mouthStretchRight", "MouthRightPullDown"],
    ["mouthFrownLeft", "MouthLeftPlatysma"],
    ["mouthFrownRight", "MouthRightPlatysma"],

    // ["mouthLowerDownLeft", ""],
    // ["mouthLowerDownRight", ""],
    // ["mouthUpperUpLeft", ""], // no match
    // ["mouthUpperUpRight", ""],

    // ["noseSneerLeft", "NoseWrinkler"], // plus NasolabialDeepener and then split them into a left and right side
    ["noseSneerRight", "NasolabialDeepener"],

    ["tongueOut", "TongueOut"],
])
