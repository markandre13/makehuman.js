import { expect, use } from 'chai'
import { chaiString } from "../chai/chaiString"
use(chaiString)

import { ManagedTargetModifier } from "../../src/modifier/ManagedTargetModifier"
import { MorphManager } from "../../src/modifier/MorphManager"
import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

describe("HumMorphManageran", function() {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
    describe("modifiers", () => {
        it("adding a modifier with the same fullName is an error", () => {
            const human = new MorphManager()
            human.addModifier(new ManagedTargetModifier("buttocks", "buttocks-volume"))
            expect(() => {
                human.addModifier(new ManagedTargetModifier("buttocks", "buttocks-volume"))
            }).to.throw()
        })
        it("getModifier", () => {
            const human = new MorphManager()
            const m0 = new ManagedTargetModifier("buttocks", "buttocks-volume")
            human.addModifier(m0)

            const m = human.getModifier("buttocks/buttocks-volume")
            expect(m).to.equal(m0)
        })
        it("getModifiersByGroup", () => {
            const human = new MorphManager()
            const m0 = new ManagedTargetModifier("buttocks", "buttocks-volume")
            human.addModifier(m0)

            const g = human.getModifiersByGroup("buttocks")
            expect(g.length).to.equal(1)
            expect(g[0]).to.equal(m0)
        })
    })
})

