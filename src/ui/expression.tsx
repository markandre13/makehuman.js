import { ExpressionManager } from "expression/ExpressionManager"
import { TAB } from "HistoryManager"
import { HumanMesh } from "mesh/HumanMesh"
import {
    OptionModel,
    Select,
    SelectionModel,
    Switch,
    TableEditMode,
} from "toad.js"
import { Table } from "toad.js/table/Table"

import { Tab } from "toad.js/view/Tab"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"
import { FormSwitch } from "toad.js/view/FormSwitch"
import { FormSelect } from "toad.js/view/FormSelect"

export default function (expressionManager: ExpressionManager, scene: HumanMesh) {
    const expressionList = new OptionModel(expressionManager.expressions[0], expressionManager.expressions, {
        label: "Expression",
    })
    expressionList.modified.add(() => {
        expressionManager.setExpression(expressionList.value)
    })

    // FIXME: TableEditMode shouldn't be part of SelectionModel
    // FIXME: also: this was a pain to find... :(
    const sm = new SelectionModel(TableEditMode.EDIT_CELL)
    return (
        <Tab label="Expression" value={TAB.EXPRESSION} style={{ overflow: "none" }}>
            <Form>
                <FormSelect model={expressionList} />
                <FormSwitch model={scene.wireframe}/>
            </Form>
            <Table selectionModel={sm} model={expressionManager.model} style={{ width: "487px", height: "100%" }} />
        </Tab>
    )
}
