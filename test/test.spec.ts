import { expect } from "chai"
import * as fs from "fs"
import { WavefrontObj } from "../src/fileformats/WavefrontObj"
import { Target } from "../src/fileformats/target/Target"
import { StringToLine } from "../src/fileformats/StringToLine"
import { loadModifiers } from "../src/fileformats/modifier/Modifier"

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

describe("Modifier", ()=> {
    it.only("lives again", ()=>{
        const url = "data/modifiers/modeling_modifiers.json" // "modifiers/measurement_modifiers.json"
        const data = fs.readFileSync(url).toString()
        loadModifiers(data)
    })
})
