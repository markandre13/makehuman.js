import { expect } from "chai"

var chai = require('chai');
chai.use(require('chai-string'));

import { loadSliders, labelFromModifier } from "../../src/modifier/loadSliders"

describe("Modifier", ()=> {
    it("loadSliders", async ()=> {
        loadSliders("data/modifiers/modeling_sliders.json")
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
