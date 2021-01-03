import { expect } from "chai"

var chai = require('chai');
chai.use(require('chai-string'));

import { loadSliders } from "../../../src/fileformats/modifier/loadSliders"

describe("Modifier", ()=> {
    it.only("loadSliders", async ()=> {
        loadSliders("data/modifiers/modeling_sliders.json")
    })
})
