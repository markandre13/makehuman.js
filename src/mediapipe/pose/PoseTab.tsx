import { Application, setRenderer } from "Application"
import { TAB } from "HistoryManager"
import { Tab } from "toad.js/view/Tab"
import { BooleanModel, Button, Display, OptionModel, Slider, TextModel } from "toad.js"
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
import { MediaPipeTask, VideoCamera, VideoSize } from "net/makehuman"

export const simulatedModel = new SimulatedModel()

export class PoseModel {
    cameras: OptionModel<VideoCamera | null>
    mediaPipeTasks: OptionModel<MediaPipeTask | null>
    videoFile: TextModel
    newFile: BooleanModel
    delay: OptionModel<number>

    frame: {
        duration: IntegerModel
        position: IntegerModel
        loopStart: IntegerModel
        loopEnd: IntegerModel
    }
    timecode: {
        duration: SMPTEConverter
        position: SMPTEConverter
        loopStart: SMPTEConverter
        loopEnd: SMPTEConverter
    }
    fps: IntegerModel

    constructor(app: Application) {
        this.cameras = makeCamerasModel(app)
        this.mediaPipeTasks = makeMediaPipeTasksModel(app)
        this.videoFile = new TextModel("video.mp4", { label: "Filename" })
        this.newFile = new BooleanModel(true, {
            label: "Timestamp",
            description: "Create new files by appending a timestamp to the file name.",
        })
        this.delay = new OptionModel(
            0,
            [
                [0, "None"],
                [5, "5s"],
                [10, "10s"],
            ],
            {
                label: "Timer",
                description: "Delay between pressing Record button and actual recording.",
            }
        )
        this.frame = {
            duration: new IntegerModel(0, { label: "Duration" }),
            position: new IntegerModel(0, { label: "Position", step: 1, min: 0 }),
            loopStart: new IntegerModel(0, { label: "Loop Start", step: 1, min: 0, max: 0 }),
            loopEnd: new IntegerModel(0, { label: "Loop End", step: 1, min: 0, max: 0 }),
        }
        this.fps = new IntegerModel(24, { label: "fps", step: 1, min: 1 })

        this.timecode = {
            duration: new SMPTEConverter(this.frame.duration, this.fps, { label: "Duration" }),
            position: new SMPTEConverter(this.frame.position, this.fps, { label: "Position" }),
            loopStart: new SMPTEConverter(this.frame.loopStart, this.fps, { label: "Loop Start" }),
            loopEnd: new SMPTEConverter(this.frame.loopEnd, this.fps, { label: "Loop End" }),
        }

        app.frontend.frameHandler = (frame) => {
            this.frame.position.value = frame
        }
    }

    setSize(size: VideoSize) {
        this.fps.value = size.fps

        this.frame.position.max = size.frames
        this.frame.position.value = 0

        this.frame.loopStart.max = size.frames
        this.frame.loopStart.value = 0

        this.frame.loopEnd.max = size.frames
        this.frame.loopEnd.value = size.frames

        this.frame.duration.value = size.frames
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
                                const filename = await selectFile(
                                    props.app.frontend.filesystem,
                                    poseModel.videoFile.value
                                )
                                if (filename !== undefined) {
                                    poseModel.videoFile.value = filename
                                }
                            }}
                        >
                            📁
                        </Button>
                    </FormField>
                    <FormHelp model={poseModel.videoFile} />
                    <FormCheckbox model={poseModel.newFile} />
                    <FormSelect model={poseModel.delay} />

                    <FormLabel>Loop</FormLabel>
                    <FormField>
                        <Slider model={[poseModel.frame.loopStart, poseModel.frame.position, poseModel.frame.loopEnd]} />
                    </FormField>
                    <FormHelp></FormHelp>
                    <FormText model={poseModel.fps} />
                    <FormText model={poseModel.timecode.loopStart} />
                    <FormText model={poseModel.timecode.loopEnd} />
                    <FormText model={poseModel.timecode.duration} />
                    <FormText model={poseModel.timecode.position} />
                </Form>
                <TransportBar model={poseModel} frontend={props.app.frontend} />
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
