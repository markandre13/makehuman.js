import { Application, setRenderer } from "Application"
import { TAB } from "HistoryManager"
import { MPPoseRenderer } from "./MPPoseRenderer"
import { Tab } from "toad.js/view/Tab"
import { Button, OptionModel, Select, Switch } from "toad.js"
import { sleep } from "lib/sleep"

// function PoseTab(props: { app: Application }) {
//     return (
//         <Tab label="Pose" value={TAB.POSE} visibilityChange={setRenderer(props.app, new RenderHuman())}>
//             <Table model={props.app.poseControls} style={{ width: "100%", height: "100%" }} />
//         </Tab>
//     )
// }

const delay = new OptionModel(0, [
    [0, "None"],
    [5, "5s"],
    [10, "10s"],
])

export function PoseTab(props: { app: Application }) {
    return (
        <Tab label="Pose" value={TAB.POSE} visibilityChange={setRenderer(props.app, new MPPoseRenderer())}>
            Mediapipe Pose
            <Select model={delay} />
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
            </Button>
            <Button action={() => props.app.frontend.backend?.play("video.mp4")}>▶︎</Button>
            <Button action={() => props.app.frontend.backend?.stop()}>◼︎</Button>
        </Tab>
    )
}
