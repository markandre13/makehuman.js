import { TargetRef } from './TargetRef'
import { Human } from './Human'
import { getTargetWeights } from './getTargetWeights'

import { NumberModel } from 'toad.js'

// from apps/humanmodifier.py
export abstract class Modifier {
    human?: Human

    groupName: string
    name: string
    description: string
    value: number
    defaultValue: number
    model?: NumberModel

    // eventType

    targets: TargetRef[]

    verts?: number[]
    faces?: number[]

    macroVariable?: string
    macroDependencies?: Set<String>

    constructor(groupName: string, name: string) {
        this.groupName = groupName.replace('/', '-')
        this.name = name.replace('/', '-')
        this.description = ''

        this.value = 0
        this.defaultValue = 0
        this.targets = []
    }

    // set/add/link/assign modifier to human
    setHuman(human: Human) {
        this.human = human
        human.addModifier(this)
    }

    get fullName(): string {
        return `${this.groupName}/${this.name}`
    }

    getMin() {
        return 0.0
    }

    getMax() {
        return 1.0
    }

    setValue(value: number, {skipDependencies = false} = {}) {
        // console.log(`Modifier.setValue(${value}) // modifier ${this.fullName}`)
        const clampedValue = this.clampValue(value)
        const factors = this.getFactors(clampedValue)
        const tWeights = getTargetWeights(this.targets, factors, clampedValue)
        for(let x of tWeights)
            this.human!.setDetail(x[0], x[1])

        if (skipDependencies)
            return

        // Update dependent modifiers
        this.propagateUpdate(false)
    }

    resetValue(): number {
        const oldValue = this.getValue()
        this.setValue(this.getDefaultValue())
        return oldValue
    }

    propagateUpdate(realtime = false) {
        console.log('please note: Modifier.propagateUpdate is not implemented')
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

    abstract clampValue(value: number): number
    abstract getFactors(value: number): Map<string, number>

    getValue(): number {
        // return sum([self.human.getDetail(target[0]) for target in self.targets])
        let sum = 0
        for(let target of this.targets)
            sum += this.human!.getDetail(target.targetPath)
        return sum
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
        // console.log(`Modifier.updateValue() is not implemented // ${this.fullName}`)
        // if (this.verts === undefined && this.faces === undefined)
        //     this.buildLists()

        //    # Update detail state
        //    old_detail = [self.human.getDetail(target[0]) for target in self.targets]
        this.setValue(value, {skipDependencies: true})
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
        throw Error('Not implemented')
    }

    getSymmetricOpposite(): string|undefined {
        throw Error('Not implemented')
    }

    getSimilar(): any {
        throw Error('Not implemented')
    }

    isMacro() {
        return this.macroVariable !== undefined
    }

    getModel() {
        if (this.model === undefined) {
            this.model = new NumberModel(this.getDefaultValue(), { min: this.getMin(), max: this.getMax(), step: 0.05 })
        }
        return this.model
    }
}


