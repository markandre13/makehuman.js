import { expect, use } from "chai"
import { chaiAlmost } from "../chai/chaiAlmost"
import { ChordataSkeleton } from "../../src/chordata/Skeleton"
use(chaiAlmost())

describe("chordata", function () {
    it("calibrate()", function () {
        const skeleton = new ChordataSkeleton()
        console.log(skeleton.saveCalibration())
    })
})
