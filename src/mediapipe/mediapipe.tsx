import { TAB } from "HistoryManager"
import { ORB } from "corba.js"
import { WsProtocol } from "corba.js/net/browser"
import { Backend } from "net/makehuman_stub"
import { FormButton } from "toad.js/view/FormButton"
import { Tab } from "toad.js/view/Tab"
import { Application, setRenderer } from "Application"
// import { Target } from "target/Target"
import { Action } from "toad.js"
import { Form } from "toad.js/view/Form"
import { Frontend_impl } from "./Frontend_impl"
import { FaceLandmarkRenderer } from "./FaceLandmarkRenderer"

// let orb: ORB | undefined
// let backend: Backend | undefined
// let frontend: Frontend_impl
const blendshapeNames = [
    "_neutral", // 0
    "browDownLeft", // 1
    "browDownRight", // 2
    "browInnerUp", // 3
    "browOuterUpLeft", // 4
    "browOuterUpRight", // 5
    "cheekPuff", // 6
    "cheekSquintLeft", // 7
    "cheekSquintRight", // 8
    "eyeBlinkLeft", // 9
    "eyeBlinkRight", // 10
    "eyeLookDownLeft", // 11
    "eyeLookDownRight", // 12
    "eyeLookInLeft", // 13
    "eyeLookInRight", // 14
    "eyeLookOutLeft", // 15
    "eyeLookOutRight", // 16
    "eyeLookUpLeft", // 17
    "eyeLookUpRight", // 18
    "eyeSquintLeft", // 19
    "eyeSquintRight", // 20
    "eyeWideLeft", // 21
    "eyeWideRight", // 22
    "jawForward", // 23
    "jawLeft", // 24
    "jawOpen", // 25
    "jawRight", // 26
    "mouthClose", // 27
    "mouthDimpleLeft", // 28
    "mouthDimpleRight", // 29
    "mouthFrownLeft", // 30
    "mouthFrownRight", // 31
    "mouthFunnel", // 32
    "mouthLeft", // 33
    "mouthLowerDownLeft", // 34
    "mouthLowerDownRight", // 35
    "mouthPressLeft", // 36
    "mouthPressRight", // 37
    "mouthPucker", // 38
    "mouthRight", // 39
    "mouthRollLower", // 40
    "mouthRollUpper", // 41
    "mouthShrugLower", // 42
    "mouthShrugUpper", // 43
    "mouthSmileLeft", // 44
    "mouthSmileRight", // 45
    "mouthStretchLeft", // 46
    "mouthStretchRight", // 47
    "mouthUpperUpLeft", // 48
    "mouthUpperUpRight", // 49
    "noseSneerLeft", // 50
    "noseSneerRight", // 51
]
// const targets = new Array<Target>(blendshapeNames.length)
// let weights = new Float32Array(blendshapeNames.length)
// let landmarks: Float32Array | undefined
// let neutral: WavefrontObj | undefined
// // const scale = 80
// const scale = 0.7

// NEXT STEPS:
// [X] for finetuning the animation in realtime, render in the backend
// [ ] google chrome does not detect loosing the connection
// [ ] facial_transformation_matrixes
// [ ] replace enum with object
// [ ] switch between them
// [ ] render side by side
// [ ] render overlay
// [ ] write editor to tweak the blendshapes
// [ ] write an editor to create pose units matching the blendshapes

export enum FaceRenderType {
    MP_LANDMARKS,
    ARKIT,
    ICTFACEKIT,
}

let connectToBackend: Action | undefined
export function MediapipeTab(props: { app: Application }) {
    if (connectToBackend === undefined) {
        const orb = new ORB()
        orb.registerStubClass(Backend)
        orb.addProtocol(new WsProtocol())

        const frontend = new Frontend_impl(orb, props.app.updateManager, props.app.expressionManager.model)

        connectToBackend = new Action(() => frontend.connectToORB(connectToBackend!), {
            label: "Connect to Backend",
        })

        return (
            <Tab
                label="Mediapipe"
                value={TAB.MEDIAPIPE}
                visibilityChange={setRenderer(props.app, new FaceLandmarkRenderer(frontend))}
            >
                <Form>
                    <FormButton action={connectToBackend} />
                </Form>
            </Tab>
        )
    }
}
// let backend: Backend | undefined
// TODO: move this into Frontend_impl ??? well no, the Action is View layer
