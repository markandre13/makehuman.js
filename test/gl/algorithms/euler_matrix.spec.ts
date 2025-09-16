import { expect, use } from "chai"
import { chaiAlmost } from "../../chai/chaiAlmost"
use(chaiAlmost())

import { mat4 } from "gl-matrix"
import { euler2matrix, matrix2euler } from "../../../src/gl/algorithms/euler"

describe("gl/algorithms/euler", function () {
    it("matrix2euler(x,y,z,axis): mat4", function () {
        const m = euler2matrix(0.1, 0.2, 0.3, "syzx")
        // prettier-ignore
        const e = new Float32Array([
            0.9751703143119812, 0.21835066378116608, -0.036957014352083206, 0,
            -0.19866932928562164, 0.936293363571167, 0.2896294891834259, 0,
            0.09784339368343353, -0.2750958502292633, 0.9564250707626343, 0,
            0, 0, 0, 1
        ])
        expect(m).to.deep.almost.equal(e)
    })

    it("matrix2euler(m:mat4,axis): {x,y,z}", function () {
        // prettier-ignore
        const m = mat4.fromValues(
            0.9751703143119812, 0.21835066378116608, -0.036957014352083206, 0,
            -0.19866932928562164, 0.936293363571167, 0.2896294891834259, 0,
            0.09784339368343353, -0.2750958502292633, 0.9564250707626343, 0,
            0, 0, 0, 1
        )
        const xyz = matrix2euler(m, "syzx")
        expect(xyz).to.deep.almost.equal({ x: 0.1, y: 0.2, z: 0.3 })
    })
    it("run01.bvh, root", function () {
        const D = Math.PI / 180
        // GIVEN rotation in run01.bvh for root bone 8.553898 0.000000 0.000000 is fed into euler_matrix as this
        // WHEN converted to matrix (bvh loader switches the positions)
        const m0 = euler2matrix(0 * D, 0 * D, 8.553898 * D, "syzx")

        // THEN it matches the one in python
        // prettier-ignore
        const m0fromPython = mat4.fromValues(
             1, 0, 0, 0,
             0, 0.9888764023780823, -0.14873968064785004, 0,
             0, 0.14873968064785004, 0.9888764023780823, 0,
             0, 0, 0, 1)
        mat4.transpose(m0fromPython, m0fromPython) // convert from python to webgl representation
        expect(m0).to.deep.almost.equal(m0fromPython)

        // WHEN reverted back to euler
        const xyz = matrix2euler(m0, "syxz")

        // THEN it matches the one in python
        expect(xyz).to.deep.almost.equal({ x: -0.0, y: 0.14929368397975792, z: 0.0 })
    })
})
