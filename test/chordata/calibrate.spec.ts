import { expect, use } from "@esm-bundle/chai"
import { chaiAlmost } from "../chai/chaiAlmost"
import { Skeleton } from "../../src/chordata/Skeleton"
import { euler_matrix } from "../../src/lib/euler_matrix"
import { mat3, mat4, quat, quat2 } from "gl-matrix"
use(chaiAlmost())

describe("chordata", function () {
    it("calibrate()", function () {
        const skeleton = new Skeleton()
        console.log(skeleton.saveCalibration())
    })
})
