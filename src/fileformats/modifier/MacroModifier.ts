import { ManagedTargetModifier } from './ManagedTargetModifier'
import { findTargets } from './findTargets'
import { findMacroDependencies } from './findMacroDependencies'
import { validCategories, valueToCategory } from '../target/Component'

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
            // case "African":
            //     return this.human!.
            // case "Asian":
            //     return this.human!.breastFirmness.value
            // case "Caucasian":
            //     return this.human!.breastFirmness.value
        }
        console.log(`MacroModifier.getValue() for ${this.fullName} is not implemented`)
        return 0
    }

    override setValue(value: number, { skipDependencies = false } = {}): void {
        value = this.clampValue(value)
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
            default:
                console.log(`MacroModifier.setValue() for ${this.fullName} is not implemented (${this.groupName}, ${this.name})`)
        }
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
}
