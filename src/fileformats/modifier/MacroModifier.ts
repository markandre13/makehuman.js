import { ManagedTargetModifier } from './ManagedTargetModifier'
import { findTargets } from './findTargets'
import { findMacroDependencies } from './findMacroDependencies'
import { validCategories, valueToCategory } from '../target/Component'

import { NumberModel } from 'toad.js'

export class MacroModifier extends ManagedTargetModifier {
    constructor(groupName: string, name: string) {
        // e.g. macrodetails/Gender
        super(groupName, name)
        this.defaultValue = 0.5
        this.targets = findTargets(groupName)
        this.macroDependencies = findMacroDependencies(groupName)
        this.macroVariable = this.getMacroVariable()
        if (this.macroVariable) {
            // MacroModifier is not dependent on variable it controls itself
            this.macroDependencies.delete(this.macroVariable)
        }
    }

    // uh??? why not this.name?
    get variable() {
        return this.name
    }

    protected getMacroVariable(): string | undefined {
        if (this.variable) {
            let v = this.variable.toLowerCase()
            if (validCategories.indexOf(v) !== -1)
                return v
            if (valueToCategory.has(v))
                return valueToCategory.get(v)
        }
        return undefined
    }

    override getValue(): number {
        switch (this.name) {
            case "Gender":
                return this.human!.gender.value
            case "Age":
                return this.human!.age.value
            case "Muscle":
                return this.human!.muscle.value
            case "Weight":
                return this.human!.weight.value
            case "Height":
                return this.human!.height.value
            case "BodyProportions":
                return this.human!.bodyProportions.value
            case "BreastSize":
                return this.human!.breastSize.value
            case "BreastFirmness":
                return this.human!.breastFirmness.value
            case "African":
                return this.human!.afrianVal.value
            case "Asian":
                return this.human!.asianVal.value
            case "Caucasian":
                return this.human!.caucasianVal.value
        }
        console.log(`MacroModifier.getValue() for ${this.fullName} is not implemented`)
        return 0
    }

    override setValue(value: number, { skipDependencies = false } = {}): void {
        value = this.clampValue(value)
        this.human!.modified.lock()
        // getattr(self.human, self.setter)(value, updateModifier=False) // e.g. self.human.setGender()
        switch (this.name) {
            case "Gender":
                this.human!.gender.value = value
                this.human!._setGenderVals()
                break
            case "Age":
                this.human!.age.value = value
                this.human!._setAgeVals()
                break
            case "Muscle":
                this.human!.muscle.value = value
                this.human!._setMuscleVals()
                break
            case "Weight":
                this.human!.weight.value = value
                this.human!._setWeightVals()
                break
            case "Height":
                this.human!.height.value = value
                this.human!._setHeightVals()
                break
            case "BodyProportions":
                this.human!.bodyProportions.value = value
                this.human!._setBodyProportionVals()
                break
            case "BreastSize":
                this.human!.breastSize.value = value
                this.human!._setBreastSizeVals()
                break
            case "BreastFirmness":
                this.human!.breastFirmness.value = value
                this.human!._setBreastFirmnessVals()
                break
            case "African":
                this.human!.afrianVal.value = value
                this.human!._setEthnicVals(this.name)
                break
            case "Asian":
                this.human!.asianVal.value = value
                this.human!._setEthnicVals(this.name)
                break
            case "Caucasian":
                this.human!.caucasianVal.value = value
                this.human!._setEthnicVals(this.name)
                break
            default:
                console.log(`MacroModifier.setValue() for ${this.fullName} is not implemented (${this.groupName}, ${this.name})`)
        }
        this.human!.modified.unlock()
        // super(MacroModifier, self).setValue(value, skipDependencies)
        super.setValue(value, { skipDependencies })
    }

    override clampValue(value: number): number {
        return Math.max(0.0, Math.min(1.0, value))
    }

    override getFactors(value: number): Map<string, number> {
        const factors = super.getFactors(value)
        factors.set(this.groupName, 1.0)
        return factors
    }

    override buildLists(): void {
    }

    override getModel() {
        if (this.model !== undefined) {
            return this.model
        }
        if (this.human === undefined) {
            throw Error(`MacroModifier.getModel(): can only be called after human has been set`)
        }
        switch (this.name) {
            case "Gender":
                this.model = this.human.gender
                break
            case "Age":
                this.model = this.human.age
                break
            case "Muscle":
                this.model = this.human.muscle
                break
            case "Weight":
                this.model = this.human.weight
                break
            case "Height":
                this.model = this.human.height
                break
            case "BodyProportions":
                this.model = this.human.bodyProportions
                break
            case "BreastSize":
                this.model = this.human.breastSize
                break
            case "BreastFirmness":
                this.model = this.human.breastFirmness
                break
            case "African":
                this.model = this.human.afrianVal
                break
            case "Asian":
                this.model = this.human.asianVal
                break
            case "Caucasian":
                this.model = this.human.caucasianVal
                break
            default:
                throw Error(`MacroModifier.getModel(): not implemented for name '${this.name}'`)
        }
        return this.model
    }
}
