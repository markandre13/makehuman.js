import { expect } from "chai"

var chai = require('chai')
chai.use(require('chai-string'))

import { WavefrontObj } from "../src/fileformats/WavefrontObj"
import { Target } from "../src/fileformats/target/Target"
import { StringToLine } from "../src/fileformats/lib/StringToLine"
import { loadModifiers, parseModifiers } from "../src/fileformats/modifier/loadModifiers"
import { getTargetWeights } from "../src/fileformats/modifier/Modifier"
import { UniversalModifier } from "../src/fileformats/modifier/UniversalModifier"
import { ManagedTargetModifier } from "../src/fileformats/modifier/ManagedTargetModifier"
import { Human } from "../src/Human"
import { TargetRef } from '../src/fileformats/modifier/TargetRef'

// http://paulbourke.net/dataformats/obj/
describe("class WavefrontOBJ", () => {
    it("can parse base.obj without throwing an exception", async () => {
        const url = "data/3dobjs/base.obj"
        // const stream = fs.readFileSync(url).toString()
        const obj = new WavefrontObj()
        await obj.load(url)
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

describe("class Target", () => {
    it("can parse base.obj without throwing an exception", async () => {
        const url = "data/targets/breast/breast-volume-vert-up.target"
        // const stream = fs.readFileSync(url).toString()
        const obj = new Target()
        await obj.load(url)
        expect(obj.data.length).to.equal(601)
        expect(obj.verts.length).to.equal(601 * 3)
    })
})

describe("class StringToLine", () => {
    it("empty", () => {
        let result = ""
        const reader = new StringToLine("")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("")
    })
    it("just a line feed", () => {
        let result = ""
        const reader = new StringToLine("\n")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("<CR><CR>")
    })
    it("one line without line feed", () => {
        let result = ""
        const reader = new StringToLine("line 0")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR>")
    })
    it("one line with line feed", () => {
        let result = ""
        const reader = new StringToLine("line 0\n")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR><CR>")
    })
    it("three lines", () => {
        let result = ""
        const reader = new StringToLine("line 0\nline 1\nline 2")
        for (const line of reader)
            result = `${result}${line}<CR>`
        expect(result).to.equal("line 0<CR>line 1<CR>line 2<CR>")
    })
})

describe("Human", () => {
    describe("modifiers", () => {
        it("adding a modifier with the same fullName is an error", () => {
            const human = new Human()
            human.addModifier(new ManagedTargetModifier("buttocks", "buttocks-volume"))
            expect(() => {
                human.addModifier(new ManagedTargetModifier("buttocks", "buttocks-volume"))
            }).to.throw()
        })
        it("getModifier", () => {
            const human = new Human()
            const m0 = new ManagedTargetModifier("buttocks", "buttocks-volume")
            human.addModifier(m0)

            const m = human.getModifier("buttocks/buttocks-volume")
            expect(m).to.equal(m0)
        })
        it("getModifiersByGroup", () => {
            const human = new Human()
            const m0 = new ManagedTargetModifier("buttocks", "buttocks-volume")
            human.addModifier(m0)

            const g = human.getModifiersByGroup("buttocks")
            expect(g.length).to.equal(1)
            expect(g[0]).to.equal(m0)
        })
    })
})

describe("Modifier", () => {
    it("initialize UniversalModifier from JSON", () => {
        // const url = "data/modifiers/modeling_modifiers.json" // "modifiers/measurement_modifiers.json"
        // loadModifiers(url)
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
        expect(um.targets[0].targetPath).to.equal('data/targets/buttocks/buttocks-volume-decr.target')
        expect(um.targets[0].factorDependencies.length).to.equal(1)
        expect(um.targets[0].factorDependencies[0]).to.equal('buttocks-buttocks-volume-decr')
        expect(um.targets[1].targetPath).to.equal('data/targets/buttocks/buttocks-volume-incr.target')
        expect(um.targets[1].factorDependencies.length).to.equal(1)
        expect(um.targets[1].factorDependencies[0]).to.equal('buttocks-buttocks-volume-incr')

        // um.setValue()
        // human.addModifier(um)

        const g = human.getModifiersByGroup("buttocks")
        expect(g.length).to.equal(1)

        const m = human.getModifier("buttocks/buttocks-volume-decr|incr")!
        expect(m).to.be.instanceOf(UniversalModifier)

        expect(m.getMin()).to.equal(-1)
        expect(m.getMax()).to.equal(1)
        expect(m.getDefaultValue()).to.equal(0)
        expect(m.getValue()).to.equal(0)

        m.setValue(0.5)
        expect(m.getValue()).to.equal(0.5)

        m.setValue(-0.5)
        expect(m.getValue()).to.equal(-0.5)
    })

    describe("getTargetWeights(targets, factors, value)", () => {
        it("2 targets, 1 modifier per target, value 1 => each target with it's modifer value", () => {
            const targets = [
                new TargetRef("tfile0", ["mod0"]),
                new TargetRef("tfile1", ["mod1"])
            ]
            const factors = new Map([
                ["mod0", 0.1],
                ["mod1", 1]
            ])

            const r = getTargetWeights(targets, factors, 1)

            expect(r.size).to.equal(2)
            expect(r.get("tfile0")).to.equal(0.1)
            expect(r.get("tfile1")).to.equal(1)
        })

        it("2 targets, 1 modifier per target, value 10 => each target with it's modifer value times 10", () => {
            const targets = [
                new TargetRef("tfile0", ["mod0"]),
                new TargetRef("tfile1", ["mod1"])
            ]
            const factors = new Map([
                ["mod0", 0.1],
                ["mod1", 1]
            ])

            const r = getTargetWeights(targets, factors, 10)

            expect(r.size).to.equal(2)
            expect(r.get("tfile0")).to.equal(1)
            expect(r.get("tfile1")).to.equal(10)
        })
        it("2 targets, 2 modifier per target, value 10 => each target with it's modifer values multiplied times 10", () => {
            const targets = [
                new TargetRef("tfile0", ["mod00", "mod01"]),
                new TargetRef("tfile1", ["mod10", "mod11"])
            ]
            const factors = new Map([
                ["mod00", 1],
                ["mod01", 2],
                ["mod10", 3],
                ["mod11", 5]

            ])

            const r = getTargetWeights(targets, factors, 10)

            expect(r.size).to.equal(2)
            expect(r.get("tfile0")).to.equal(20)
            expect(r.get("tfile1")).to.equal(150)
        })

    })

    it("can load the application's modifier files into a human", () => {
        // GIVEN a human with modifiers being loaded from a file
        const human = new Human()
        loadModifiers("data/modifiers/modeling_modifiers.json", human)
        loadModifiers("data/modifiers/measurement_modifiers.json", human)

        // WHEN getting a modifier from the human
        const modifier = human.getModifier("head/head-age-decr|incr")

        // THEN we get the modifier we've loaded from the file
        expect(modifier).is.not.undefined
        expect(modifier).to.be.instanceOf(UniversalModifier)
        expect(modifier!!.groupName).to.equal("head")
        expect(modifier!!.name).to.equal("head-age-decr|incr")
    })
})
