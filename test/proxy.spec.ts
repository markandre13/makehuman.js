import { expect } from '@esm-bundle/chai'

import { FileSystemAdapter } from '../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../src/filesystem/HTTPFSAdapter'
import { loadProxy, loadTextProxy, Proxy, ProxyRefVert, TMatrix } from "../src/proxy/Proxy"

describe("Proxy", function () {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    const human = {} as any
    const filepath = "data/proxymeshes/female_generic/female_generic.proxy"
    const type = "Proxymeshes"

    it("loads female_generic.proxy", async function () {
        const proxy = loadProxy(human, filepath, type)
        // const mesh = await proxy.loadMeshAndObject(human)
        console.log(proxy.weights)
        console.log(proxy.ref_vIdxs)
        console.log(proxy.offsets)
    })

    it("constructor", function() {
        const proxy = new Proxy(filepath, type, human)

        expect(proxy.file).to.equal(filepath)
        expect(proxy.type).to.equal(type)
        expect(proxy.human).to.equal(human)
        expect(proxy.name).to.equal("Female_generic")
        expect(proxy.description).to.equal("")
        expect(proxy.object).to.be.undefined
        // mtime
        expect(proxy.uuid).to.be.undefined
        // basemesh
        expect(proxy.tags).to.deep.equal([])
        expect(proxy.version).to.equal(110)
        expect(proxy.ref_vIdxs).to.be.undefined
        expect(proxy.weights).to.be.undefined
        expect(proxy.vertWeights).to.be.empty
        expect(proxy.offsets).to.be.undefined
        expect(proxy.vertexBoneWeights).to.be.undefined
        expect(proxy.tmatrix).to.be.instanceOf(TMatrix)
        expect(proxy.z_depth).to.equal(-1)
        expect(proxy.max_pole).to.be.undefined
        expect(proxy.special_pose).to.be.empty
        expect(proxy.uvLayers).to.be.empty
        // material
        expect(proxy._obj_file).to.be.undefined
        expect(proxy._vertexBoneWeights_file).to.be.undefined
        expect(proxy._material_file).to.be.undefined
        // deleteVerts
        expect(proxy.weightsCache).to.be.undefined
        expect(proxy.cacheSkel).to.be.undefined
    })

    it.only("loadTextProxy", function() {
        const proxy = loadTextProxy(human, filepath, type, `
            name Jan Hammer
            uuid maybe ed6b7c98-1272-45a5-934a-e2ac0b49af88
            description A Test
            tag JOSEPH WEIZENBAUM
            tag RICHARD STALLMAN
            version 501
            z_depth 711
            max_pole 42
            special_pose foot fit-to-shoe ignore me
            special_pose tongue fit-to-food
            # verts
            # weights
            # delete_verts
            obj_file wavefront.obj
            # ...
            basemesh alpha 1
            x_scale 5397 11996 1.3980
            y_scale 5398 11997 1.3981
            z_scale 5399 11998 1.3982
            shear_x 1000 1001 1000.1 1000.2
            shear_y 1002 1003 1000.3 1000.4
            shear_z 1004 1005 1000.5 1000.6
            l_shear_x 1006 1007 1000.7 1000.8
            l_shear_y 1008 1009 1000.9 1001.0
            l_shear_z 1010 1011 1001.1 1001.2
            r_shear_x 1012 1013 1001.3 1001.4
            r_shear_y 1014 1015 1001.5 1001.6
            r_shear_z 1016 1017 1001.7 1001.8
            verts 0
            10654 10641 10642 0.00839 0.98499 0.00661 0.00009 -0.00001 -0.00001
            10644
        `)
        expect(proxy.name).to.equal("Jan Hammer")
        expect(proxy.uuid).to.equal("maybe ed6b7c98-1272-45a5-934a-e2ac0b49af88")
        expect(proxy.description).to.equal("A Test")
        expect(proxy.tags).to.deep.equal([
            "joseph weizenbaum",
            "richard stallman"
        ])
        expect(proxy.version).to.equal(501)
        expect(proxy.z_depth).to.equal(711) // default to 50 when not specified/-1
        expect(proxy.max_pole).to.equal(2 * 42)
        expect(proxy.special_pose).to.have.lengthOf(2)
        expect(proxy.special_pose.get("foot")).to.equal("fit-to-shoe")
        expect(proxy.special_pose.get("tongue")).to.equal("fit-to-food")

        // verts -> weights, ref_vIdxs, offsets
        expect(proxy.weights).to.deep.equal([
            [0.00839, 0.98499, 0.00661],
            [1,       0,       0      ]
        ])
        expect(proxy.ref_vIdxs).to.deep.equal([
            [10654, 10641, 10642],
            [10644,     0,     1]
        ])
        expect(proxy.offsets).to.deep.equal([
            [ 9.e-05, -1.e-05, -1.e-05],
            [ 0.e+00,  0.e+00,  0.e+00]
        ])

        // delete_verts
        expect(proxy._obj_file).to.equal("data/proxymeshes/female_generic/wavefront.obj")
        // _material_file
        // material
        // _vertexBoneWeights_file
        // vertexBoneWeights
        // uvLayer
        // x_scale, y_scale, z_scale
        expect(proxy.tmatrix.scaleData).to.deep.equal([
            [5397, 11996, 1.3980],
            [5398, 11997, 1.3981],
            [5399, 11998, 1.3982]
        ])
        // shear_x, shear_y, shear_z
        expect(proxy.tmatrix.shearData).to.deep.equal([
            [1000, 1001, 1000.1, 1000.2],
            [1002, 1003, 1000.3, 1000.4],
            [1004, 1005, 1000.5, 1000.6],
        ])
        // l_shear_x, l_shear_y, l_shear_z
        expect(proxy.tmatrix.lShearData).to.deep.equal([
            [1006, 1007, 1000.7, 1000.8],
            [1008, 1009, 1000.9, 1001.0],
            [1010, 1011, 1001.1, 1001.2]
        ])
        // r_shear_x, r_shear_y, r_shear_z
        expect(proxy.tmatrix.rShearData).to.deep.equal([
            [1012, 1013, 1001.3, 1001.4],
            [1014, 1015, 1001.5, 1001.6],
            [1016, 1017, 1001.7, 1001.8]
        ])
        expect(proxy.basemesh).to.equal("alpha")
    })
    describe("ProxyRefVert", function() {
        it("fromSingle", function() {
            const refVert = new ProxyRefVert(human)
            const vnum = 7
            const vertWeights = new Map<number, Array<Array<number>>>()
            refVert.fromSingle(["13"], vnum, vertWeights)
            expect(refVert._verts).to.deep.equal([13, 0, 1])
            expect(refVert._weights).to.deep.equal([1.0, 0.0, 0.0])
            expect(refVert._offset).to.deep.equal([0,0,0])
            expect(vertWeights).to.be.of.length(1)
            expect(vertWeights.get(13)).to.deep.equal([[7,1]])
        })
        it("fromTriple", function() {
            const refVert = new ProxyRefVert(human)
            const vnum = 7
            const vertWeights = new Map<number, Array<Array<number>>>()
            refVert.fromTriple(["10654", "10641" , "10642",  "0.00839",  "0.98499",  "0.00661", "0.00009",  "-0.00001",  "-0.00002"], vnum, vertWeights)
            expect(refVert._verts).to.deep.equal([10654, 10641, 10642])
            expect(refVert._weights).to.deep.equal([0.00839, 0.98499, 0.00661])
            expect(refVert._offset).to.deep.equal([0.00009, -0.00001, -0.00002])
            expect(vertWeights).to.be.of.length(3)
            expect(vertWeights.get(10654)).to.deep.equal([[7, 0.00839]])
            expect(vertWeights.get(10641)).to.deep.equal([[7, 0.98499]])
            expect(vertWeights.get(10642)).to.deep.equal([[7, 0.00661]])
        })    
    })
    describe("TMatrix", function() {
        it("getScaleData", function() {
            const tmatrix = new TMatrix()
            tmatrix.getScaleData(["5399", "11998", "1.3980"], 1)
            expect(tmatrix.scaleData).to.deep.equal(
                [undefined, [5399, 11998, 1.3980], undefined]
            )
        })
        it("getShearData", function() {
            const tmatrix = new TMatrix()
            tmatrix.getShearData(["5397", "11996", "1.3980", "0.8372"], 1, "Left")
            tmatrix.getShearData(["5398", "11997", "1.3981", "0.8373"], 1, "Right")
            tmatrix.getShearData(["5399", "11998", "1.3982", "0.8374"], 1)
            expect(tmatrix.lShearData).to.deep.equal(
                [undefined, [5397, 11996, 1.3980, 0.8372], undefined]
            )
            expect(tmatrix.rShearData).to.deep.equal(
                [undefined, [5398, 11997, 1.3981, 0.8373], undefined]
            )
            expect(tmatrix.shearData).to.deep.equal(
                [undefined, [5399, 11998, 1.3982, 0.8374], undefined]
            )
        })
    })

})
