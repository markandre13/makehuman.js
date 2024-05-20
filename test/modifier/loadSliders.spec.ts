import { expect, use } from '@esm-bundle/chai'
import { chaiString } from "../chai/chaiString"
use(chaiString)
import { MorphManager } from "../../src/modifier/MorphManager"

import { loadSliders, labelFromModifier } from "../../src/modifier/loadSliders"
import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

describe("Modifier", function() {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    it("loadSliders", async ()=> {
        const human = new MorphManager()
        loadSliders(human, "data/modifiers/modeling_sliders.json")
    })

    describe("label from modifier name and groupName", ()=> {
        it("head-oval -> Oval", ()=> {
            expect(labelFromModifier("head", "head-oval")).is.equals("Oval")
        })

        it("head-age-decr|incr -> Age", ()=> {
            expect(labelFromModifier("head", "head-age-decr|incr")).is.equals("Age")
        })

        it("head-scale-depth-decr|incr -> Scale depth", () => {
            expect(labelFromModifier("head", "head-scale-depth-decr|incr")).is.equals("Scale depth")
        })
    })
})
