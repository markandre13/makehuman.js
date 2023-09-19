import { ExpressionManager, calcWebGL } from "ExpressionManager"
import { TAB } from "HistoryManager"
import { HumanMesh, Update, isZero } from "mesh/HumanMesh"
import { Skeleton } from "skeleton/Skeleton"
import { NumberModel, SelectionModel, TableAdapter, TableEditMode, TableModel, TablePos } from "toad.js"
import { Table } from "toad.js/table/Table"
import { StringArrayModel } from "toad.js/table/model/StringArrayModel"
import { StringArrayAdapter } from "toad.js/table/adapter/StringArrayAdapter"

import { Tab } from "toad.js/view/Tab"
import { Text } from "toad.js/view/Text"
import { NumberModelOptions } from "toad.js/model/NumberModel"
import { Bone } from "skeleton/Bone"

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

    constructor(expressionManager: ExpressionManager) {
        super()

        // pose units
        // some pairs like LeftEyeDown, LeftEyeUp seem to suggest modifiers,
        // especially as we seem to have as many pose units for the face expressions
        // as bones

        // console.log(expressionManager)

        for (let name of expressionManager.facePoseUnitsNames.sort()) {
            const value = 0
            this.poseUnit.push(
                new NumberRelModel(
                    0,
                    new NumberRelModel(value, {
                        label: name,
                        min: 0,
                        max: 1,
                        step: 0.01,
                        default: value,
                    })
                )
            )
        }

        // all face expression bones
        // (we have to use all below 'head' as face-poseunits.bvh also affects toes, which is a bug i guess)
        const faceBones = new Set<string>()
        foo(expressionManager.skeleton.bones.get("head")!)
        function foo(bone: Bone) {
            faceBones.add(bone.name)
            bone.children.forEach((child) => foo(child))
        }
        Array.from(faceBones).sort().forEach((name) => {
            const value = 0
            this.bone.push(
                new NumberRelModel(
                    0,
                    new NumberRelModel(value, {
                        label: name,
                        min: 0,
                        max: 1,
                        step: 0.01,
                        default: value,
                    })
                )
            )
        })

        // calculate depenndencies from pose unit to bone
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
    const expressionModel2 = new ExpressionModel(expressionManager)

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
