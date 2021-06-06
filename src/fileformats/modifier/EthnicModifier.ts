import { MacroModifier } from './MacroModifier'

export class EthnicModifier extends MacroModifier { 
    constructor(groupName: string, name: string) {
        super(groupName, name)
        this.defaultValue = 1/3
    }
}
