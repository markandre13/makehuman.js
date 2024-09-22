import { Application, setRenderer } from "Application"
import { TAB } from "HistoryManager"
import { MPPoseRenderer } from "./MPPoseRenderer"
import { Tab } from "toad.js/view/Tab"
import { BooleanModel, Button, Model, NumberModel, OptionModel, Select, Switch, TextField } from "toad.js"
import { FormSwitch } from "toad.js/view/FormSwitch"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"
import { mat4, vec3 } from "gl-matrix"
import { euler_matrix } from "lib/euler_matrix"
import { Blaze, BlazePoseLandmarks } from "./BlazePoseConverter"
import { deg2rad } from "lib/calculateNormals"
import { ModelOptions } from "toad.js/model/Model"

// function PoseTab(props: { app: Application }) {
//     return (
//         <Tab label="Pose" value={TAB.POSE} visibilityChange={setRenderer(props.app, new RenderHuman())}>
//             <Table model={props.app.poseControls} style={{ width: "100%", height: "100%" }} />
//         </Tab>
//     )
// }

// we have speech!!!
// https://github.com/mdn/dom-examples/blob/main/web-speech-api/speak-easy-synthesis/script.js
const delay = new OptionModel(0, [
    [0, "None"],
    [5, "5s"],
    [10, "10s"],
])

class XYZModel extends Model {
    x = new NumberModel(0, { label: "X", min: -190, max: 190, step: 5 })
    y = new NumberModel(0, { label: "X", min: -190, max: 190, step: 5 })
    z = new NumberModel(0, { label: "X", min: -190, max: 190, step: 5 })

    constructor(options?: ModelOptions) {
        super(options)
        const t = () => this.modified.trigger()
        this.x.modified.add(t)
        this.y.modified.add(t)
        this.z.modified.add(t)
    }

    toMatrix() {
        return euler_matrix(deg2rad(this.x.value), deg2rad(this.y.value), deg2rad(this.z.value))
    }
}

export function XYZView(props: { model: XYZModel }) {
    return (
        <>
            <FormLabel model={props.model} />
            <FormField>
                <TextField model={props.model.x} style={{ width: "50px" }} />
                <TextField model={props.model.y} style={{ width: "50px" }} />
                <TextField model={props.model.z} style={{ width: "50px" }} />
            </FormField>
            <FormHelp model={props.model} />
        </>
    )
}

/**
 * Helper to create BlazePoseLandmarks for testing
 */
class DrawStack {
    private stack: mat4[] = [mat4.create()]
    private top() {
        return this.stack[this.stack.length - 1]
    }

    push() {
        this.stack.push(mat4.clone(this.top()))
    }
    pop() {
        --this.stack.length
    }
    mul(m: mat4) {
        mat4.mul(this.top(), this.top(), m)
    }
    translate(x: number, y: number, z: number) {
        this.mul(mat4.fromTranslation(mat4.create(), vec3.fromValues(x, y, z)))
    }
    set(pose: BlazePoseLandmarks, index: Blaze) {
        const v = vec3.create()
        vec3.transformMat4(v, v, this.top())
        pose.setVec(index, v[0], v[1], v[2])
    }
}

/**
 * Create BlazePoseLandmarks for testing
 */
class SimulatedModel {
    pose = new BlazePoseLandmarks()
    simulatedOnOff = new BooleanModel(true, { label: "Simulated Model" })
    root = new XYZModel({ label: "root" })
    shoulder = new XYZModel({ label: "shoulder" })
    leftLeg = new XYZModel({ label: "leftLeg" })
    rightLeg = new XYZModel({ label: "rightLeg" })

    pre = new XYZModel({ label: "pre" })
    post = new XYZModel({ label: "post" })

    constructor() {
        this.update = this.update.bind(this)
        for (const model of [this.root, this.shoulder, this.leftLeg, this.rightLeg]) {
            model.modified.add(this.update)
        }
        this.update()
    }

    private update() {
        const stack = new DrawStack()
        stack.mul(this.root.toMatrix())

        stack.push()
        stack.translate(0.0, 0.5, 0)
        // stack.set(this.pose, Blaze.LEFT_HIP)
        stack.mul(this.shoulder.toMatrix())
        stack.push()
        stack.translate(0.1, 0.0, 0)
        stack.set(this.pose, Blaze.LEFT_SHOULDER)
        stack.pop()
        stack.translate(-0.1, 0.0, 0)
        stack.set(this.pose, Blaze.RIGHT_SHOULDER)
        stack.pop()

        stack.push()
        stack.translate(0.1, 0, 0)
        stack.set(this.pose, Blaze.LEFT_HIP)
        stack.mul(this.leftLeg.toMatrix())
        stack.translate(0, -0.4, 0)
        stack.set(this.pose, Blaze.LEFT_KNEE)
        stack.pop()

        stack.push()
        stack.translate(-0.1, 0, 0)
        stack.set(this.pose, Blaze.RIGHT_HIP)
        stack.mul(this.rightLeg.toMatrix())
        stack.translate(0, -0.4, 0)
        stack.set(this.pose, Blaze.RIGHT_KNEE)
        stack.pop()
    }
}

export const simulatedModel = new SimulatedModel()

export function PoseTab(props: { app: Application }) {
    return (
        <Tab
            label="Pose"
            value={TAB.POSE}
            visibilityChange={
                setRenderer(props.app, new MPPoseRenderer())
                // setRenderer(props.app, new RenderHuman())
            }
        >
            <h3>Mediapipe Pose</h3>
            <div>
                <Select model={delay} />
                {/* <Button
                action={async () => {
                    if (delay.value !== 0) {
                        console.log(`sleep ${delay.value}s`)
                        await sleep(delay.value * 1000)
                    }
                    props.app.frontend.backend?.record("video.mp4")
                }}
            >
                ●
            </Button> */}
                <Button action={() => props.app.frontend.backend?.play("video.mp4")}>▶︎</Button>
                <Button action={() => props.app.frontend.backend?.stop()}>◼︎</Button>
            </div>
            <h3>Simulated Pose</h3>
            <Form>
                <FormSwitch model={simulatedModel.simulatedOnOff} />
                <XYZView model={simulatedModel.root} />
                <XYZView model={simulatedModel.shoulder} />
                <XYZView model={simulatedModel.leftLeg} />
                <XYZView model={simulatedModel.rightLeg} />
                <XYZView model={simulatedModel.pre} />
                <XYZView model={simulatedModel.post} />
            </Form>
            <div></div>
            <div id="debug" />
        </Tab>
    )
}
