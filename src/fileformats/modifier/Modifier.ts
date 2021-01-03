import { Target } from "../target/Target"
import { TargetRef } from "./TargetRef"
import { Human } from "../../Human"

// from apps/humanmodifier.py
export class Modifier {
    groupName: string
    name: string
    description: string
    value: number
    defaultValue: number

    // eventType

    targets: TargetRef[]

    verts?: number[]
    faces?: number[]

    macroVariable: any
    macroDependencies: any[]

    human?: Human

    constructor(groupName: string, name: string) {
        this.groupName = groupName.replace('/', '-')
        this.name = name.replace('/', '-')
        this.description = ""

        this.value = 0
        this.defaultValue = 0
        this.targets = []
        this.macroVariable = undefined
        this.macroDependencies = []
    }

    setHuman(human: Human) {
        this.human = human
    }

    get fullName (): string {
        return `${this.groupName}/${this.name}`
    }

    getMin() {
        return 0.0
    }

    getMax() {
        return 1.0
    }

    setValue(value: number, {skipDependencies = false} = {}) {
        throw Error("Not implemented")
        const clampledValue = this.clampValue(value)
        // const factors = this.getFactors(clampledValue)
        // tWeights = getTargetWeights(self.targets, factors, clampledValue)
        // for tpath, tWeight in tWeights.items():
        //     self.human.setDetail(tpath, tWeight)

        // if skipDependencies:
        //     return

        // # Update dependent modifiers
        this.propagateUpdate(false)
    }

    resetValue(): number {
        const oldValue = this.getValue()
        this.setValue(this.getDefaultValue())
        return oldValue
    }

    propagateUpdate(realtime = false) {
        throw Error("Not implemented")
        // let f
        // if (realtime)
        //     f = realtimeDependencyUpdates
        // else
        //     f = None

        // for (const dependentModifierGroup of self.human.getModifiersAffectedBy(this, filter = f)) {
        //     // Only updating one modifier in a group should suffice to update the
        //     // targets affected by the entire group.
        //     const m = this.human.getModifiersByGroup(dependentModifierGroup)[0]
        //     if (realtime)
        //         m.updateValue(m.getValue(), skipUpdate = True)
        //     else
        //         m.setValue(m.getValue(), skipDependencies = True)
        // }
    }

    clampValue(value: number) {
        throw Error("Not implemented")
    }

    getFactors(value: number): any {
        throw Error("Not implemented")
    }

    getValue(): number {
        // return sum([self.human.getDetail(target[0]) for target in self.targets])
        throw Error("Not implemented")
    }

    getDefaultValue(): number {
        return this.defaultValue
    }

    buildLists() {
        if (this.verts !== undefined || this.faces !== undefined)
            return
        for (const target in this.targets) {

        }        
    }

    updateValue(value: number, {updateNormals = 1, skipUpdate = false} = {} ) {
        throw Error("Not implemented")
        // if (this.verts === undefined && this.faces === undefined)
        //     this.buildLists()

//    # Update detail state
//    old_detail = [self.human.getDetail(target[0]) for target in self.targets]
//    self.setValue(value, skipDependencies = True)
//    new_detail = [self.human.getDetail(target[0]) for target in self.targets]

//    # Apply changes
//    for target, old, new in zip(self.targets, old_detail, new_detail):
//        if new == old:
//            continue
//        if self.human.isPosed():
//            # Apply target with pose transformation
//            animatedMesh = self.human
//        else:
//            animatedMesh = None
//        algos3d.loadTranslationTarget(self.human.meshData, target[0], new - old, None, 0, 0, animatedMesh=animatedMesh)

//    if skipUpdate:
//        # Used for dependency updates (avoid dependency loops and double updates to human)
//        return

//    # Update dependent modifiers
//    self.propagateUpdate(realtime = True)

//    # Update vertices
//    if updateNormals:
//        self.human.meshData.calcNormals(1, 1, self.verts, self.faces)
//    self.human.meshData.update()
//    event = events3d.HumanEvent(self.human, self.eventType)
//    event.modifier = self.fullName
//    self.human.callEvent('onChanging', event)
    }

    getSymmetrySide(): string|undefined {
        throw Error("Not implemented")
    }

    getSymmetricOpposite(): string|undefined {
        throw Error("Not implemented")
    }

    getSimilar(): any {
        throw Error("Not implemented")
    }

    isMacro() {
        return this.macroVariable === undefined
    }
}

