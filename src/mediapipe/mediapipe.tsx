import { TAB } from "HistoryManager"
import { ORB } from "corba.js"
import { WsProtocol } from "corba.js/net/browser"
import { Backend } from "net/makehuman_stub"
import { FormButton } from "toad.js/view/FormButton"
import { Tab } from "toad.js/view/Tab"
import { Application, setRenderer } from "Application"
import { Action } from "toad.js"
import { Form } from "toad.js/view/Form"
import { Frontend_impl } from "./Frontend_impl"
import { FaceLandmarkRenderer } from "./FaceLandmarkRenderer"
import { FaceARKitRenderer } from "./FaceARKitRenderer"

// let orb: ORB | undefined
// let backend: Backend | undefined
// let frontend: Frontend_impl

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
                visibilityChange={setRenderer(props.app, new FaceARKitRenderer(frontend))}
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
