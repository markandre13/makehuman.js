import { ORB } from "corba.js"
import { Backend } from "net/makehuman_stub"
import { Frontend as Frontend_skel } from "net/makehuman_skel"
import { MotionCaptureEngine, MotionCaptureType } from "net/makehuman"
import { UpdateManager } from "UpdateManager"
import { ExpressionModel } from "expression/ExpressionModel"
import { handleChordata } from "chordata/chordata"

export class Frontend_impl extends Frontend_skel {
    updateManager: UpdateManager
    expressionModel: ExpressionModel

    backend?: Backend

    constructor(orb: ORB, updateManager: UpdateManager, expressionModel: ExpressionModel) {
        super(orb)
        this.updateManager = updateManager
        this.expressionModel = expressionModel
    }

    /*
     *
     */
    override chordata(data: Uint8Array): void {
        // console.log(`got ${data.length} byte chordata packet`)
        handleChordata(this.updateManager, data)
    }

    /*
     * blendshapes
     */

    // data received from mediapipe
    blendshapeName2Index = new Map<string, number>()
    blendshapeIndex2poseUnit = new Map<number, string>()
    landmarks?: Float32Array
    blendshapes?: Float32Array
    transform?: Float32Array

    getBlendshapeWeight(name: string): number {
        if (this.blendshapes === undefined) {
            return 0.0
        }
        const index = this.blendshapeName2Index.get(name)
        if (index === undefined) {
            return 0.0
        }
        return this.blendshapes[index]
    }

    // list of blendshape names that will be send to faceLandmarks()
    override faceBlendshapeNames(faceBlendshapeNames: Array<string>): void {
        // console.log(`got blendshape names`)
        this.blendshapeIndex2poseUnit.clear()
        this.blendshapeName2Index.clear()
        faceBlendshapeNames.forEach((name, index) => {
            this.blendshapeName2Index.set(name, index)
            const poseUnitName = blendshape2poseUnit.get(name)
            if (poseUnitName) {
                this.blendshapeIndex2poseUnit.set(index, poseUnitName)
            }
        })
    }

    override faceLandmarks(
        landmarks: Float32Array,
        blendshapes: Float32Array,
        transform: Float32Array,
        timestamp_ms: bigint
    ): void {
        // console.log(`got blendshape`)
        this.landmarks = landmarks
        this.blendshapes = blendshapes
        this.transform = transform
        this.updateManager.invalidateView()

        // set pose units from blendshapes
        // this.blendshapeIndex2poseUnit.forEach((name, index) => {
        //     if (index < blendshapes.length) {
        //         this.expressionModel.setPoseUnit(name, blendshapes[index])
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
export const blendshape2poseUnit = new Map<string, string>([
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

    ["tongueOut", "TongueOut"]
])
