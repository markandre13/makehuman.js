import { ExpressionManager } from "expression/ExpressionManager"
import { TAB } from "HistoryManager"
import { HumanMesh } from "mesh/HumanMesh"
import {
    NumberModel,
    OptionModel,
    Select,
    SelectionModel,
    Switch,
    TableAdapter,
    TableEditMode,
    TablePos,
} from "toad.js"
import { Table } from "toad.js/table/Table"
import { StringArrayModel } from "toad.js/table/model/StringArrayModel"
import { StringArrayAdapter } from "toad.js/table/adapter/StringArrayAdapter"

import { Tab } from "toad.js/view/Tab"
import { ExpressionModel } from "../expression/ExpressionModel"
import { Form, FormField, FormHelp, FormLabel } from "toad.js/view/Form"

class ExpressionAdapter extends TableAdapter<ExpressionModel> {
    constructor(model: ExpressionModel) {
        super(model)
        // this.config.editMode = EditMode.EDIT_ON_ENTER
    }
    override get colCount(): number {
        return 6
    }
    override getColumnHead(col: number) {
        switch (col) {
            case 0:
                return <>Pose Unit</>
            case 2:
                return <>Bone</>
            case 3:
                return <>X</>
            case 4:
                return <>Y</>
            case 5:
                return <>Z</>
        }
        return <>Value</>
    }

    protected static wheel(model: NumberModel, e: WheelEvent) {
        // console.log(`wheel event for model ${model.label}`)
        e.preventDefault()
        if (e.deltaY > 0) {
            model.decrement()
        }
        if (e.deltaY < 0) {
            model.increment()
        }
    }

    override showCell(pos: TablePos, cell: HTMLSpanElement) {
        // cell.style.padding = "1px" // DON'T: this breaks Table's layout algorithm
        switch (pos.col) {
            case 0:
                if (pos.row < this.model.poseUnits.length) {
                    cell.innerText = this.model.poseUnits[pos.row].label!
                }
                break
            case 1:
                if (pos.row < this.model.poseUnits.length) {
                    const poseUnit = this.model.poseUnits[pos.row]
                    cell.style.width = "50px"
                    cell.style.textAlign = "right"
                    cell.innerText = poseUnit.value.toString()
                    const model = this.model.poseUnits[pos.row]
                    model.applyStyle(cell)
                    cell.onwheel = (event: WheelEvent) => ExpressionAdapter.wheel(this.model.poseUnits[pos.row], event)
                    cell.ondblclick = () => model.resetToDefault()
                }
                break
            case 2:
                if (pos.row < this.model.bone.length) {
                    const label = this.model.bone[pos.row].x.label
                    if (label !== undefined) {
                        cell.innerText = label
                    }
                }
                break
            case 3:
                if (pos.row < this.model.bone.length) {
                    cell.style.width = "50px"
                    cell.style.textAlign = "right"
                    const model = this.model.bone[pos.row].x
                    cell.innerText = model.value.toString()
                    model.applyStyle(cell)
                    cell.onwheel = (event: WheelEvent) => ExpressionAdapter.wheel(model, event)
                    cell.ondblclick = () => model.resetToDefault()
                }
                break
            case 4:
                if (pos.row < this.model.bone.length) {
                    cell.style.width = "50px"
                    cell.style.textAlign = "right"
                    const model = this.model.bone[pos.row].y
                    cell.innerText = model.value.toString()
                    model.applyStyle(cell)
                    cell.onwheel = (event: WheelEvent) => ExpressionAdapter.wheel(model, event)
                    cell.ondblclick = () => model.resetToDefault()
                }
                break
            case 5:
                if (pos.row < this.model.bone.length) {
                    cell.style.width = "50px"
                    cell.style.textAlign = "right"
                    const model = this.model.bone[pos.row].z
                    cell.innerText = model.value.toString()
                    model.applyStyle(cell)
                    cell.onwheel = (event: WheelEvent) => ExpressionAdapter.wheel(model, event)
                    cell.ondblclick = () => model.resetToDefault()
                }
                break
        }
    }
    // override editCell(pos: TablePos, cell: HTMLSpanElement): void {

    // }
    override saveCell(pos: TablePos, cell: HTMLSpanElement): void {
        switch (pos.col) {
            case 1:
                this.model.poseUnits[pos.row].value = parseFloat(cell.innerText)
                break
            case 3:
                // console.log(
                //     `saveCell ${pos.col}, ${pos.row}, x from ${this.model.bone[pos.row].x.value} to ${parseFloat(
                //         cell.innerText
                //     )})`
                // )
                this.model.bone[pos.row].x.value = parseFloat(cell.innerText)
                break
            case 4:
                // console.log(
                //     `saveCell ${pos.col}, ${pos.row}, y from ${this.model.bone[pos.row].y.value} to ${parseFloat(
                //         cell.innerText
                //     )})`
                // )
                this.model.bone[pos.row].y.value = parseFloat(cell.innerText)
                break
            case 5:
                // console.log(
                //     `saveCell ${pos.col}, ${pos.row}, z from ${this.model.bone[pos.row].z.value} to ${parseFloat(
                //         cell.innerText
                //     )})`
                // )
                this.model.bone[pos.row].z.value = parseFloat(cell.innerText)
                break
        }
    }
}
TableAdapter.register(StringArrayAdapter, StringArrayModel)
TableAdapter.register(ExpressionAdapter, ExpressionModel)

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
                <FormLabel model={expressionList} />
                <FormField>
                    <Select model={expressionList} />
                </FormField>
                <FormHelp model={expressionList} />

                <FormLabel model={scene.wireframe} />
                <FormField>
                    <Switch model={scene.wireframe} />
                </FormField>
                <FormHelp model={scene.wireframe} />
            </Form>
            <Table selectionModel={sm} model={expressionManager.model} style={{ width: "487px", height: "100%" }} />
        </Tab>
    )
}
