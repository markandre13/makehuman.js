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

export const simulatedModel = new SimulatedModel()

// adobe spectrum h1-h..,
// font-sizes: xxs, xs, s, m, l, xl, xxl, xxxl
//             100, 200, 300, 500, 700, 900, 1100, 1300
// https://spectrum.adobe.com/page/heading/
// default font size:
//   M (content-based UI)
//   S (application UI)
// <h2 class=" spectrum-Heading spectrum-Heading--sizeXXL "
// <Heading level={4}>Edit</Heading>
//   level: 1-6, default 3

//  xxs: 14px
//   xs: 16px
//    s: 18px
//    m: 22px
//    l: 28px
//   xl: 36px
//  xxl: 58px
// xxxl: 78px

// f_i := f_0 * r ^ (i/n)
// golden ratio (r = 1.618034)

// https://spencermortensen.com/articles/typographic-scale/
// This is the classic typographic scale, as recorded by Mr. Bringhurst in The Elements of Typographic Style:
// 6 7 8 9 10 11 12 14 16 18 21 24 30 36 48 60 72
//            11                

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
            <div>
                <Form>
                    <h6>Source</h6>
                    <FormSelect model={poseModel.body} />
                    <FormSelect model={poseModel.face} />
                    <FormSelect model={poseModel.hand} />
                    <h6>Mediapipe</h6>
                    <FormSelect model={poseModel.camera} />
                    <FormSelect model={poseModel.mediaPipeTask} />
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
