import { expect } from "chai"

var chai = require('chai');
chai.use(require('chai-string'));

import * as fs from "fs"
import { WavefrontObj } from "../src/fileformats/WavefrontObj"
import { Target } from "../src/fileformats/target/Target"
import { StringToLine } from "../src/fileformats/lib/StringToLine"
import { loadModifiers } from "../src/fileformats/modifier/loadModifiers"
import { Modifier } from "../src/fileformats/modifier/Modifier"
import { UniversalModifier } from "../src/fileformats/modifier/UniversalModifier"
// import { NumberModel } from "toad.js"

// http://paulbourke.net/dataformats/obj/
describe("class WavefrontOBJ", ()=> {
    it("can parse base.obj without throwing an exception", async ()=> {
        const url = "data/3dobjs/base.obj"
        const stream = fs.readFileSync(url).toString()
        const obj = new WavefrontObj()
        await obj.load(stream)
        expect(obj.vertex.length).to.equal(19158 * 3) // 3 coord per vertex
        expect(obj.indices.length).to.equal(18486 * 3 * 2) // each face is 3 triangles
    })

    // it.only("can parse base.obj without throwing an exception", async ()=> {
    //     // const url = "data/3dobjs/base.obj"
    //     const url = "data/3dobjs/cube.obj"
    //     const stream = fs.readFileSync(url).toString()
    //     const obj = new WavefrontObj()
    //     await obj.load(stream)
    //     // expect(obj.vertex.length).to.equal(19158 * 3) // 3 coord per vertex
    //     // expect(obj.indices.length).to.equal(18486 * 3 * 2) // each face is 3 triangles

    //     // we can go through the list of triangles and calculate the normals

    //     // console.log(a)
    // })
})

describe("class Target", ()=> {
    it("can parse base.obj without throwing an exception", async ()=> {
        const url = "data/targets/breast/breast-volume-vert-up.target"
        const stream = fs.readFileSync(url).toString()
        const obj = new Target()
        await obj.load(stream)
        expect(obj.data .length).to.equal(601)
        expect(obj.verts.length).to.equal(601 * 3)
    })
})

describe("class StringToLine", ()=> {
    it("empty", ()=> {
        let result = ""
        const reader = new StringToLine("")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("")
    })
    it("just a line feed", ()=> {
        let result = ""
        const reader = new StringToLine("\n")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("<CR><CR>")
    })
    it("one line without line feed", ()=> {
        let result = ""
        const reader = new StringToLine("line 0")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR>")
    })
    it("one line with line feed", ()=> {
        let result = ""
        const reader = new StringToLine("line 0\n")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR><CR>")
    })
    it("three lines", ()=> {
        let result = ""
        const reader = new StringToLine("line 0\nline 1\nline 2")
        for(const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR>line 1<CR>line 2<CR>")
    })
})

class Human {
    private modifiers: Map<string, Modifier>
    private modifierGroups: Map<string, Modifier[]>

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

    getModifier(name: string): Modifier|undefined {
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
}

describe("Human", ()=> {
    describe("modifiers", ()=> {
        it("adding a modifier with the same fullName is an error", ()=> {
            const human = new Human()
            human.addModifier(new Modifier("buttocks", "buttocks-volume"))
            expect( ()=> {
                human.addModifier(new Modifier("buttocks", "buttocks-volume"))
            }).to.throw()
        })
        it("getModifier", ()=>{
            const human = new Human()
            const m0 = new Modifier("buttocks", "buttocks-volume")
            human.addModifier(m0)

            const m = human.getModifier("buttocks/buttocks-volume")
            expect(m).to.equal(m0)
        })
        it("getModifiersByGroup", ()=>{
            const human = new Human()
            const m0 = new Modifier("buttocks", "buttocks-volume")
            human.addModifier(m0)

            const g = human.getModifiersByGroup("buttocks")
            expect(g.length).to.equal(1)
            expect(g[0]).to.equal(m0)
        })
    })
})

describe("Modifier", ()=> {
    it("initialize UniversalModifier from JSON", ()=>{
        // const url = "data/modifiers/modeling_modifiers.json" // "modifiers/measurement_modifiers.json"
        // const data = fs.readFileSync(url).toString()
        // loadModifiers(data)
        const result = loadModifiers(`[
            { "group": "buttocks",
                "modifiers": [
                    {"target": "buttocks-volume", "min": "decr", "max": "incr"}
                ]
            }
        ]`)
        // console.log(result[0])

        expect(result[0]).to.be.instanceOf(UniversalModifier)
        const um = result[0] as UniversalModifier
        expect(um.fullName).to.equal("buttocks/buttocks-volume-decr|incr")
        expect(um.groupName).to.equal("buttocks")
        expect(um.name).to.equal("buttocks-volume-decr|incr")
        expect(um.targetName).to.equal("buttocks-buttocks-volume-decr|incr")
        expect(um.left).to.equal("buttocks-buttocks-volume-decr")
        expect(um.center).to.equal(undefined)
        expect(um.right).to.equal("buttocks-buttocks-volume-incr")

        // console.log(um.targets)
        expect(um.targets.length).to.equal(2)
        expect(um.targets[0].targetPath).to.endWith('data/targets/buttocks/buttocks-volume-decr.target')
        expect(um.targets[0].factorDependencies.length).to.equal(1)
        expect(um.targets[0].factorDependencies[0]).to.endWith('buttocks-buttocks-volume-decr')
        expect(um.targets[1].targetPath).to.endWith('data/targets/buttocks/buttocks-volume-incr.target')
        expect(um.targets[1].factorDependencies.length).to.equal(1)
        expect(um.targets[1].factorDependencies[0]).to.endWith('buttocks-buttocks-volume-incr')

        // um.setValue()

        // um.getValue()
    })

    it("Human", ()=> {
        const modifiers = loadModifiers(fs.readFileSync("data/modifiers/modeling_modifiers.json").toString())
        // "buttocks-buttocks-volume-decr|incr"
        const measurement_modifiers = loadModifiers(fs.readFileSync("data/modifiers/measurement_modifiers.json").toString())
    })
})
