import { TAB } from "HistoryManager"
import { HumanMesh } from "mesh/HumanMesh"
import { PoseModel } from "pose/PoseModel"
import { SelectionModel, Switch, Table, TableEditMode } from "toad.js"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"
import { FormSwitch } from "toad.js/view/FormSwitch"
import { Tab } from "toad.js/view/Tab"

export default function (scene: HumanMesh, pm: PoseModel) {
    // FIXME: TableEditMode shouldn't be part of SelectionModel
    // FIXME: also: this was a pain to find... :(
    const sm = new SelectionModel(TableEditMode.EDIT_CELL)
    return (
        <Tab label="Pose2" value={TAB.POSE2} style={{ overflow: "none" }}>
            <Form>
                <FormSwitch model={scene.wireframe}/>
            </Form>
            <Table selectionModel={sm} model={pm} style={{ width: "487px", height: "100%" }} />
        </Tab>
    )
}
