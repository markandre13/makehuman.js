import { TAB } from "HistoryManager"
import { OptionModel, SelectionModel, TableEditMode } from "toad.js"
import { Table } from "toad.js/table/Table"

import { Tab } from "toad.js/view/Tab"
import { Form } from "toad.js/view/Form"
import { FormSwitch } from "toad.js/view/FormSwitch"
import { FormSelect } from "toad.js/view/FormSelect"
import { Application, setRenderer } from "Application"
import { RenderHuman } from "render/renderHuman"

export default function (props: { app: Application }) {
    const expressionList = new OptionModel(
        props.app.expressionManager.expressions[0],
        props.app.expressionManager.expressions,
        {
            label: "Expression",
        }
    )
    expressionList.modified.add(() => {
        props.app.expressionManager.setExpression(expressionList.value)
    })

    // FIXME: TableEditMode shouldn't be part of SelectionModel
    // FIXME: also: this was a pain to find... :(
    const sm = new SelectionModel(TableEditMode.EDIT_CELL)
    return (
        <Tab
            label="Expression"
            value={TAB.EXPRESSION}
            style={{ overflow: "none" }}
            visibilityChange={setRenderer(props.app, new RenderHuman())}
        >
            <Form>
                <FormSelect model={expressionList} />
                <FormSwitch model={props.app.humanMesh.wireframe} />
            </Form>
            <Table
                selectionModel={sm}
                model={props.app.expressionManager.model}
                style={{ width: "487px", height: "100%" }}
            />
        </Tab>
    )
}
