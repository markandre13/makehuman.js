import { expect } from '@esm-bundle/chai'
import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'
import { Human } from '../../src/Human'
import { getTargetWeights } from '../../src/modifier/getTargetWeights'
import { loadModifiers, parseModifiers } from '../../src/modifier/loadModifiers'
import { TargetRef } from '../../src/modifier/TargetRef'
import { UniversalModifier } from '../../src/modifier/UniversalModifier'

describe("Modifier", function() {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
    it("initialize UniversalModifier from JSON", () => {
        // const url = "data/modifiers/modeling_modifiers.json" // "modifiers/measurement_modifiers.json"
        // loadModifiers(url)
        const human = new Human()
        const result = parseModifiers(human, `[
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
        expect(um.targets[0].targetPath).to.equal('data//targets/buttocks/buttocks-volume-decr.target')
        expect(um.targets[0].factorDependencies.length).to.equal(1)
        expect(um.targets[0].factorDependencies[0]).to.equal('buttocks-buttocks-volume-decr')
        expect(um.targets[1].targetPath).to.equal('data//targets/buttocks/buttocks-volume-incr.target')
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

        // it's a universal modified which can't go below 0
        // m.setValue(-0.5)
        // console.log(m)
        // expect(m.getValue()).to.equal(-0.5)
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
        loadModifiers(human, "data/modifiers/modeling_modifiers.json")
        loadModifiers(human, "data/modifiers/measurement_modifiers.json")

        // WHEN getting a modifier from the human
        const modifier = human.getModifier("head/head-age-decr|incr")

        // THEN we get the modifier we've loaded from the file
        expect(modifier).is.not.undefined
        expect(modifier).to.be.instanceOf(UniversalModifier)
        expect(modifier!!.groupName).to.equal("head")
        expect(modifier!!.name).to.equal("head-age-decr|incr")
    })
})
