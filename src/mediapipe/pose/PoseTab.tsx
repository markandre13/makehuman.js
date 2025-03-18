import { Application, setRenderer } from "Application"
import { TAB } from "HistoryManager"
import { Tab } from "toad.js/view/Tab"
import { BooleanModel, Button, Display, NumberModel, OptionModel, Slider, TextModel } from "toad.js"
import { IntegerModel } from "toad.js/model/IntegerModel"
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
import { MediaPipeTask, VideoCamera } from "net/makehuman"

export const simulatedModel = new SimulatedModel()

export class PoseModel {
    cameras: OptionModel<VideoCamera | null>
    mediaPipeTasks: OptionModel<MediaPipeTask | null>
    videoFile: TextModel
    newFile: BooleanModel
    delay: OptionModel<number>
    startFrame: IntegerModel
    endFrame: IntegerModel
    fps: IntegerModel
    startTime: SMPTEConverter
    endTime: SMPTEConverter

    constructor(app: Application) {
        this.cameras = makeCamerasModel(app)
        this.mediaPipeTasks = makeMediaPipeTasksModel(app)
        this.videoFile = new TextModel("video.mp4", {label: "Filename"})
        this.newFile = new BooleanModel(true, {
            label: "Timestamp",
            description: "Create new files by appending a timestamp to the file name."
        })
        this.delay = new OptionModel(0, [
            [0, "None"],
            [5, "5s"],
            [10, "10s"]
        ], {
            label: "Timer",
            description: "Delay between pressing Record button and actual recording."
        })
    
        this.startFrame = new IntegerModel(10, {label: "Start Frame", step: 1, min: 0, max: 100})
        this.endFrame = new IntegerModel(90, {label: "End Frame", step: 1, min: 0, max: 100})
        this.fps = new IntegerModel(24, {label: "fps", step: 1, min: 1})
        this.startTime = new SMPTEConverter(this.startFrame, this.fps, {label: "Start"})
        this.endTime = new SMPTEConverter(this.endFrame, this.fps, {label: "End"})
    }
}

export function PoseTab(props: { app: Application }) {
    const poseModel = new PoseModel(props.app)
    
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
                    <FormSelect model={poseModel.cameras} />
                    <FormSelect model={poseModel.mediaPipeTasks} />
                    <FormLabel model={poseModel.videoFile} />
                    <FormField>
                        <Display model={poseModel.videoFile} />
                        <Button
                            action={async () => {
                                const filename = await selectFile(props.app.frontend.filesystem, poseModel.videoFile.value)
                                if (filename !== undefined) {
                                    poseModel.videoFile.value = filename
                                }
                            }}
                        >
                            📁
                        </Button>
                    </FormField>
                    <FormHelp model={poseModel.videoFile} />
                    <FormCheckbox model={poseModel.newFile}/>
                    <FormSelect model={poseModel.delay}/>

                    <FormLabel>Loop</FormLabel>
                    <FormField>
                        <Slider model={[poseModel.startFrame, poseModel.endFrame]}/>
                    </FormField>
                    <FormHelp></FormHelp>

                    <FormText model={poseModel.startFrame}/>
                    <FormText model={poseModel.endFrame}/>
                    <FormText model={poseModel.fps}/>
                    <FormText model={poseModel.startTime}/>
                    <FormText model={poseModel.endTime}/>

                </Form>
                <TransportBar app={props.app} file={poseModel.videoFile} delay={poseModel.delay}/>
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
