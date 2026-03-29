import { Application, setRenderer } from "Application"
import { TAB } from "HistoryManager"
import { Tab } from "toad.js/view/Tab"
import { Button, Display, Slider } from "toad.js"
import { FormCheckbox } from "toad.js/view/FormCheckbox"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"
import { FreeMoCapRenderer } from "./FreeMoCapRenderer"
import { FormSelect } from "toad.js/view/FormSelect"
import { SimulatedModel } from "./SimulatedModel"
import { TransportBar } from "./TransportBar"
import { selectFile } from "./selectFile"
import { FormText } from "toad.js/view/FormText"
import { PoseModel } from "./PoseModel"
import { RenderHuman } from "render/RenderHuman"

export const simulatedModel = new SimulatedModel()


export function DevicesTab(props: { app: Application }) {
    const poseModel = new PoseModel(props.app)

    return (
        <Tab
            label="Devices"
            value={TAB.DEVICES}
            visibilityChange={setRenderer(props.app, new RenderHuman())}
        >
            <div>
                <Form>
                    <h6>Source</h6>
                    <FormSelect model={poseModel.device} />
                    <h6>Mediapipe</h6>
                    <FormSelect model={poseModel.camera} />
                    <h6>Recorder</h6>
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
