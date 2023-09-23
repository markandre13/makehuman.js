import { ExpressionManager } from "expression/ExpressionManager"
import { TAB } from "HistoryManager"
import { HumanMesh, Update } from "mesh/HumanMesh"
import { Skeleton } from "skeleton/Skeleton"
import { OptionModel, Select, SelectionModel, TableAdapter, TableEditMode, TablePos } from "toad.js"
import { Table } from "toad.js/table/Table"
import { StringArrayModel } from "toad.js/table/model/StringArrayModel"
import { StringArrayAdapter } from "toad.js/table/adapter/StringArrayAdapter"

import { Tab } from "toad.js/view/Tab"
import { Text } from "toad.js/view/Text"
import { ExpressionModel } from "../expression/ExpressionModel"

class ExpressionAdapter extends TableAdapter<ExpressionModel> {
    override get colCount(): number {
        return 4
    }
    override getColumnHead(col: number) {
        switch (col) {
            case 0:
                return <>Pose Unit</>
            case 2:
                return <>Bone</>
        }
        return <>Value</>
    }
    override showCell(pos: TablePos, cell: HTMLSpanElement) {
        switch (pos.col) {
            case 0:
                if (pos.row < this.model.poseUnit.length) {
                    cell.replaceChildren(...(<>{this.model.poseUnit[pos.row].label}</>))
                }
                break
            case 1:
                if (pos.row < this.model.poseUnit.length) {
                    cell.replaceChildren(<Text style={{ width: "60px" }} model={this.model.poseUnit[pos.row]} />)
                }
                break
            case 2:
                if (pos.row < this.model.bone.length) {
                    const label = this.model.bone[pos.row].label
                    if (label !== undefined) {
                        cell.replaceChildren(...(<>{this.model.bone[pos.row].label}</>))
                    }
                }
                break
            case 3:
                if (pos.row < this.model.bone.length) {
                    cell.replaceChildren(<Text style={{ width: "60px" }} model={this.model.bone[pos.row]} />)
                }
                break
        }
    }
}
TableAdapter.register(StringArrayAdapter, StringArrayModel)
TableAdapter.register(ExpressionAdapter, ExpressionModel)

export default function (scene: HumanMesh, skeleton: Skeleton) {
    const expressionManager = new ExpressionManager(skeleton)
    const model = new OptionModel(expressionManager.expressions[0], expressionManager.expressions)
    model.modified.add((expression) => {
        expressionManager.setExpression(expression)
        scene.updateRequired = Update.POSE
    })
    const expressionModel2 = expressionManager.model
    return (
        <Tab label="Expression" value={TAB.EXPRESSION} style={{ overflow: "none" }}>
            Expression <Select model={model}/><br/>
            <Table model={expressionModel2} style={{ width: "350px", height: "100%" }} />
        </Tab>
    )
}
