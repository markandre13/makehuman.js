import { ExpressionManager, calcWebGL } from "ExpressionManager"
import { TAB } from "HistoryManager"
import { HumanMesh, Update } from "mesh/HumanMesh"
import { Skeleton } from "skeleton/Skeleton"
import { SelectionModel, TableAdapter, TableEditMode, TableModel, TablePos, text } from "toad.js"
import { Table } from "toad.js/table/Table"
import { Tab } from "toad.js/view/Tab"

class StringArrayModel extends TableModel {
    protected data: string[]
    constructor(data: string[]) {
        super()
        this.data = data
    }
    override get colCount() {
        return 1
    }
    override get rowCount() {
        return this.data.length
    }
    get(row: number) {
        return this.data[row]
    }
}

class StringArrayAdapter extends TableAdapter<StringArrayModel> {
    override showCell(pos: TablePos, cell: HTMLSpanElement): void {
        cell.replaceChildren(text(this.model!.get(pos.row)))
    }
}
TableAdapter.register(StringArrayAdapter, StringArrayModel)

export default function (scene: HumanMesh, skeleton: Skeleton) {
    const expressionManager = new ExpressionManager(skeleton)
    const expressionModel = new StringArrayModel(expressionManager.expressions)
    const selectedExpression = new SelectionModel(TableEditMode.SELECT_ROW)
    selectedExpression.modified.add(() => {
        const pm = expressionManager.fromPoseUnit(selectedExpression.row)
        for (let boneIdx = 0; boneIdx < skeleton.boneslist!.length; ++boneIdx) {
            const bone = skeleton.boneslist![boneIdx]
            const mrg = bone.matRestGlobal!
            skeleton.boneslist![boneIdx].matPose = calcWebGL(pm[boneIdx], mrg)
        }
        skeleton.update()
        scene.updateRequired = Update.POSE

        // expressionManager.setExpression(selectedExpression.row, poseNodes)
        // skeleton.update()
        // scene.updateRequired = Update.POSE
    })

    return (
        <Tab label="Expression" value={TAB.EXPRESSION}>
            <Table
                model={expressionModel}
                selectionModel={selectedExpression}
                style={{ width: "100px", height: "100%" }}
            />
        </Tab>
    )
}
