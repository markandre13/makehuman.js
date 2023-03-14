import { expect, use } from '@esm-bundle/chai'
import { chaiString } from "../chai/chaiString"
use(chaiString)

import { ManagedTargetModifier } from "../../src/modifier/ManagedTargetModifier"
import { Human } from "../../src/modifier/Human"
import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

describe("Human", function() {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
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

