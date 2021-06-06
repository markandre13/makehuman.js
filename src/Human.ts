import { Modifier } from './fileformats/modifier/Modifier'
import { NumberModel } from 'toad.js/src/model/NumberModel'

// apps/human.py class Human
export class Human {  
    private modifiers: Map<string, Modifier>
    private modifierGroups: Map<string, Modifier[]>

    private targetsDetailStack: Map<string, number>

    private age = new NumberModel(0.5, {min: 0, max: 1})
    private gender = new NumberModel(0.5, {min: 0, max: 1})
    private weight = new NumberModel(0.5, {min: 0, max: 1})
    private muscle = new NumberModel(0.5, {min: 0, max: 1})
    private height = new NumberModel(0.5, {min: 0, max: 1})
    private breastSize = new NumberModel(0.5, {min: 0, max: 1})
    private breastFirmness = new NumberModel(0.5, {min: 0, max: 1})
    private bodyProportions = new NumberModel(0.5, {min: 0, max: 1})

    // the above values are transformed into the values below,
    // which are then used by the modifiers (which have code to
    // fetch values ending in 'Val' and the prefix being provided
    // through a string)

    private maleVal = new NumberModel(0)
    private femaleVal = new NumberModel(0)
    private oldVal = new NumberModel(0)
    private babyVal = new NumberModel(0)
    private youngVal = new NumberModel(0)
    private childVal = new NumberModel(0)
    private maxweightVal = new NumberModel(0)
    private minweightVal = new NumberModel(0)
    private averageweightVal = new NumberModel(0)
    private maxmuscleVal = new NumberModel(0)
    private minmuscleVal = new NumberModel(0)
    private averagemuscleVal = new NumberModel(0)
    private maxheightVal = new NumberModel(0)
    private minheightVal = new NumberModel(0)
    private averageheightVal = new NumberModel(0)
    private maxcupVal = new NumberModel(0)
    private mincupVal = new NumberModel(0)
    private averagecupVal = new NumberModel(0)
    private maxfirmnessVal = new NumberModel(0)
    private minfirmnessVal = new NumberModel(0)
    private averagefirmnessVal = new NumberModel(0)
    private idealproportionsVal = new NumberModel(0)
    private uncommonproportionsVal = new NumberModel(0)
    private regularproportionsVal = new NumberModel(0)
    private caucasianVal = new NumberModel(0)
    private asianVal = new NumberModel(0)
    private afrianVal = new NumberModel(0)

    constructor() {

        this.setDefaultValues()

        this.modifiers = new Map<string, Modifier>()
        this.modifierGroups = new Map<string, Modifier[]>()
        this.targetsDetailStack = new Map()
    }

    private static instance?: Human
    static getInstance(): Human {
        if (Human.instance === undefined)
        Human.instance = new Human()
        return Human.instance
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
        // console.log(`Human.addModifier(${modifier.fullName})`)
        //         if modifier.fullName in self._modifiers:
        if (this.modifiers.has(modifier.fullName)) {
            //             log.error("Modifier with name %s is already attached to human.", modifier.fullName)
            //             raise RuntimeError("Modifier with name %s is already attached to human." % modifier.fullName)
            throw Error(`Modifier with name ${modifier.fullName} is already attached to human.`)
        }

        //         self._modifier_type_cache = dict()
        //         self._modifiers[modifier.fullName] = modifier
        this.modifiers.set(modifier.fullName, modifier)
        
        //         if modifier.groupName not in self._modifier_groups:
        if (!this.modifierGroups.has(modifier.groupName)) {
        //             self._modifier_groups[modifier.groupName] = []
            this.modifierGroups.set(modifier.groupName, new Array<Modifier>())
        }

        //         self._modifier_groups[modifier.groupName].append(modifier)
        this.modifierGroups.get(modifier.groupName)!.push(modifier)

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
        // NOTE: no 'name=canonicalpath(name)' as the host filesystem is a detail to be ignored in the domain core
        // console.log(`Human.setDetail('${name}', ${value})`)
        if (value !== undefined) { // TODO: check if '&& isZero(value)' is a valid optimization
            this.targetsDetailStack.set(name, value)
        } else {
            this.targetsDetailStack.delete(name)
        }
    }

    getDetail(name: string): number {
        // NOTE: no 'name=canonicalpath(name)' as the host filesystem is a detail to be ignored in the domain core
        let value = this.targetsDetailStack.get(name)
        if (value === undefined)
            value = 0
        // console.log(`Human.getDetail('${name}') -> ${value}`)
        return value
    }

    setDefaultValues() {
        this.age.value = 0.5
        this.gender.value = 0.5
        this.weight.value = 0.5
        this.muscle.value = 0.5
        this.height.value = 0.5
        this.breastSize.value = 0.5
        this.breastFirmness.value = 0.5
        this.bodyProportions.value = 0.5

        this._setGenderVals()
        this._setAgeVals()
        this._setWeightVals()
        this._setMuscleVals()
        this._setHeightVals()
        this._setBreastSizeVals()
        this._setBreastFirmnessVals()
        this._setBodyProportionVals()

        this.caucasianVal.value = 1/3
        this.asianVal.value = 1/3
        this.afrianVal.value = 1/3
    }

    _setGenderVals() {
        this.maleVal.value = this.gender.value
        this.femaleVal.value = 1 - this.gender.value
    }

    _setAgeVals() {
        // New system (A8):
        // ----------------
        //
        // 1y       10y       25y            90y
        // baby    child     young           old
        // |---------|---------|--------------|
        // 0      0.1875      0.5             1  = age [0, 1]
        //
        // val ^     child young     old
        //   1 |baby\ / \ /   \    /
        //     |     \   \      /
        //     |    / \ / \  /    \ young
        //   0 ______________________________> age
        //        0  0.1875 0.5      1
        if (this.age.value < 0.5) {
            this.oldVal.value = 0.0
            this.babyVal.value = Math.max(0.0, 1 - this.age.value * 5.333)  // 1/0.1875 = 5.333
            this.youngVal.value = Math.max(0.0, (this.age.value-0.1875) * 3.2) // 1/(0.5-0.1875) = 3.2
            this.childVal.value = Math.max(0.0, Math.min(1.0, 5.333 * this.age.value) - this.youngVal.value)
        } else {
            this.childVal.value = 0.0
            this.babyVal.value = 0.0
            this.oldVal.value = Math.max(0.0, this.age.value * 2 - 1)
            this.youngVal.value = 1 - this.oldVal.value
        }
    }

    _setWeightVals() {
        this.maxweightVal.value = Math.max(0.0, this.weight.value * 2 - 1)
        this.minweightVal.value = Math.max(0.0, 1 - this.weight.value * 2)
        this.averageweightVal.value = 1 - (this.maxweightVal.value + this.minweightVal.value)
    }

    _setMuscleVals() {
        this.maxmuscleVal.value = Math.max(0.0, this.muscle.value * 2 - 1)
        this.minmuscleVal.value = Math.max(0.0, 1 - this.muscle.value * 2)
        this.averagemuscleVal.value = 1 - (this.maxmuscleVal.value + this.minmuscleVal.value)
    }

    _setHeightVals() {
        this.maxheightVal.value = Math.max(0.0, this.height.value * 2 - 1)
        this.minheightVal.value = Math.max(0.0, 1 - this.height.value * 2)
        if (this.maxheightVal.value > this.minheightVal.value) {
            this.averageheightVal.value = 1 - this.maxheightVal.value
        } else {
            this.averageheightVal.value = 1 - this.minheightVal.value
        }
    }

    _setBreastSizeVals() {
        this.maxcupVal.value = Math.max(0.0, this.breastSize.value * 2 - 1)
        this.mincupVal.value = Math.max(0.0, 1 - this.breastSize.value * 2)
        if (this.maxcupVal.value > this.mincupVal.value) {
            this.averagecupVal.value = 1 - this.maxcupVal.value
        } else {
            this.averagecupVal.value = 1 - this.mincupVal.value
        }
    }

    _setBreastFirmnessVals() {
        this.maxfirmnessVal.value = Math.max(0.0, this.breastFirmness.value * 2 - 1)
        this.minfirmnessVal.value = Math.max(0.0, 1 - this.breastFirmness.value * 2)

        if (this.maxfirmnessVal.value > this.minfirmnessVal.value) {
            this.averagefirmnessVal.value = 1 - this.maxfirmnessVal.value
        } else {
            this.averagefirmnessVal.value = 1 - this.minfirmnessVal.value
        }
    }

    _setBodyProportionVals() {
        this.idealproportionsVal.value = Math.max(0.0, this.bodyProportions.value * 2 - 1)
        this.uncommonproportionsVal.value = Math.max(0.0, 1 - this.bodyProportions.value * 2)

        if (this.idealproportionsVal > this.uncommonproportionsVal) {
            this.regularproportionsVal.value = 1 - this.idealproportionsVal.value
        } else {
            this.regularproportionsVal.value = 1 - this.uncommonproportionsVal.value
        }
    }

    updateProxyMesh(fitToPosed = false) {
        console.log("Human.updateProxyMesh with:")
        this.targetsDetailStack.forEach( (value, targetName) => console.log(`${targetName}=${value}`) )
        // if self.proxy and self.__proxyMesh:
        //     self.proxy.update(self.__proxyMesh, fit_to_posed)
        //     self.__proxyMesh.update()
    }

}
