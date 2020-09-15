import { expect } from "chai"
import { URL } from "url"
import * as fs from "fs"
import * as readline from "readline"
import { WavefrontObj } from "../src/fileformats/WavefrontObj"
import { assert } from "console"

// http://paulbourke.net/dataformats/obj/

describe("class WavefrontOBJ", ()=> {
    it("can parse base.obj without throwing an exception", async ()=> {
        // let url = new URL("file://./data/3dobjs/base.obj")
        const url = "data/3dobjs/base.obj"
        const stream = fs.createReadStream(url)
        const obj = new WavefrontObj()
        await obj.load(stream)
        expect(obj.vertex.length).to.equal(19158 * 3)
        expect(obj.indices.length).to.equal(18486 * 4)
    })
})
