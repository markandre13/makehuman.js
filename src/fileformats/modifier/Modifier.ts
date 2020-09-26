import { Target } from "../target/Target"
// import * as path from 'path'

class Human {

}

// interface NamedParameters {
//     updateNormals: number
//     skipUpdate: boolean
// }

class Modifier {
    groupName: string
    name: string
    description: string
    value: number
    defaultValue: number

    // eventType

    // verts
    // faces
    targets: Target[]

    macroVariable: any
    macroDependencies: any[]


    constructor(groupName: string, name: string) {
        this.groupName = groupName.replace('/', '-')
        this.name = name.replace('/', '-')
        this.description = ""

        this.value = 0
        this.defaultValue = 0
        this.targets = []
        this.macroVariable = undefined
        this.macroDependencies = []
    }

    get fullName (): string {
        return `${this.groupName}/${this.name}`
    }

    getMin() {
        return 0.0
    }

    getMax() {
        return 1.0
    }

    setValue(value: number, {skipDependencies = false} = {}) {
        throw Error("Not implemented")
        // value = this.clampValue(value)
        // const factors = this.getFactors(value)
        // tWeights = getTargetWeights(self.targets, factors, value)
        // for tpath, tWeight in tWeights.items():
        //     self.human.setDetail(tpath, tWeight)

        // if skipDependencies:
        //     return

        // # Update dependent modifiers
        this.propagateUpdate(false)
    }

    resetValue(): number {
        const oldValue = this.getValue()
        this.setValue(this.getDefaultValue())
        return oldValue
    }

    propagateUpdate(realtime = false) {
        throw Error("Not implemented")
        // let f
        // if (realtime)
        //     f = realtimeDependencyUpdates
        // else
        //     f = None

        // for (const dependentModifierGroup of self.human.getModifiersAffectedBy(this, filter = f)) {
        //     // Only updating one modifier in a group should suffice to update the
        //     // targets affected by the entire group.
        //     const m = this.human.getModifiersByGroup(dependentModifierGroup)[0]
        //     if (realtime)
        //         m.updateValue(m.getValue(), skipUpdate = True)
        //     else
        //         m.setValue(m.getValue(), skipDependencies = True)
        // }
    }

    clampValue(value: number) {
        throw Error("Not implemented")
    }

    getFactors(value: number): any {
        throw Error("Not implemented")
    }

    getValue(): number {
        // return sum([self.human.getDetail(target[0]) for target in self.targets])
        throw Error("Not implemented")
    }

    getDefaultValue(): number {
        return this.defaultValue
    }

    buildLists() {
        throw Error("Not implemented")
    }

    updateValue(value: number, {updateNormals = 1, skipUpdate = false} = {} ) {
        throw Error("Not implemented")
        // if (this.verts === undefined && this.faces === undefined)
        //     this.buildLists()

//    # Update detail state
//    old_detail = [self.human.getDetail(target[0]) for target in self.targets]
//    self.setValue(value, skipDependencies = True)
//    new_detail = [self.human.getDetail(target[0]) for target in self.targets]

//    # Apply changes
//    for target, old, new in zip(self.targets, old_detail, new_detail):
//        if new == old:
//            continue
//        if self.human.isPosed():
//            # Apply target with pose transformation
//            animatedMesh = self.human
//        else:
//            animatedMesh = None
//        algos3d.loadTranslationTarget(self.human.meshData, target[0], new - old, None, 0, 0, animatedMesh=animatedMesh)

//    if skipUpdate:
//        # Used for dependency updates (avoid dependency loops and double updates to human)
//        return

//    # Update dependent modifiers
//    self.propagateUpdate(realtime = True)

//    # Update vertices
//    if updateNormals:
//        self.human.meshData.calcNormals(1, 1, self.verts, self.faces)
//    self.human.meshData.update()
//    event = events3d.HumanEvent(self.human, self.eventType)
//    event.modifier = self.fullName
//    self.human.callEvent('onChanging', event)
    }

    getSymmetrySide(): string|undefined {
        throw Error("Not implemented")
    }

    getSymmetricOpposite(): string|undefined {
        throw Error("Not implemented")
    }

    getSimilar(): any {
        throw Error("Not implemented")
    }

    isMacro() {
        return this.macroVariable === undefined
    }
}

// single target file, value in [0,1]
class SimpleModifier extends Modifier {
    filename: string

    constructor(groupName: string, basepath: string, targetpath: string) {
        super(
            groupName,
            targetpath
            .replace(".target", "")
            .replace('/', '-')
            .replace('\\', '-')
        )
        // this.filename = path.join(basepath, targetpath)
        this.filename = `${basepath}/${targetpath}`
        this.targets = this.expandTemplate([[this.filename, []]])
    }

    getFactors(value: number): any {
        return { 'dummy': 1.0 }
    }

    clampValue(value: number): number {
        return Math.max(0.0, Math.min(1.0, value))
    }

    private expandTemplate(t: any): any {
        throw Error("Not implemented")
    }
}

// 2 targets from the TargetFactory, value in [0, 1] or [-1, 1]
class ManagedTargetModifier extends Modifier {
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

    setValue(value: number, {skipDependencies=false} = {}) {
        throw Error("Not implemented")
    }

    getValue(): number {
        throw Error("Not implemented")
    }

    getFactors(value: number): any {
        throw Error("Not implemented")
    }
}

// 1 to 3 targets from the TargetFactory, value in [0, 1] or [-1, 1]
class UniversalModifier extends ManagedTargetModifier {
    center?: string
    targetName: string

    constructor(groupName: string, targetName: string, leftExt?: string, rightExt?: string, centerExt?: string) {
        const fullTargetName = `${groupName}-${targetName}`
        let name: string
        let left: string | undefined
        let center: string | undefined
        let right: string | undefined
        if (leftExt !== undefined && rightExt !== undefined) {
            left = `${fullTargetName}-${leftExt}`
            right = `${fullTargetName}-${rightExt}`

            if (centerExt !== undefined) {
                center = `${fullTargetName}-${centerExt}`
                targetName = `${fullTargetName}-${leftExt}|${centerExt}|${rightExt}`
                name = `${targetName}-${leftExt}|${centerExt}|${rightExt}`
            } else {
                center = undefined
                targetName = `${fullTargetName}-${leftExt}|${rightExt}`
                name = `${targetName}-${leftExt}|${rightExt}`
            }
        } else {
            left = undefined
            right = targetName
            center = undefined
            name = targetName
        }
        super(groupName, name)
        this.targetName = fullTargetName
        this.left = left
        this.center = center
        this.right = right

        // throw Error("Not implemented")
        // self.l_targets = self.findTargets(self.left)
        // self.r_targets = self.findTargets(self.right)
        // self.c_targets = self.findTargets(self.center)

        // self.macroDependencies = self.findMacroDependencies(self.left)
        // self.macroDependencies.update(self.findMacroDependencies(self.right))
        // self.macroDependencies.update(self.findMacroDependencies(self.center))
        // self.macroDependencies = list(self.macroDependencies)

        // self.targets = self.l_targets + self.r_targets + self.c_targets
    }

    getMin(): number {
        if (this.left !== undefined)
            return -1.0
        else
            return 0.0
    }

    getFactors(value: number): any {
        throw Error("Not implemented")
    }
}
class MacroModifier extends ManagedTargetModifier {}
class EthnicModifier extends MacroModifier {}

// {
//     "group": "<groupname>",
//     "modifiers": [
//         { "target": ... } |
//         { "target": ..., "min": ..., "max": ... } |
//         {"macrovar": ...} |
//         {"macrovar": ..., "modifierType": ...}, ...
//     ]
// }, ...
export function loadModifiers(data: string) {
    const filename="<string>"

    const classesMapping = new Map<string, any>([
        // ['Modifier', Modifier],
        // ['SimpleModifier', SimpleModifier],
        // ['ManagedTargetModifier', ManagedTargetModifier],
        // ['UniversalModifier', UniversalModifier],
        // ['MacroModifier', MacroModifier],
        ['EthnicModifier', EthnicModifier]
    ])
    const json = JSON.parse(data)
    const modifiers = new Array<Modifier>()
    const lookup = new Map<string, Modifier>()

    for (const modifierGroup of json) {
        const groupName = modifierGroup.group
        for(const mDef of modifierGroup.modifiers) {
            let modifierClass: typeof Modifier
            let modifier: Modifier
            if ("modifierType" in mDef) {
                modifierClass = classesMapping.get(mDef.modifierType)
            } else if ("macrovar" in mDef) {
                modifierClass = MacroModifier
            } else {
                modifierClass = UniversalModifier
            }

            if ("macrovar" in mDef) {
                modifier = new modifierClass(groupName, mDef.macrovar)
                if (!modifier.isMacro()) {
                    console.log(`Expected modifier ${modifier} to be a macro modifier, but identifies as a regular one. Please check variable category definitions in class Component.`)
                }
            } else {
//             modifier = modifierClass(groupName, mDef['target'], mDef.get('min',None), mDef.get('max',None), mDef.get('mid',None))
                if (modifierClass !== UniversalModifier)
                    throw Error()
                modifier = new (modifierClass as typeof UniversalModifier)(groupName, mDef.target, mDef.min, mDef.max, mDef.mid)
            }

            if ("defaultValue" in mDef) {
                modifier.defaultValue = mDef.defaultValue
            }

            modifiers.push(modifier)
            lookup.set(modifier.fullName, modifier)
        }
    }
// if human is not None:
//     for modifier in modifiers:
//         modifier.setHuman(human)

    console.log(`Loaded ${modifiers.length} modifiers from file ${filename}`)

// # Attempt to load modifier descriptions
// _tmp = os.path.splitext(filename)
// descFile = _tmp[0]+'_desc'+_tmp[1]
// hasDesc = OrderedDict([(key,False) for key in lookup.keys()])
// if os.path.isfile(descFile):
//     data = json.load(io.open(descFile, 'r', encoding='utf-8'), object_pairs_hook=OrderedDict)
//     dCount = 0
//     for mName, mDesc in data.items():
//         try:
//             mod = lookup[mName]
//             mod.description = mDesc
//             dCount += 1
//             hasDesc[mName] = True
//         except:
//             log.warning("Loaded description for %s but modifier does not exist!", mName)
//     log.message("Loaded %s modifier descriptions from file %s", dCount, descFile)
// for mName, mHasDesc in hasDesc.items():
//     if not mHasDesc:
//         log.warning("No description defined for modifier %s!", mName)

// return modifiers
}