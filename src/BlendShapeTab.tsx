import { TAB } from "HistoryManager"
import { Tab } from "toad.js/view/Tab"
import { Application, setRenderer } from "Application"
import { RenderHuman } from "render/RenderHuman"

export function BlendShapeTab(props: { app: Application} ) {
    return (
        <Tab label="Blend" value={TAB.POSE} visibilityChange={setRenderer(props.app, new RenderHuman())}>
            {/* <Table model={props.app.poseControls} style={{ width: "100%", height: "100%" }} /> */}
        </Tab>
    )
}

