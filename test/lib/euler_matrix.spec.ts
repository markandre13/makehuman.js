import { expect, use } from '@esm-bundle/chai'
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { euler_matrix } from "../../src/lib/euler_matrix"

describe("lib", function () {
    it("euler_matrix(r): quat2", function () {
        const m = euler_matrix(0.1, 0.2, 0.3, "syzx")

        const e = new Float32Array([
            0.9751703143119812, 0.21835066378116608, -0.036957014352083206, 0,
            -0.19866932928562164, 0.936293363571167, 0.2896294891834259, 0,
            0.09784339368343353, -0.2750958502292633, 0.9564250707626343, 0,
            0, 0, 0, 1
        ])
        expect(m).to.deep.almost.equal(e)
    })
})
