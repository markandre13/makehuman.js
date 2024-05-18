import { expect, use } from '@esm-bundle/chai'
import { chaiString } from "../chai/chaiString"
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { WavefrontObj } from "../../src/mesh/WavefrontObj"
import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

// http://paulbourke.net/dataformats/obj/
describe("class WavefrontOBJ", function () {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
    it.only("can parse base.obj without throwing an exception", function() {
        // this.timeout(50000)
        // const url = "data/3dobjs/base.obj"
        // // const stream = fs.readFileSync(url).toString()
        // const ref = new WavefrontObjOld(url)
        // const obj = new WavefrontObj(url)
        // // expect(obj.vertex.length).to.equal(19158 * 3) // 3 coord per vertex
        // // expect(obj.fvertex.length).to.equal(18486 * 3 * 2) // each face is 3 triangles

        // const r = decoupleXYZandUV(obj.vertex, obj.fvertex, obj.texcoord, obj.fuv)
        // expect(r.indices.length).to.equal(obj.fvertex.length/4*6)

        // for(let i=0; i<ref.indices.length; ++i) {
        //     expect(ref.indices[i]).to.equal(r.indices[i])
        // }
        // console.log(`${ref.indices.length} indices match`)

        // for(let i=0; i<ref.vertex.length; ++i) {
        //     expect(ref.vertex[i]).to.equal(r.vertex[i])
        // }
        // console.log(`${ref.vertex.length} vertices match`)

        // const texOld = new Float32Array(ref.texture)
        // const texNew = r.texcoord!

        // for(let i=0; i<texNew.length; ++i) {
        //     expect(texOld[i]).to.almost.equal(texNew[i])
        // }
        // console.log(`${ref.texture.length} texcoords match`)

        // let diffCounter = 0
        // for(let i=0;i<texNew.length; ++i) {
        //     if (texOld[i] !== texNew[i]) {
        //         ++diffCounter
        //     }
        // }
        // console.log(`  diffCounter   : ${diffCounter}`)
        // console.log(`  texture coords: ${texOld.length} ${texNew.length}`)

        // const q = 8000 * 6
        // const i0 = r.indices[q+0]
        // const i1 = r.indices[q+1]
        // const i2 = r.indices[q+2]
        // const i3 = r.indices[q+3]
        // console.log([i0,i1,i2,i3])
        // console.log([r.vertex[i0 * 3], r.vertex[i0 * 3 + 1], r.vertex[i0 * 3 + 2]])
        // console.log([r.vertex[i1 * 3], r.vertex[i1 * 3 + 1], r.vertex[i1 * 3 + 2]])
        // console.log([r.vertex[i2 * 3], r.vertex[i2 * 3 + 1], r.vertex[i2 * 3 + 2]])
        // console.log([r.vertex[i3 * 3], r.vertex[i3 * 3 + 1], r.vertex[i3 * 3 + 2]])
        // console.log([r.texcoord![i0 * 2], r.texcoord![i0 * 2 + 1]])
        // console.log([r.texcoord![i1 * 2], r.texcoord![i1 * 2 + 1]])
        // console.log([r.texcoord![i2 * 2], r.texcoord![i2 * 2 + 1]])
        // console.log([r.texcoord![i3 * 2], r.texcoord![i3 * 2 + 1]])

        // const i0 = 4848
        // const i1 = 0
        // const i2 = 1
        // const i3 = 4847

        // // 1st quad
        // expect(obj.fvertex[0]).to.equal(i0)
        // expect(obj.fvertex[1]).to.equal(i1)
        // expect(obj.fvertex[2]).to.equal(i2)
        // expect(obj.fvertex[3]).to.equal(i3)

        // expect(r.indices[0]).to.equal(i0)
        // expect(r.indices[1]).to.equal(i1)
        // expect(r.indices[2]).to.equal(i2)
        // expect(r.indices[3]).to.equal(i3)
        // expect(r.indices[4]).to.equal(i0)
        // expect(r.indices[5]).to.equal(i2)

        // expect([r.vertex[i0 * 3], r.vertex[i0 * 3 + 1], r.vertex[i0 * 3 + 2]]).to.deep.almost.equal([-0.3472999930381775, 7.3383002281188965, 1.4076999425888062])
        // expect([r.vertex[i1 * 3], r.vertex[i1 * 3 + 1], r.vertex[i1 * 3 + 2]]).to.deep.almost.equal([-0.3492000102996826, 7.329899787902832, 1.4076000452041626])
        // expect([r.vertex[i2 * 3], r.vertex[i2 * 3 + 1], r.vertex[i2 * 3 + 2]]).to.deep.almost.equal([-0.3109999895095825, 7.331500053405762, 1.4106999635696411])
        // expect([r.vertex[i3 * 3], r.vertex[i3 * 3 + 1], r.vertex[i3 * 3 + 2]]).to.deep.almost.equal([-0.30959999561309814, 7.337399959564209, 1.4127000570297241])

        // expect([r.texcoord![i0 * 2], r.texcoord![i0 * 2 + 1]]).to.deep.almost.equal([0.833218, 0.448147])
        // expect([r.texcoord![i1 * 2], r.texcoord![i1 * 2 + 1]]).to.deep.almost.equal([0.834363, 0.447974])
        // expect([r.texcoord![i2 * 2], r.texcoord![i2 * 2 + 1]]).to.deep.almost.equal([0.834501, 0.450931])
        // expect([r.texcoord![i3 * 2], r.texcoord![i3 * 2 + 1]]).to.deep.almost.equal([0.833504, 0.451106])
    })
    it("foo", () => {
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
        expect(obj.fxyz).to.deep.equal([
            0, 1, 2, 3, 0, 2,
            4, 5, 6, 7, 4, 6
        ])
        expect(obj.xyz).to.deep.equal(new Float32Array([
            -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0,
            1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0,

            -1.0, -1.0, -1.0,
            1.0, -1.0, -1.0,
            1.0, 1.0, -1.0,
            -1.0, 1.0, -1.0,
        ]))
        expect(obj.uv).to.deep.equal([
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