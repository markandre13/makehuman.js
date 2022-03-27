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
        return this.getModel().value
    }

    override setValue(value: number, { skipDependencies = false } = {}): void {
        value = this.clampValue(value)
        this.getModel().value = value
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
