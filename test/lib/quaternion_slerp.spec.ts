import { expect, use } from '@esm-bundle/chai'
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost(0.00001))

import { mat4, quat2 } from "gl-matrix"
import { quaternion_slerp } from "../../src/lib/quaternion_slerp"

describe("lib", function () {
    it("slerp(quat2, quat2, number): quat2", function () {
        const q0 = quat2.fromMat4(quat2.create(), mat4.fromXRotation(mat4.create(), 0.1))
        const q1 = quat2.fromMat4(quat2.create(), mat4.fromYRotation(mat4.create(), 0.11))
        const s = quaternion_slerp(q0, q1, 0.3)
        expect(s).to.deep.almost.equal(new Float32Array([0.03500185, 0.0165055, 0, 0.99925094, 0, 0, 0, 0]))
    })
})