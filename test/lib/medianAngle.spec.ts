import { expect, use } from "@esm-bundle/chai"
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { medianAngle, easeMedianAngle } from "../../src/lib/medianAngle"

describe("lib", function () {
    describe("easeMedianAngle()", function () {
        it("a=0, min=1, max=2, a0=6, a1=10 -> 6", function () {
            expect(easeMedianAngle(0, 1, 2, 6, 10)).to.equal(6)
        })
        it("a=1, min=1, max=2, a0=6, a1=10 -> 6", function () {
            expect(easeMedianAngle(1, 1, 2, 6, 10)).to.equal(6)
        })
        it("a=1.25, min=1, max=2, a0=6, a1=10 -> 8", function () {
            expect(easeMedianAngle(1.25, 1, 2, 6, 10)).to.equal(6.585786437626905)
        })
        it("a=1.5, min=1, max=2, a0=6, a1=10 -> 8", function () {
            expect(easeMedianAngle(1.5, 1, 2, 6, 10)).to.equal(8)
        })
        it("a=1.75, min=1, max=2, a0=6, a1=10 -> 8", function () {
            expect(easeMedianAngle(1.75, 1, 2, 6, 10)).to.equal(9.414213562373096)
        })
        it("a=2, min=1, max=2, a0=6, a1=10 -> 10", function () {
            expect(easeMedianAngle(2, 1, 2, 6, 10)).to.equal(10)
        })
        it("a=3, min=1, max=2, a0=6, a1=10 -> 10", function () {
            expect(easeMedianAngle(3, 1, 2, 6, 10)).to.equal(10)
        })
    })
    describe("medianAngle()", function () {
        it("6, 10 -> 8", function () {
            expect(medianAngle(6, 10)).to.equal(8)
        })
        it("10, 6 -> 8", function () {
            expect(medianAngle(10, 6)).to.equal(8)
        })
        it("6, 10, 0.25 -> 8", function () {
            expect(medianAngle(6, 10, 0.25)).to.equal(7)
        })
        it("10, 6, 0.25 -> 8", function () {
            expect(medianAngle(10, 6, 0.25)).to.equal(9)
        })
        //  |   |   |   |   |
        // 358  0   2   4   6
        it("358, 6 -> 2", function () {
            expect(medianAngle(358, 6)).to.equal(2)
        })
        it("6, 358 -> 2", function () {
            expect(medianAngle(6, 358)).to.equal(2)
        })
        it("358, 6, 0.25 -> 2", function () {
            expect(medianAngle(358, 6, 0.25)).to.equal(0)
        })
        it("358, 6, 0.75 -> 4", function () {
            expect(medianAngle(358, 6, 0.75)).to.equal(4)
        })
        it("6, 358, 0.25 -> 4", function () {
            expect(medianAngle(6, 358, 0.25)).to.equal(4)
        })
        it("6, 358, 0.75 -> 4", function () {
            expect(medianAngle(6, 358, 0.75)).to.equal(0)
        })
    })
})
