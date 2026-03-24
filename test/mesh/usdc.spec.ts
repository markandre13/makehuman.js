import { expect, use } from "chai"
import { chaiAlmost } from "../chai/chaiAlmost"
import { MeshExportDef, UsdMeshPreparer } from "../../src/mesh/usdc"
use(chaiAlmost(0.01))

describe.only("UsdMeshPreparer", () => {
    it("foo", () => {
        const xyz = [1,2,3, 4,5,6, 7,8,9, 10,11,12]
        const fxyz = [0,1,2,3, 1,0,3,2]
        const materials: MeshExportDef[] = [{
            xyz,
            fxyz,
            uv: [],
            fuv: [],
            vertexWeights: undefined as any,
            start: 0,
            length: fxyz.length,
            name: "skin", r: 1, g: 0.5, b: 0.5
        }]
        const preparer = new UsdMeshPreparer(materials[0])
        // console.log(preparer.xyz)
        // console.log(preparer.fxyz)
        // console.log(preparer.groups)

        expect(preparer.xyz).to.deep.almost([1,2,3, 4,5,6, 7,8,9, 10,11,12])
        expect(preparer.fxyz).to.deep.almost([0,1,2,3, 1,0,3,2])
        // expect(preparer.groups).to.deep.almost([[0,1]])
    })
})