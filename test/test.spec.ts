import { expect } from "chai"

var chai = require('chai');
chai.use(require('chai-string'));

import * as fs from "fs"
import { WavefrontObj } from "../src/fileformats/WavefrontObj"
import { Target } from "../src/fileformats/target/Target"
import { StringToLine } from "../src/fileformats/lib/StringToLine"
import { loadModifiers, parseModifiers } from "../src/fileformats/modifier/loadModifiers"
import { Modifier } from "../src/fileformats/modifier/Modifier"
import { UniversalModifier } from "../src/fileformats/modifier/UniversalModifier"
import { Human } from "../src/Human"
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
    it.only("initialize UniversalModifier from JSON", ()=>{
        // const url = "data/modifiers/modeling_modifiers.json" // "modifiers/measurement_modifiers.json"
        // const data = fs.readFileSync(url).toString()
        // loadModifiers(data)
        const human = new Human()
        const result = parseModifiers(`[
            { "group": "buttocks",
                "modifiers": [
                    {"target": "buttocks-volume", "min": "decr", "max": "incr"}
                ]
            }
        ]`, human)
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
        human.addModifier(um)

        const g = human.getModifiersByGroup("buttocks")
        expect(g.length).to.equal(1)

        console.log(g)

        // expect(g[0]).to.equal(m0)

        um.getValue()
    })

    it("can load the applications modifier files", ()=> {
        const modifiers = loadModifiers("data/modifiers/modeling_modifiers.json")
        // "buttocks-buttocks-volume-decr|incr"
        const measurement_modifiers = loadModifiers("data/modifiers/measurement_modifiers.json")
    })
})
