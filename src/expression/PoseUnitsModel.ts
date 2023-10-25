import { PoseNode } from "expression/PoseNode"
import { TableEvent, TableEventType, TableModel } from "toad.js"
import { NumberRelModel } from "./NumberRelModel"
import { Skeleton } from "skeleton/Skeleton"

export class PoseUnitsModel extends TableModel {
    poseUnits: NumberRelModel[] = []
    bone: PoseNode[] = []

    getRelevantBones(skeleton: Skeleton): Set<string> {
        throw Error("not implemented")
    }

    clear() {
        for (let poseUnit of this.poseUnits) {
            poseUnit.value = 0
            poseUnit.default = 0
        }
    }

    setPoseUnit(name: string, weight: number) {
        for (let pu of this.poseUnits) {
            if (pu.label === name) {
                pu.value = pu.default = weight
                break
            }
        }
    }

    // set poseUnits from facePoseUnitsNames
    protected createPoseUnits(facePoseUnitsNames: string[]) {
        for (let name of facePoseUnitsNames.sort()) {
            const value = 0
            const poseUnitModel = new NumberRelModel(value, {
                label: name,
                min: 0,
                max: 1,
                step: 0.05,
                default: value, 
            })
            const row = this.poseUnits.length
            poseUnitModel.modified.add((reason) => {
                // FIXME: propagate the reason
                this.modified.trigger(new TableEvent(TableEventType.CELL_CHANGED, 1, row))
            })
            this.poseUnits.push(poseUnitModel)
        }
    }

    protected observeBones(faceBones: Set<string>, skeleton: Skeleton) {
        Array.from(faceBones)
        .sort()
        .forEach((name) => {
            const node = skeleton.poseNodes.find(name)
            if (node === undefined) {
                console.log(`failed to find node for '${name}'`)
            } else {
                node.x.label = node.y.label = node.z.label = name
                const row = this.bone.length
                this.bone.push(node)
                node.x.modified.add(() => {
                    this.modified.trigger(new TableEvent(TableEventType.CELL_CHANGED, 3, row))
                })
                node.y.modified.add(() => {
                    this.modified.trigger(new TableEvent(TableEventType.CELL_CHANGED, 4, row))
                })
                node.z.modified.add(() => {
                    this.modified.trigger(new TableEvent(TableEventType.CELL_CHANGED, 5, row))
                })
            }
        })
    }

    override get colCount() {
        return 2
    }
    override get rowCount() {
        return Math.max(this.poseUnits.length, this.bone.length)
    }
}


