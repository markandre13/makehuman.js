import { ExpressionManager } from "expression/ExpressionManager"
import { mat4, quat2 } from "gl-matrix"
import { BoneQuat2 } from "blendshapes/BoneQuat2"

export class ExpressionManager2 {
    blendshape2bone = new Map<string, BoneQuat2[]>()

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
                        this.blendshape2bone.set(pair[0], list)
                        // console.log(`set blendshape ${name}`)
                    }
                }
            }
        }
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
export const blendshape2poseUnit = new Map<string, string>([
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
