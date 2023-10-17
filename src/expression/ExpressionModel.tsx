import { ExpressionManager } from "expression/ExpressionManager"
import { PoseNode } from "expression/PoseNode"
import { TableEvent, TableEventType, TableModel } from "toad.js"
import { Bone } from "skeleton/Bone"
import { NumberRelModel } from "./NumberRelModel"
import { ModelReason } from "toad.js/model/Model"
import { mat4 } from "gl-matrix"

export class ExpressionModel extends TableModel {
    poseUnits: NumberRelModel[] = []
    bone: PoseNode[] = []

    constructor(expressionManager: ExpressionManager) {
        super()
        // pose units
        // some pairs like LeftEyeDown, LeftEyeUp seem to suggest modifiers,
        // especially as we seem to have as many pose units for the face expressions
        // as bones
        // console.log(expressionManager)
        for (let name of expressionManager.facePoseUnitsNames.sort()) {
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

        // all face expression bones
        // (we have to use all below 'head' as face-poseunits.bvh also affects toes, which is a bug i guess)
        const faceBones = new Set<string>()
        foo(expressionManager.skeleton.bones.get("head")!)
        function foo(bone: Bone) {
            faceBones.add(bone.name)
            bone.children.forEach((child) => foo(child))
        }
       
        Array.from(faceBones)
            .sort()
            .forEach((name) => {
                const node = expressionManager.skeleton.poseNodes.find(name)
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

        // ALSO GENERATE OWN CHANGE NOTIFICATION WHEN THOSE MODELS CHANGE!!!
        // register dependencies from pose unit to bone
        const identity = mat4.create()
        const nBones = expressionManager.skeleton.boneslist!.length
        for (const pu of this.poseUnits) {
            const frame = expressionManager.poseUnitName2Frame.get(pu.label!)!
            for (let b_idx = 0; b_idx < nBones; ++b_idx) {
                const m = expressionManager.base_anim[frame * nBones + b_idx]
                if (!mat4.equals(m, identity)) {
                    const bone = expressionManager.skeleton.boneslist![b_idx]!
                    const node = expressionManager.skeleton.poseNodes.find(bone.name)!
                    pu.observe(node.x)
                    pu.observe(node.y)
                    pu.observe(node.z)
                }
            }
        }
    }
    override get colCount() {
        return 2
    }
    override get rowCount() {
        return Math.max(this.poseUnits.length, this.bone.length)
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
}
