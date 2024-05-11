import { ORB } from "corba.js"
import { Backend } from "net/makehuman_stub"
import { Frontend as Frontend_skel } from "net/makehuman_skel"
import { EngineStatus, MotionCaptureEngine, MotionCaptureType } from "net/makehuman"
import { UpdateManager } from "UpdateManager"
import { ExpressionModel } from "expression/ExpressionModel"
import { Action } from "toad.js"

export class Frontend_impl extends Frontend_skel {
    updateManager: UpdateManager
    expressionModel: ExpressionModel

    backend?: Backend

    // data received from mediapipe
    blendshapeIndex2poseUnit = new Map<number, string>();
    landmarks?: Float32Array
    blendshapes?: Float32Array

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
    blendshape2poseUnit = new Map<string, string>([
        ["jawOpen", "JawDrop"],
        ["jawForward", "ChinForward"],
        ["mouthSmileRight", "MouthRightPullUp"],
        ["mouthSmileLeft", "MouthLeftPullUp"],
        ["mouthStrechLeft", "MouthLeftPlatysma"],
        ["mouthRightLeft", "MouthRightPlatysma"],
        ["eyeWideRight", "RightUpperLidOpen"],
        ["eyeWideLeft", "LeftUpperLidOpen"],
        ["eyeBlinkLeft", "LeftUpperLidClosed"],
        ["eyeBlinkRight", "RightUpperLidClosed"],
        ["mouthPucker", "LipsKiss"],
        ["jawLeft", "ChinLeft"],
        ["jawRight", "ChinRight"],
        ["browInnerUp", "LeftInnerBrowUp"],
        ["browInnerUp", "RightInnerBrowUp"],
        ["browOuterUpLeft", "LeftOuterBrowUp"],
        ["browOuterUpRight", "RightOuterBrowUp"],
        ["browDownLeft", "LeftBrowDown"],
        ["browDownRight", "RightBrowDown"],
    ]);

    constructor(orb: ORB, updateManager: UpdateManager, expressionModel: ExpressionModel) {
        super(orb)
        this.updateManager = updateManager
        this.expressionModel = expressionModel
    }

    async connectToORB(connectToBackend: Action) {
        if (this.backend !== undefined) {
            return
        }

        try {
            const object = await this.orb.stringToObject("corbaname::localhost:9001#Backend")
            this.backend = Backend.narrow(object)
            ORB.installSystemExceptionHandler(this.backend, () => {
                this.backend = undefined
                connectToBackend.error = `lost connection`
                connectToBackend.enabled = true
            })

            this.backend.setFrontend(this)
            connectToBackend.enabled = false
            connectToBackend.error = undefined
            this.backend.setEngine(MotionCaptureEngine.MEDIAPIPE, MotionCaptureType.FACE, EngineStatus.ON)
        } catch (e) {
            connectToBackend.error = `${e}`
        }
    }

    // list of blendshape names that will be send to faceLandmarks()
    override faceBlendshapeNames(faceBlendshapeNames: Array<string>): void {
        this.blendshapeIndex2poseUnit.clear()
        faceBlendshapeNames.forEach((name, index) => {
            const poseUnitName = this.blendshape2poseUnit.get(name)
            if (poseUnitName) {
                this.blendshapeIndex2poseUnit.set(index, poseUnitName)
            }
        })
    }

    override faceLandmarks(landmarks: Float32Array, blendshapes: Float32Array, timestamp_ms: bigint): void {
        this.landmarks = landmarks
        this.blendshapes = blendshapes
        this.updateManager.invalidateView()

        // this.updateManager.mediapipe(landmarks, timestamp_ms)
        // this.blendshapeIndex2poseUnit.forEach((name, index) => {
        //     if (index < blendshapes.length) {
        //         this.expressionModel.setPoseUnit(name, blendshapes[index])
        //     }
        // })
    }
    override async hello(): Promise<void> {
        console.log("HELLO FROM THE SERVER")
    }
}
