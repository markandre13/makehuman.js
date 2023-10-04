import { expect, use } from '@esm-bundle/chai'
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { euler_from_matrix, euler_matrix } from "../../src/lib/euler_matrix"
import { mat4 } from 'gl-matrix'

describe("lib", function () {
    it("euler_matrix(x,y,z,axis): mat4", function () {
        const m = euler_matrix(0.1, 0.2, 0.3, "syzx")

        const e = new Float32Array([
            0.9751703143119812, 0.21835066378116608, -0.036957014352083206, 0,
            -0.19866932928562164, 0.936293363571167, 0.2896294891834259, 0,
            0.09784339368343353, -0.2750958502292633, 0.9564250707626343, 0,
            0, 0, 0, 1
        ])
        expect(m).to.deep.almost.equal(e)
    })

    it("euler_from_matrix(m:mat4,axis): {x,y,z}", function() {
        const m = mat4.fromValues(
            0.9751703143119812, 0.21835066378116608, -0.036957014352083206, 0,
            -0.19866932928562164, 0.936293363571167, 0.2896294891834259, 0,
            0.09784339368343353, -0.2750958502292633, 0.9564250707626343, 0,
            0, 0, 0, 1
        )
        const xyz = euler_from_matrix(m, "syzx")
        expect(xyz).to.deep.almost.equal({x:0.1, y:0.2, z: 0.3})
    })
})
