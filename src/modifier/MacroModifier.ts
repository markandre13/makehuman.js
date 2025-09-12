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

    protected getMacroVariable(): string | undefined {
        if (this.name) {
            let v = this.name.toLowerCase()
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
        // console.log(`MacroModifier(${this.fullName}).setValue(${value})`)
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
        if (this.morphManager === undefined) {
            throw Error(`MacroModifier.getModel(): can only be called after human has been set`)
        }
        switch (this.name) {
            case "Gender":
                this.model = this.morphManager.gender
                break
            case "Age":
                this.model = this.morphManager.age
                break
            case "Muscle":
                this.model = this.morphManager.muscle
                break
            case "Weight":
                this.model = this.morphManager.weight
                break
            case "Height":
                this.model = this.morphManager.height
                break
            case "BodyProportions":
                this.model = this.morphManager.bodyProportions
                break
            case "BreastSize":
                this.model = this.morphManager.breastSize
                break
            case "BreastFirmness":
                this.model = this.morphManager.breastFirmness
                break
            case "African":
                this.model = this.morphManager.africanVal
                break
            case "Asian":
                this.model = this.morphManager.asianVal
                break
            case "Caucasian":
                this.model = this.morphManager.caucasianVal
                break
            default:
                throw Error(`MacroModifier.getModel(): not implemented for name '${this.name}'`)
        }
        return this.model
    }
}
