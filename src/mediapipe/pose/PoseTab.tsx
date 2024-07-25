import { Application, setRenderer } from "Application"
import { TAB } from "HistoryManager"
import { MPPoseRenderer } from "./MPPoseRenderer"
import { Tab } from "toad.js/view/Tab"

// function PoseTab(props: { app: Application }) {
//     return (
//         <Tab label="Pose" value={TAB.POSE} visibilityChange={setRenderer(props.app, new RenderHuman())}>
//             <Table model={props.app.poseControls} style={{ width: "100%", height: "100%" }} />
//         </Tab>
//     )
// }
export function PoseTab(props: { app: Application} ) {
    return (
        <Tab label="Pose" value={TAB.POSE} visibilityChange={setRenderer(props.app, new MPPoseRenderer())}>
            Mediapipe Pose
            {/* <Table model={props.app.poseControls} style={{ width: "100%", height: "100%" }} /> */}
        </Tab>
    )
}
