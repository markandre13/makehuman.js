import { expect, use } from '@esm-bundle/chai'
import { chaiString } from "../chai/chaiString"
use(chaiString)

import { WavefrontObj } from "../../src/mesh/WavefrontObj"
import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

// http://paulbourke.net/dataformats/obj/
describe("class WavefrontOBJ", function () {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
    it("can parse base.obj without throwing an exception", () => {
        const url = "data/3dobjs/base.obj"
        // const stream = fs.readFileSync(url).toString()
        const obj = new WavefrontObj(url)
        expect(obj.vertex.length).to.equal(19158 * 3) // 3 coord per vertex
        expect(obj.indices.length).to.equal(18486 * 3 * 2) // each face is 3 triangles
    })
    it.only("foo", () => {
        const obj = new WavefrontObj("foo.wav", `
v -1.0 -1.0 1.0
v  1.0 -1.0 1.0
v  1.0  1.0 1.0
v -1.0  1.0 1.0
v -1.0 -1.0 -1.0
v  1.0 -1.0 -1.0
v  1.0  1.0 -1.0
v -1.0  1.0 -1.0
vt 0 0
vt 1 0
vt 1 1
vt 0 1
f 1/1 2/2 3/3 4/4
f 5/1 6/2 7/3 8/4
`)
        console.log(obj)
        expect(obj.indices).to.deep.equal([
            0, 1, 2, 3, 0, 2,
            4, 5, 6, 7, 4, 6
        ])
        expect(obj.vertex).to.deep.equal([
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            -1.0, 1.0, -1.0,
        ])
        expect(obj.texture).to.deep.equal([
            0, 0,
            1, 0,
            1, 1,
            0, 1,

            0, 0,
            1, 0,
            1, 1,
            0, 1
        ])
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