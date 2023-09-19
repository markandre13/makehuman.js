import { ExpressionManager, calcWebGL } from "ExpressionManager"
import { TAB } from "HistoryManager"
import { HumanMesh, Update } from "mesh/HumanMesh"
import { Skeleton } from "skeleton/Skeleton"
import { NumberModel, SelectionModel, TableAdapter, TableEditMode, TableModel, TablePos } from "toad.js"
import { Table } from "toad.js/table/Table"
import { StringArrayModel } from "toad.js/table/model/StringArrayModel"
import { StringArrayAdapter } from "toad.js/table/adapter/StringArrayAdapter"

import { Tab } from "toad.js/view/Tab"
import { Text } from "toad.js/view/Text"
import { NumberModelOptions } from "toad.js/model/NumberModel"

class NumberRelModel extends NumberModel {
    constructor(value: number, options?: NumberModelOptions) {
        super(value, options)
        this.change = this.change.bind(this)
    }

    protected observed: NumberModel[] = []

    // note: relations can change at runtime
    observe(model: NumberModel) {
        this.observed.push(model)
        model.modified.add(this.change, this)
    }
    clear() {
        this.observed.forEach((it) => it.modified.remove(this))
        this.observed.length = 0
    }
    change() {
        let changed = false
        for (let observed of this.observed) {
            if (observed.value !== observed.options?.default) {
                changed = true
                break
            }
        }
        if (changed) {
            this.color = "italic"
        } else {
            if (this.value === this.options?.default) {
                // this.color = ""
                this.color = "bold"
            } else {
                // this.color = "#999"
                this.color = ""
            }
        }
    }

    override set value(value: number | string) {
        this.modified.withLock(() => {
            super.value = value
            this.change()
        })
    }
    override get value(): number {
        return super.value
    }
}

function obj2arr(obj: any, arr: NumberRelModel[]) {
    for (let name of Object.getOwnPropertyNames(obj)) {
        const value = obj[name]
        arr.push(
            new NumberRelModel(value, {
                label: name,
                min: 0,
                max: 1,
                step: 0.01,
                default: value,
            })
        )
    }
}

class ExpressionModel extends TableModel {
    poseUnit: NumberRelModel[] = []
    bone: NumberRelModel[] = []

    constructor() {
        super()
        const smile05 = {
            lowerLipDown: 0.177,
            RightCheekUp: 0.749,
            lowerLipBackward: 0.472,
            NasolabialDeepener: 0.839,
            UpperLipStretched: 0.658,
            LeftCheekUp: 0.759,
            RightLowerLidUp: 0.201,
            LeftLowerLidUp: 0.256,
            lowerLipUp: 0.01,
        } as any
        obj2arr(smile05, this.poseUnit)

        // all face expression bones
        const head = {
            "eye.L": 0.0,
            "eye.R": 0.0,
            jaw: 0.0,
            "levator02.L": 0.0,
            "levator02.R": 0.0,
            "levator03.L": 0.0,
            "levator03.R": 0.0,
            "levator04.L": 0.0,
            "levator04.R": 0.0,
            "levator05.L": 0.0,
            "levator05.R": 0.0,
            "levator06.L": 0.0,
            "levator06.R": 0.0,
            "oculi01.L": 0.0,
            "oculi01.R": 0.0,
            "oculi02.L": 0.0,
            "oculi02.R": 0.0,
            "orbicularis03.L": 0.0,
            "orbicularis03.R": 0.0,
            "orbicularis04.L": 0.0,
            "orbicularis04.R": 0.0,
            oris01: 0.0,
            oris02: 0.0,
            "oris03.L": 0.0,
            "oris03.R": 0.0,
            "oris04.L": 0.0,
            "oris04.R": 0.0,
            oris05: 0.0,
            oris06: 0.0,
            "oris06.L": 0.0,
            "oris06.R": 0.0,
            "oris07.L": 0.0,
            "oris07.R": 0.0,
            "risorius02.L": 0.0,
            "risorius02.R": 0.0,
            "risorius03.L": 0.0,
            "risorius03.R": 0.0,
            special01: 0.0,
            special03: 0.0,
            special04: 0.0,
            "special05.L": 0.0,
            "special05.R": 0.0,
            "special06.L": 0.0,
            "special06.R": 0.0,
            "temporalis01.L": 0.0,
            "temporalis01.R": 0.0,
            "temporalis02.L": 0.0,
            "temporalis02.R": 0.0,
            tongue00: 0.0,
            tongue01: 0.0,
            tongue02: 0.0,
            tongue03: 0.0,
            tongue04: 0.0,
            "tongue05.L": 0.0,
            "tongue05.R": 0.0,
            "tongue06.L": 0.0,
            "tongue06.R": 0.0,
            "tongue07.L": 0.0,
            "tongue07.R": 0.0,
        } as any
        obj2arr(head, this.bone)

        this.poseUnit[0].observe(this.bone[0])
        this.poseUnit[0].observe(this.bone[1])
    }
    override get colCount() {
        return 2
    }
    override get rowCount() {
        return Math.max(this.poseUnit.length, this.bone.length)
    }
}


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
                    cell.replaceChildren(...(<>{this.model.bone[pos.row].label}</>))
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
    const selectedExpression = new SelectionModel(TableEditMode.SELECT_ROW)
    const expressionModel = new StringArrayModel(expressionManager.expressions)
    const expressionModel2 = new ExpressionModel()
   
    selectedExpression.modified.add(() => {
        const pm = expressionManager.fromPoseUnit(selectedExpression.row)
        for (let boneIdx = 0; boneIdx < skeleton.boneslist!.length; ++boneIdx) {
            const bone = skeleton.boneslist![boneIdx]
            const mrg = bone.matRestGlobal!
            skeleton.boneslist![boneIdx].matPose = calcWebGL(pm[boneIdx], mrg)
        }
        skeleton.update()
        scene.updateRequired = Update.POSE
    })

    return (
        <Tab label="Expression" value={TAB.EXPRESSION} style={{ overflow: "none" }}>
            <Table
                model={expressionModel}
                selectionModel={selectedExpression}
                style={{ width: "100px", height: "100%" }}
            />
            <Table model={expressionModel2} style={{ width: "350px", height: "100%" }} />
        </Tab>
    )
}
