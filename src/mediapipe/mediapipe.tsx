import { TAB } from "HistoryManager"
import { ORB } from "corba.js"
import { WsProtocol } from "corba.js/net/browser"
import { Backend } from "net/makehuman_stub"
import { FormButton } from "toad.js/view/FormButton"
import { Tab } from "toad.js/view/Tab"
import { Application, setRenderer } from "Application"
import { Action, OptionModel } from "toad.js"
import { Form } from "toad.js/view/Form"
import { Frontend_impl } from "../net/Frontend_impl"
import { FaceLandmarkRenderer } from "./FaceLandmarkRenderer"
import { FaceARKitRenderer } from "./FaceARKitRenderer"
import { FaceICTKitRenderer } from "./FaceICTKitRenderer"
import { FormSelect } from "toad.js/view/FormSelect"
import { RenderHandler } from "render/GLView"
import { RenderHuman } from "render/RenderHuman"

// NEXT STEPS:
// [X] for finetuning the animation in realtime, render in the backend
// [ ] google chrome does not detect loosing the connection
// [ ] facial_transformation_matrixes
// [X] replace enum with object
// [X] switch between them
// [ ] render side by side
// [ ] render overlay
// [ ] write editor to tweak the blendshapes
// [ ] write an editor to create pose units matching the blendshapes

let faceRenderer: OptionModel<RenderHandler>
export function MediapipeTab(props: { app: Application }) {
    if (faceRenderer === undefined) {
        const lm = new FaceLandmarkRenderer(props.app.frontend)
        const ar = new FaceARKitRenderer(props.app.frontend)
        // const ict = new FaceICTKitRenderer(frontend)
        const mh = new RenderHuman(true)
        faceRenderer = new OptionModel<RenderHandler>(mh, [
            [lm, "Mediapipe Landmarks"],
            [ar, "ARKit Blendshape"],
            // [ict, "ICTKit Blendshape"],
            [mh, "MakeHuman"]
        ], {label: "Render Engine"})
        faceRenderer.modified.add(() => {
            props.app.setRenderer(faceRenderer.value, faceRenderer.value !== mh)
        })
    }

    return (
        <Tab
            label="Mediapipe"
            value={TAB.MEDIAPIPE}
            visibilityChange={(state) => {
                setRenderer(props.app, faceRenderer.value, false)(state)
            }}
        >
            <Form>
                <FormSelect model={faceRenderer} />
            </Form>
        </Tab>
    )
}
