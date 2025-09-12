import { Modifier } from './Modifier'
import { getTargetWeights } from "./getTargetWeights"
// import { Target } from '../target/Target'
import { TargetRef } from './TargetRef'

// 2 targets from the TargetFactory, value in [0, 1] or [-1, 1]
export class ManagedTargetModifier extends Modifier {
    left?: string
    right?: string

    lTargets?: TargetRef[]
    cTargets?: TargetRef[]
    rTargets?: TargetRef[]

    constructor(groupName: string, name: string) {
        super(groupName, name)
    }

    override clampValue(value: number): number {
        value = Math.min(value)
        if (this.left !== undefined)
            value = Math.max(-1.0, value)

        else
            value = Math.max(0.0, value)
        return value
    }

    override setValue(value: number, { skipDependencies = false } = {}) {
        // console.log(`ManagedTargetModifier.setValue(${value})`)
        value = this.clampValue(value)
        const factors = this.getFactors(value)
        // console.log(factors)
        const targetWeights = getTargetWeights(this.targets, factors)
        // console.log(targetWeights)
  
        for(const weight of targetWeights) {
            // console.log(`ManagedTargetModifier.setValue(${value}) -> human.setDetail(${weight[0]}, ${weight[1]})`)
            this.morphManager!.setDetail(weight[0], weight[1])
        }

        if (skipDependencies)
            return

        // Update dependent modifiers
        this.propagateUpdate(false)
    }

    // ADD A UNIT TEST FOR THIS ONE
    override getValue(): number {
        // console.log(`ManagedTargetModifier.getValue() '${this.fullName}'`)
        if (this.rTargets) {
            let sum = 0
            for(let target of this.rTargets)
                sum += this.morphManager!.getDetail(target.targetPath) // FIXME: this is just a guess
            return sum
        }
        let sum = 0
        for(let target of this.lTargets!)
            sum += this.morphManager!.getDetail(target.targetPath) // FIXME: this is just a guess
        return sum
    }

    // return map of all Human's *Val attributes
    override getFactors(value: number): Map<string, number> {
        const result = new Map<string, number>()
        const desc = Object.getOwnPropertyDescriptors(this.morphManager)
        for(const name in desc) {
            if (!name.endsWith("Val"))
                continue
            result.set(
                name.substring(0, name.length - 3), // name without the 'Val' suffix
                desc[name].value.value)             // NumberModel.value
        }
        return result
    }
}
