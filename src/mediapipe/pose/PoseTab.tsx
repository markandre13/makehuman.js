import { Application, setRenderer } from "Application"
import { TAB } from "HistoryManager"
import { MPPoseRenderer } from "./MPPoseRenderer"
import { Tab } from "toad.js/view/Tab"
import { BooleanModel, Button, Model, NumberModel, OptionModel, Select, Switch, TextField } from "toad.js"
import { FormSwitch } from "toad.js/view/FormSwitch"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"
import { mat4, vec3 } from "gl-matrix"
import { euler_matrix } from "lib/euler_matrix"
import { BlazePoseLandmarks } from "./BlazePoseLandmarks"
import { Blaze } from "./Blaze"
import { deg2rad } from "lib/calculateNormals"
import { ModelOptions } from "toad.js/model/Model"
import { FreeMoCapRenderer } from "./FreeMoCapRenderer"
import { VideoCamera2, MediaPipeTask } from "net/makehuman"
import { sleep } from "lib/sleep"
import { ConnectionState } from "net/ConnectionState"

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
        const t = () => this.signal.emit()
        this.x.signal.add(t)
        this.y.signal.add(t)
        this.z.signal.add(t)
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

    private push() {
        this.stack.push(mat4.clone(this.top()))
    }
    private pop() {
        --this.stack.length
    }
    down(block: () => void) {
        this.push()
        block()
        this.pop()
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
export class SimulatedModel {
    pose = new BlazePoseLandmarks()
    simulatedOnOff = new BooleanModel(false, { label: "Simulated Model" })
    root = new XYZModel({ label: "root" })
    shoulder = new XYZModel({ label: "shoulder" })
    leftLeg = new XYZModel({ label: "leftLeg" })
    rightLeg = new XYZModel({ label: "rightLeg" })
    leftKnee = new XYZModel({ label: "leftKnee" })
    rightKnee = new XYZModel({ label: "rightKnee" })
    leftFoot = new XYZModel({ label: "leftFoot" })
    rightFoot = new XYZModel({ label: "rightFoot" })
    all = [
        this.root,
        this.shoulder,
        this.leftLeg,
        this.leftKnee,
        this.leftFoot,
        this.rightLeg,
        this.rightKnee,
        this.rightFoot,
    ]

    pre = new XYZModel({ label: "pre" })
    post = new XYZModel({ label: "post" })

    constructor() {
        this.update = this.update.bind(this)
        for (const model of this.all) {
            model.signal.add(this.update)
        }
        this.update()
    }

    private update() {
        const stack = new DrawStack()
        stack.mul(this.root.toMatrix())

        stack.down(() => {
            stack.translate(0.0, 0.5, 0)
            // stack.set(this.pose, Blaze.LEFT_HIP)
            stack.mul(this.shoulder.toMatrix())
            stack.down(() => {
                stack.translate(0.1, 0.0, 0)
                stack.set(this.pose, Blaze.LEFT_SHOULDER)
            })
            stack.translate(-0.1, 0.0, 0)
            stack.set(this.pose, Blaze.RIGHT_SHOULDER)
        })

        stack.down(() => {
            // from hip
            stack.translate(0.1, 0, 0)
            stack.set(this.pose, Blaze.LEFT_HIP)
            // to knee
            // stack.mul(this.leftLeg.toMatrix())
            const ll = this.leftLeg
            stack.mul(euler_matrix(0, 0, deg2rad(ll.z.value)))
            stack.mul(euler_matrix(deg2rad(ll.x.value), 0, 0))
            stack.mul(euler_matrix(0, deg2rad(ll.y.value), 0))

            stack.translate(0, -0.4, 0)
            stack.set(this.pose, Blaze.LEFT_KNEE)
            // to ankle
            stack.mul(this.leftKnee.toMatrix())
            stack.translate(0, -0.4, 0)
            stack.set(this.pose, Blaze.LEFT_ANKLE)
            // to foot
            stack.mul(this.leftFoot.toMatrix())
            stack.translate(0, -0.05, 0.025)
            stack.set(this.pose, Blaze.LEFT_HEEL)
            stack.translate(0, 0, -0.15)
            stack.set(this.pose, Blaze.LEFT_FOOT_INDEX)
        })

        stack.down(() => {
            // from hip
            stack.translate(-0.1, 0, 0)
            stack.set(this.pose, Blaze.RIGHT_HIP)
            // to knee
            stack.mul(this.rightLeg.toMatrix())
            stack.translate(0, -0.4, 0)
            stack.set(this.pose, Blaze.RIGHT_KNEE)
            // to ankle
            stack.mul(this.rightKnee.toMatrix())
            stack.translate(0, -0.4, 0)
            stack.set(this.pose, Blaze.RIGHT_ANKLE)
            // to foot
            stack.mul(this.rightFoot.toMatrix())
            stack.translate(0, -0.05, 0.025)
            stack.set(this.pose, Blaze.RIGHT_HEEL)
            stack.translate(0, 0, -0.15)
            stack.set(this.pose, Blaze.RIGHT_FOOT_INDEX)
        })
    }
}

export const simulatedModel = new SimulatedModel()

// TODO: disable/enable buttons with constraints

export function TransportBar(props: { app: Application }) {
    return (
        <>
            {/* <Select model={delay} />
            <Button
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
            <Button action={() => props.app.frontend.backend?.stop()}>◼︎</Button>
            {/* <Button action={() => props.app.frontend.backend?.play("video.mp4")}>▶︎</Button> */}
            <Button
                action={async () => {
                    try {
                        // cp ~/freemocap_data/recording_sessions/session_2024-10-06_13_24_28/recording_13_29_02_gmt+2__drei/output_data/mediapipe_body_3d_xyz.csv .
                        await props.app.frontend.backend?.play("mediapipe_body_3d_xyz.csv")
                    } catch (e) {
                        console.log("UPSY DAISY")
                        if (e instanceof Error) {
                            alert(`${e.name}: ${e.message}`)
                        }
                    }
                }}
            >
                ▶︎
            </Button>
            <Button action={() => props.app.frontend.backend?.pause()}>❙ ❙</Button>
            <Button action={() => props.app.frontend.backend?.seek(props.app.frontend._poseLandmarksTS.value - 30n)}>
                ◀︎◀︎
            </Button>
            <Button action={() => props.app.frontend.backend?.seek(props.app.frontend._poseLandmarksTS.value - 1n)}>
                ❙◀︎
            </Button>
            <Button action={() => props.app.frontend.backend?.seek(props.app.frontend._poseLandmarksTS.value + 1n)}>
                ▶︎❙
            </Button>
            <Button action={() => props.app.frontend.backend?.seek(props.app.frontend._poseLandmarksTS.value + 30n)}>
                ▶︎▶︎
            </Button>
            <TextField model={props.app.frontend._poseLandmarksTS as any} />
        </>
    )
    //
}

// TODO: make this an object
function makeMediaPipeTasksModel(app: Application) {
    const tasks = new OptionModel<MediaPipeTask | null>(null, [[null, "None"]])

    app.connector.signal.add(async () => {
        if (app.connector.state === ConnectionState.CONNECTED) {
            const mapping: ([MediaPipeTask | null, string | number | HTMLElement] | string)[] = [[null, "None"]]
            for (const camera of await app.frontend.backend!.getMediaPipeTasks()) {
                mapping.push([camera, await camera.name()])
            }
            tasks.setMapping(mapping)
        }
    })
    tasks.signal.add( () => {
        // [ ] can CORBA send a nil of VideoCamera2 to be used instead of null?
        //     test this with OmniORB
        // [ ] extend corba.cc/corba.js to send/receive a stub
        // [ ] corba.js: drop need to register stub?
        // [ ] corba.js: add method to register impl?
        app.frontend.backend?.camera(tasks.value ? tasks.value : null as any)
    })

    return tasks
}

function makeCamerasModel(app: Application) {
    const cameras = new OptionModel<VideoCamera2 | null>(null, [[null, "None"]])

    app.connector.signal.add(async () => {
        if (app.connector.state === ConnectionState.CONNECTED) {
            const mapping: ([VideoCamera2 | null, string | number | HTMLElement] | string)[] = [[null, "None"]]
            for (const camera of await app.frontend.backend!.getVideoCameras()) {
                const name = await camera.name()
                const features = await camera.features()
                mapping.push([camera, `${name} (${features})`])
            }
            cameras.setMapping(mapping)
        }
    })
    cameras.signal.add( () => {
        // [ ] can CORBA send a nil of VideoCamera2 to be used instead of null?
        //     test this with OmniORB
        // [ ] extend corba.cc/corba.js to send/receive a stub
        // [ ] corba.js: drop need to register stub?
        // [ ] corba.js: add method to register impl?
        app.frontend.backend?.camera(cameras.value ? cameras.value : null as any)
    })

    return cameras
}

export function PoseTab(props: { app: Application }) {
    const cameras = makeCamerasModel(props.app)

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
                <TransportBar app={props.app} />
                <Select model={cameras} />
            </div>
            <h3>Simulated Pose</h3>
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
            <Button
                action={() => {
                    const msg = ["get ready", "10", "9", "8", "6", "5", "4", "3", "2", "1", "click"]
                    const synth = window.speechSynthesis
                    const voice = synth.getVoices().filter((it) => it.name === "Samantha")[0]
                    let counter = 0
                    const schedule = () => {
                        const utter = new SpeechSynthesisUtterance(msg[counter])
                        utter.voice = voice
                        synth.speak(utter)
                        ++counter
                        if (counter < msg.length) {
                            window.setTimeout(() => {
                                schedule()
                            }, 1000)
                        } else {
                            console.log(props.app.frontend._poseLandmarks?.toString())
                        }
                    }
                    schedule()
                }}
            >
                SNAPSHOT
            </Button>
            <div id="debug1">DEBUG</div>
        </Tab>
    )
}
