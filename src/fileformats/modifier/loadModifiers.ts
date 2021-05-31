import { EthnicModifier } from "./EthnicModifier"
import { MacroModifier } from "./MacroModifier"
import { UniversalModifier } from "./UniversalModifier"
import { Modifier } from "./Modifier"
import { Human } from "../../Human"
import { FileSystemAdapter } from "../../filesystem/FileSystemAdapter"

// {
//     "group": "<groupname>",
//     "modifiers": [
//         { "target": ... } |
//         { "target": ..., "min": ..., "max": ... } |
//         {"macrovar": ...} |
//         {"macrovar": ..., "modifierType": ...}, ...
//     ]
// }, ...

// from apps/humanmodifier.py
export function loadModifiers(filename: string, human?: Human): Modifier[] {
    return parseModifiers(
        FileSystemAdapter.getInstance().readFile(filename),
        human,
        filename)
}

export function parseModifiers(data: string, human?: Human, filename: string = "memory"): Modifier[] {
    const classesMapping = new Map<string, any>([
        // ['Modifier', Modifier],
        // ['SimpleModifier', SimpleModifier],
        // ['ManagedTargetModifier', ManagedTargetModifier],
        // ['UniversalModifier', UniversalModifier],
        // ['MacroModifier', MacroModifier],
        ['EthnicModifier', EthnicModifier]
    ]);
    const json = JSON.parse(data)
    const modifiers = new Array<Modifier>()
    const lookup = new Map<string, Modifier>()

    for (const modifierGroup of json) {
        const groupName = modifierGroup.group
        for (const mDef of modifierGroup.modifiers) {
            let modifierClass: typeof Modifier;
            let modifier: Modifier;
            if ("modifierType" in mDef) {
                modifierClass = classesMapping.get(mDef.modifierType)
                if (modifierClass === undefined)
                    throw Error(`failed to instantiate modifer ${mDef.modifierType}`)
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
            // console.log(modifier.fullName)
        }
    }

    if (human !== undefined) {
        for(const modifier of modifiers) {
            modifier.setHuman(human)
        }
    }

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
    return modifiers
}