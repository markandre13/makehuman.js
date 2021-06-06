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
        value = this.clampValue(value)
        const factors = this.getFactors(value)

        const tWeights = getTargetWeights(this.targets, factors, value)
        // for tpath, tWeight in tWeights.items():
        //     self.human.setDetail(tpath, tWeight)

        // if skipDependencies:
        //     return

        // # Update dependent modifiers
        // self.propagateUpdate(realtime = False)

    }

    override getValue(): number {
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

    // weight for each factor, e.g. {'old':0.8,'young':0.2, 'child':0}
    override getFactors(value: number): any {
        throw Error('Not implemented')
        // return dict((name, getattr(self.human, name + 'Val'))
        //             for name in self._variables)

    }

    // get
}

function getTargetWeights(targets: TargetRef[], factors: any, value = 1.0, ignoreNotfound = false) {
    const result = new Map<string, number>()
    if (ignoreNotfound) {
        targets.forEach( (e) => {
            result.set(e.targetPath, value )
        })
    //     for (tpath, tfactors) in targets:
    //         result[tpath] = value * reduce(operator.mul, [factors.get(factor, 1.0) for factor in tfactors])
    } else {
    //     for (tpath, tfactors) in targets:
    //         result[tpath] = value * reduce(operator.mul, [factors[factor] for factor in tfactors])
    }
    return result
}