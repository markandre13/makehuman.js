import { Modifier } from "./Modifier"

// 2 targets from the TargetFactory, value in [0, 1] or [-1, 1]
export class ManagedTargetModifier extends Modifier {
    left?: string
    right?: string

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
        throw Error("Not implemented")
        // value = self.clampValue(value)
        // factors = self.getFactors(value)

        // tWeights = getTargetWeights(self.targets, factors, value)
        // for tpath, tWeight in tWeights.items():
        //     self.human.setDetail(tpath, tWeight)

        // if skipDependencies:
        //     return

        // # Update dependent modifiers
        // self.propagateUpdate(realtime = False)

    }

    override getValue(): number {
        throw Error("Not implemented")
    }

    // weight for each factor, e.g. {'old':0.8,'young':0.2, 'child':0}
    override getFactors(value: number): any {
        throw Error("Not implemented")
        // return dict((name, getattr(self.human, name + 'Val'))
        //             for name in self._variables)

    }

    // get
}
