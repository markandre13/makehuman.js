import { Modifier } from "./fileformats/modifier/Modifier"

export class Human {  
    private modifiers: Map<string, Modifier>
    private modifierGroups: Map<string, Modifier[]>

    private targetsDetailStack: Map<string, number>

    // private age: NumberModel
    // private gender: NumberModel
    // private weight: NumberModel
    // private muscle: NumberModel
    // private height: NumberModel
    // private breastSize: NumberModel
    // private breastFirmness: NumberModel
    // private bodyProportions: NumberModel
    // the above values are transformed into the values below,
    // which are then used by the modifiers (which have code to
    // fetch values ending in 'Val' and the prefix being provided
    // through a string)
    // maleVal, femaleVal
    // oldVal, babyVal, youngVal, childVal
    // maxweightVal, minweightVal, averageweightVal
    // maxmuscleVal, minmuscleVal, averagemuscleVal
    // maxheightVal, minheightVal, averageheightVal
    // maxcupVal, mincupVal, averagecupVal
    // maxfirmnessVal, minfirmnessVal, averagefirmnessVal
    // idealproportionsVal, uncommonproportionsVal, regularproportionsVal
    // private caucasianVal, asianVal, afrianVal
    constructor() {
        this.modifiers = new Map<string, Modifier>()
        this.modifierGroups = new Map<string, Modifier[]>()
        this.targetsDetailStack = new Map()

        // TODO: this includes toad.js/src/view.ts, which requires HTMLElement
        // this.age = new NumberModel(0.5, {})
        // this.gender = new NumberModel(0.5, {})
        // this.weight = new NumberModel(0.5, {})
        // this.muscle = new NumberModel(0.5, {})
        // this.height = new NumberModel(0.5, {})
        // this.breastSize = new NumberModel(0.5, {})
        // this.breastFirmness = new NumberModel(0.5, {})
        // this.bodyProportions = new NumberModel(0.5, {})
        // this.caucasianVal = new NumberModel(1.0/3.0, {})
        // this.asianVal = new NumberModel(1.0/3.0, {})
        // this.afrianVal = new NumberModel(1.0/3.0, {})
    }

    getModifier(name: string): Modifier | undefined {
        return this.modifiers.get(name)
    }

    getModifiersByGroup(groupName: string): Modifier[] {
        const group = this.modifierGroups.get(groupName)
        if (group === undefined) {
            console.log(`Modifier group ${groupName} does not exist.`)
            return []
        }
        return group
    }

    addModifier(modifier: Modifier) {
        //         if modifier.fullName in self._modifiers:
        if (this.modifiers.has(modifier.fullName))
            //             log.error("Modifier with name %s is already attached to human.", modifier.fullName)
            //             raise RuntimeError("Modifier with name %s is already attached to human." % modifier.fullName)
            throw Error(`Modifier with name ${modifier.fullName} is already attached to human.`)
        //         self._modifier_type_cache = dict()
        //         self._modifiers[modifier.fullName] = modifier
        this.modifiers.set(modifier.fullName, modifier)
        //         if modifier.groupName not in self._modifier_groups:
        if (!this.modifierGroups.has(modifier.groupName))
            //             self._modifier_groups[modifier.groupName] = []
            this.modifierGroups.set(modifier.groupName, new Array<Modifier>())
        //         self._modifier_groups[modifier.groupName].append(modifier)
        this.modifierGroups.get(modifier.groupName)!!.push(modifier)
        //         # Update dependency mapping
        //         if modifier.macroVariable and modifier.macroVariable != 'None':
        //             if modifier.macroVariable in self._modifier_varMapping and \
        //                self._modifier_varMapping[modifier.macroVariable] != modifier.groupName:
        //                 log.error("Error, multiple modifier groups setting var %s (%s and %s)", modifier.macroVariable, modifier.groupName, self._modifier_varMapping[modifier.macroVariable])
        //             else:
        //                 self._modifier_varMapping[modifier.macroVariable] = modifier.groupName
        //                 # Update any new backwards references that might be influenced by this change (to make it independent of order of adding modifiers)
        //                 toRemove = set()  # Modifiers to remove again from backwards map because they belogn to the same group as the modifier controlling the var
        //                 dep = modifier.macroVariable
        //                 for affectedModifierGroup in self._modifier_dependencyMapping.get(dep, []):
        //                     if affectedModifierGroup == modifier.groupName:
        //                         toRemove.add(affectedModifierGroup)
        //                         #log.debug('REMOVED from backwards map again %s', affectedModifierGroup)
        //                 if len(toRemove) > 0:
        //                     if len(toRemove) == len(self._modifier_dependencyMapping[dep]):
        //                         del self._modifier_dependencyMapping[dep]
        //                     else:
        //                         for t in toRemove:
        //                             self._modifier_dependencyMapping[dep].remove(t)
        //         for dep in modifier.macroDependencies:
        //             groupName = self._modifier_varMapping.get(dep, None)
        //             if groupName and groupName == modifier.groupName:
        //                 # Do not include dependencies within the same modifier group
        //                 # (this step might be omitted if the mapping is still incomplete (dependency is not yet mapped to a group), and can later be fixed by removing the entry again from the reverse mapping)
        //                 continue
        //             if dep not in self._modifier_dependencyMapping:
        //                 self._modifier_dependencyMapping[dep] = []
        //             if modifier.groupName not in self._modifier_dependencyMapping[dep]:
        //                 self._modifier_dependencyMapping[dep].append(modifier.groupName)
        //             if modifier.isMacro():
        //                 self.updateMacroModifiers()
    }

    setDetail(name: string, value: number|undefined) {
        // TODO: name to canonicalpath
        if (value !== undefined) {
            this.targetsDetailStack.set(name, value)
        } else {
            this.targetsDetailStack.delete(name)
        }
    }

    getDetail(name: string): number {
        // TODO: name to canonicalpath
        const value = this.targetsDetailStack.get(name)
        if (value === undefined)
            return 0.0
        return value
    }
}
