import { Application, setRenderer } from "Application"
import { TAB } from "HistoryManager"
import { MPPoseRenderer } from "./MPPoseRenderer"
import { Tab } from "toad.js/view/Tab"
import { BooleanModel, Button, Display, NumberModel, OptionModel, Select, Switch, TextField, TextModel } from "toad.js"
import { FormCheckbox } from "toad.js/view/FormCheckbox"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"
import { FreeMoCapRenderer } from "./FreeMoCapRenderer"
import { FormSelect } from "toad.js/view/FormSelect"
import { SimulatedModel } from "./SimulatedModel"
import { TransportBar } from "./TransportBar"
import { makeMediaPipeTasksModel } from "./makeMediaPipeTasksModel"
import { makeCamerasModel } from "./makeCamerasModel"
import { selectFile } from "./selectFile"
import { SMPTEConverter } from "lib/smpte"
import { FormText } from "toad.js/view/FormText"

export const simulatedModel = new SimulatedModel()

export function PoseTab(props: { app: Application }) {
    const cameras = makeCamerasModel(props.app)
    const mediaPipeTasks = makeMediaPipeTasksModel(props.app)
    const videoFile = new TextModel("video.mp4", {label: "Filename"})
    const newFile = new BooleanModel(true, {
        label: "Timestamp",
        description: "Create new files by appending a timestamp to the file name."
    })
    const delay = new OptionModel(0, [
        [0, "None"],
        [5, "5s"],
        [10, "10s"]
    ], {
        label: "Timer",
        description: "Delay between pressing Record button and actual recording."
    })

    const startFrame = new NumberModel(100, {label: "Start Frame", step: 1, min: 0})
    const endFrame = new NumberModel(900, {label: "End Frame", step: 1, min: 0})
    const fps = new NumberModel(24, {label: "fps", step: 1, min: 1})
    const startTime = new SMPTEConverter(startFrame, fps, {label: "Start"})
    const endTime = new SMPTEConverter(endFrame, fps, {label: "End"})
    
    return (
        <Tab
            label="Pose"
            value={TAB.POSE}
            visibilityChange={
                setRenderer(props.app, new FreeMoCapRenderer())
                // setRenderer(props.app, new MPPoseRenderer())
                // setRenderer(props.app, new RenderHuman())
            }
        >
            <h3>Mediapipe Pose</h3>
            <div>
                <Form>
                    <FormSelect model={cameras} />
                    <FormSelect model={mediaPipeTasks} />
                    <FormLabel model={videoFile} />
                    <FormField>
                        <Display model={videoFile} />
                        <Button
                            action={async () => {
                                const filename = await selectFile(props.app.frontend.filesystem, videoFile.value)
                                if (filename !== undefined) {
                                    videoFile.value = filename
                                }
                            }}
                        >
                            📁
                        </Button>
                    </FormField>
                    <FormHelp model={videoFile} />
                    <FormCheckbox model={newFile}/>
                    <FormSelect model={delay}/>

                    <FormText model={startFrame}/>
                    <FormText model={endFrame}/>
                    <FormText model={fps}/>
                    <FormText model={startTime}/>
                    <FormText model={endTime}/>

                </Form>
                <TransportBar app={props.app} file={videoFile} delay={delay}/>
            </div>
            {/* <h3>Simulated Pose</h3>
            <Form>
                <FormSwitch model={simulatedModel.simulatedOnOff} />
                <XYZView model={simulatedModel.root} />
                <XYZView model={simulatedModel.shoulder} />
                <XYZView model={simulatedModel.leftLeg} />
                <XYZView model={simulatedModel.leftKnee} />
                <XYZView model={simulatedModel.leftFoot} />

                <XYZView model={simulatedModel.rightLeg} />
                <XYZView model={simulatedModel.rightKnee} />
                <XYZView model={simulatedModel.rightFoot} />

                <XYZView model={simulatedModel.pre} />
                <XYZView model={simulatedModel.post} />
            </Form>
            */}
            <div id="debug1">DEBUG</div>
        </Tab>
    )
}
