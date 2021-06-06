import { Modifier } from './Modifier'
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
        console.log(`ManagedTargetModifier.setValue(${value})`)
        value = this.clampValue(value)
        const factors = this.getFactors(value)
        const tWeights = getTargetWeights(this.targets, factors)
        console.log(value)
        console.log(factors)
        console.log(tWeights)
        for(const weight of tWeights) {
            this.human!.setDetail(weight[0], weight[1])
        }

        if (skipDependencies)
            return

        // Update dependent modifiers
        this.propagateUpdate(false)
    }

    // ADD A UNIT TEST FOR THIS ONE
    override getValue(): number {
        console.log(`ManagedTargetModifier.getValue() '${this.fullName}'`)
        if (this.rTargets) {
            let sum = 0
            for(let target of this.rTargets)
                sum += this.human!.getDetail(target.factorDependencies[0]) // FIXME: this is just a guess
            return sum
        }
        let sum = 0
        for(let target of this.lTargets!)
            sum += this.human!.getDetail(target.factorDependencies[0]) // FIXME: this is just a guess
        return sum
    }

    // return map of all Human's *Val attributes
    override getFactors(value: number): Map<string, number> {
        const result = new Map<string, number>()
        const desc = Object.getOwnPropertyDescriptors(this.human)
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

// {'data/targets/buttocks/buttocks-volume-decr.target': -0.0, 'data/targets/buttocks/buttocks-volume-incr.target': 0.5}
export function getTargetWeights(targets: TargetRef[], factors: Map<string, number>, value = 1.0, ignoreNotfound = false) {
    // console.log(`getTargetWeights(..,..,${value}, ${ignoreNotfound})"`)
    const result = new Map<string, number>()
    if (ignoreNotfound) {
        targets.forEach( (e) => {
            // console.log([1, 2, 5].reduce( (a, v) => a*v))
            // for factors in tfactors
            let mul = 1
            e.factorDependencies.forEach( factor => {
                const f = factors.get(factor)
                if (f !== undefined)
                    mul *= f
            })
            result.set(e.targetPath, value * mul)
        })
        //     for (tpath, tfactors) in targets:
        //         result[tpath] = value * reduce(operator.mul, [factors.get(factor, 1.0) for factor in tfactors])
    } else {
        targets.forEach( (e) => {
            // console.log([1, 2, 5].reduce( (a, v) => a*v))
            // for factors in tfactors
            let mul = 1
            e.factorDependencies.forEach( factor => {
                mul *= factors.get(factor)!
            })
            result.set(e.targetPath, value * mul)
        })
    }
    // console.log(result)
    return result
}