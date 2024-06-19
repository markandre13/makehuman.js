import { TAB } from "HistoryManager"
import { Tab } from "toad.js/view/Tab"
import { Application, setRenderer } from "Application"
import { OptionModel } from "toad.js"
import { Form } from "toad.js/view/Form"
import { FaceLandmarkRenderer } from "./FaceLandmarkRenderer"
import { FaceARKitRenderer } from "./FaceARKitRenderer"
import { FaceICTKitRenderer } from "./FaceICTKitRenderer"
import { FormSelect } from "toad.js/view/FormSelect"
import { RenderHandler } from "render/GLView"
import { RenderHuman } from "render/RenderHuman"
import { FormSwitch } from "toad.js/view/FormSwitch"
import { MotionCaptureEngine, MotionCaptureType } from "net/makehuman"

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

let renderEngine: OptionModel<RenderHandler>
let captureEngine: OptionModel<MotionCaptureEngine>
export function MediapipeTab(props: { app: Application }) {
    if (renderEngine === undefined) {
        const lm = new FaceLandmarkRenderer(props.app.frontend)
        const ar = new FaceARKitRenderer(props.app.frontend.blendshapeModel)
        const ict = new FaceICTKitRenderer(props.app.frontend.blendshapeModel)
        const mh = new RenderHuman(true)
        renderEngine = new OptionModel<RenderHandler>(mh, [
            [mh, "MakeHuman"],
            [ar, "ARKit Blendshape"],
            [ict, "ICTKit Blendshape"],
            [lm, "Mediapipe Landmarks"],
        ], {label: "Render Engine"})
        renderEngine.modified.add(() => {
            props.app.setRenderer(renderEngine.value, renderEngine.value !== mh)
        })

        captureEngine = new OptionModel<MotionCaptureEngine>(
            MotionCaptureEngine.MEDIAPIPE, [
                [MotionCaptureEngine.NONE, "None"],
                [MotionCaptureEngine.MEDIAPIPE, "Mediapipe"],
                [MotionCaptureEngine.LIVELINK, "Live Link"],
            ], {
                label: "Capture Engine"
            }
        )
        captureEngine.modified.add( () => {
            props.app.frontend.backend?.setEngine(MotionCaptureType.FACE, captureEngine.value)
        })
    }

    return (
        <Tab
            label="Mediapipe"
            value={TAB.MEDIAPIPE}
            visibilityChange={(state) => {
                setRenderer(props.app, renderEngine.value, false)(state)
            }}
        >
            <Form>
                <FormSelect model={renderEngine} />
                <FormSelect model={captureEngine} />
                <FormSwitch model={props.app.humanMesh.wireframe} />
            </Form>
        </Tab>
    )
}
