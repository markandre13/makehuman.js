import { ManagedTargetModifier } from './ManagedTargetModifier'

export class MacroModifier extends ManagedTargetModifier {
    constructor(groupName: string, name: string) {
        super(groupName, name)
        this.defaultValue = 0.5
    }

    override getValue(): number {
        console.log(`MacroModifier.getValue() for ${this.fullName} is not implemented`)
        return 0
    }

    override setValue(value: number): void {
        console.log(`MacroModifier.setValue() for ${this.fullName} is not implemented`)
    }
}
