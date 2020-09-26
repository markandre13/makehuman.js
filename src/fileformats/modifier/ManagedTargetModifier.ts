import { Modifier } from "./Modifier"

// 2 targets from the TargetFactory, value in [0, 1] or [-1, 1]
export class ManagedTargetModifier extends Modifier {
    left?: string
    right?: string

    constructor(groupName: string, name: string) {
        super(groupName, name)
    }

    clampValue(value: number): number {
        value = Math.min(value)
        if (this.left !== undefined)
            value = Math.max(-1.0, value)

        else
            value = Math.max(0.0, value)
        return value
    }

    setValue(value: number, { skipDependencies = false } = {}) {
        throw Error("Not implemented")
    }

    getValue(): number {
        throw Error("Not implemented")
    }

    getFactors(value: number): any {
        throw Error("Not implemented")
    }
}
