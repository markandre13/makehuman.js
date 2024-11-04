import { expect, use } from 'chai'
import { chaiString } from '../chai/chaiString'
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost(0.00001))

import { decoupleXYZandUV } from '../../src/render/RenderMesh'

describe("RenderMesh", function () {
    it("converts quads to triangles (without UV)", function () {
        const vertex = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            1, 1, 0,
            0, 1, 0
        ])
        const fvertex = new Uint16Array([
            0, 1, 2, 3
        ])
        const result = decoupleXYZandUV(vertex, fvertex)
        // console.log(result)
        expect(result.indices).to.deep.equal([
            0, 1, 2,
            3, 0, 2
        ])
        expect(result.vertex).to.deep.equal(vertex)
    })
    it("converts quads to triangles (with UV)", function () {
        const vertex = new Float32Array([
            0, 0, 0,
            1, 0, 0,
            1, 1, 0,
            0, 1, 0
        ])
        const fvertex = new Uint16Array([
            0, 1, 2, 3
        ])
        const uv = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ])
        const fuv = new Uint16Array([
            0, 1, 2, 3
        ])
        const result = decoupleXYZandUV(vertex, fvertex, uv, fuv)
        // console.log(result)
        expect(result.indices).to.deep.equal([
            0, 1, 2,
            3, 0, 2
        ])
        expect(result.vertex).to.deep.equal(vertex)
        expect(result.texcoord).to.deep.equal(uv)
    })
    it("decouples vertex and uv", function () {
        //  0   2   4
        //
        //  1   3   5

        const vertex = new Float32Array([
            0, 0, 0,
            0, 1, 0,
            1, 0, 0,
            1, 1, 0,
            2, 0, 0,
            2, 1, 0,
        ])
        const fvertex = new Uint16Array([
            0, 2, 3, 1,
            2, 4, 5, 3,
        ])
        const uv = new Float32Array([
            0, 0,
            1, 0,
            1, 1,
            0, 1
        ])
        const fuv = new Uint16Array([
            0, 1, 2, 3,
            0, 1, 2, 3,
        ])
        const result = decoupleXYZandUV(vertex, fvertex, uv, fuv)

        const unpack: number[][] = []

        for (let i of result.indices) {
            // console.log(`${i}: ${result.vertex[i * 3]}, ${result.vertex[i * 3 + 1]}, ${result.vertex[i * 3 + 2]}; ${result.texcoord[i * 2]}, ${result.texcoord[i * 2 + 1]}`)
            unpack.push([
                result.vertex[i * 3], result.vertex[i * 3 + 1], result.vertex[i * 3 + 2],
                result.texcoord![i * 2], result.texcoord![i * 2 + 1]
            ])
        }

        expect(unpack).to.deep.equal([
            [0, 0, 0, 0, 0],
            [1, 0, 0, 1, 0],
            [1, 1, 0, 1, 1],

            [0, 1, 0, 0, 1],
            [0, 0, 0, 0, 0],
            [1, 1, 0, 1, 1],

            [1, 0, 0, 0, 0],
            [2, 0, 0, 1, 0],
            [2, 1, 0, 1, 1],

            [1, 1, 0, 0, 1],
            [1, 0, 0, 0, 0],
            [2, 1, 0, 1, 1],
        ])
    })
})
