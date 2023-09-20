import { ExpressionManager } from "expression/ExpressionManager"
import { TableModel } from "toad.js"
import { Bone } from "skeleton/Bone"
import { NumberRelModel } from "./NumberRelModel"

export class ExpressionModel extends TableModel {
    poseUnit: NumberRelModel[] = [];
    bone: NumberRelModel[] = [];

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

    clear() {
        for(let pu of this.poseUnit) {
            pu.value = 0
            pu.default = 0
        }
    }

    setPoseUnit(name: string, weight: number) {
        for(let pu of this.poseUnit) {
            if (pu.label === name) {
                pu.value = pu.default = weight
                break
            }
        }
    }
}
