import { expect, use } from "chai"
import { chaiAlmost } from "../../chai/chaiAlmost.js"
use(chaiAlmost(0.00001))
import { vec3 } from "gl-matrix"
import { projectPointOntoPlane } from "../../../src/gl/algorithms/projectPointOntoPlane.js"

describe("projectPointOntoPlane()", () => {
    it("derivation of solution for A=(1,0,0), B=(0,1,0)", () => {
        // GIVEN a triangle T := O + a * A + b * B && a, b in [0, 1] && a+b <= 1
        const O = vec3.fromValues(4, 5, 6)
        const A = vec3.fromValues(7, 8, 9)
        const B = vec3.fromValues(10, 11, 12)
        // and P
        const in_a = 0.1
        const in_b = 0.3
        const P = vec3.clone(O)
        vec3.add(P, P, vec3.scale(vec3.create(), A, in_a))
        vec3.add(P, P, vec3.scale(vec3.create(), B, in_b))
        const inR = vec3.clone(P)
        // cross := right angle away from A & B
        const cross = vec3.cross(vec3.create(), A, B)
        vec3.normalize(cross, cross)
        vec3.scale(cross, cross, -0.4)
        const inD = -vec3.len(cross)
        vec3.add(P, P, cross)
        // now we need to calculate a and b
        // https://stackoverflow.com/questions/55189333/how-to-get-distance-from-point-to-plane-in-3d
        // n := cross( p1-p0 , p2-p0 )
        const n = vec3.cross(vec3.create(), A, B)
        // n := n/|n|
        vec3.normalize(n, n)
        // dist := |dot ( p-p0 , n )|
        const d = vec3.dot(vec3.sub(vec3.create(), P, O), n)
        expect(d).to.almost.equal(inD)
        // PinT := P projected onto T
        const R = vec3.sub(vec3.create(), P, vec3.scale(vec3.create(), n, d))
        expect(R).to.deep.almost.equal(inR)

        // derivation of a and b
        expect(R[0]).to.almost.equal(O[0] + in_a * A[0] + in_b * B[0])
        expect(R[1]).to.almost.equal(O[1] + in_a * A[1] + in_b * B[1])
        expect(R[2]).to.almost.equal(O[2] + in_a * A[2] + in_b * B[2])
        // <=>
        expect((R[0] - O[0] - in_b * B[0]) / A[0]).to.almost.equal(in_a)
        expect((R[1] - O[1] - in_a * A[1]) / B[1]).to.almost.equal(in_b)
        expect(R[2]).to.almost.equal(O[2] + in_a * A[2] + in_b * B[2])
        // <=>
        expect((R[0] - O[0] - in_b * B[0]) / A[0]).to.almost.equal(in_a)
        expect((R[1] - O[1] - ((R[0] - O[0] - in_b * B[0]) / A[0]) * A[1]) / B[1]).to.almost.equal(in_b)
        expect(R[2]).to.almost.equal(O[2] + in_a * A[2] + in_b * B[2])
        // <=>
        const s = A[1] / A[0]
        expect((R[1] - O[1] - (R[0] - O[0] - in_b * B[0]) * s) / B[1]).to.almost.equal(in_b)
        // <=>
        expect((R[1] - O[1] - R[0] * s + O[0] * s + in_b * B[0] * s) / B[1]).to.almost.equal(in_b)
        // <=>
        expect((R[1] - O[1] - R[0] * s + O[0] * s + in_b * B[0] * s) / B[1]).to.almost.equal(in_b)
        // <=>
        expect((R[1] - O[1] - R[0] * s + O[0] * s) / B[1] + in_b * B[0] * s / B[1]).to.almost.equal(in_b)
        // <=>
        expect((R[1] - O[1] - R[0] * s + O[0] * s) / B[1]).to.almost.equal(in_b - in_b * B[0] * s / B[1])
        // <=>
        expect((R[1] - O[1] - R[0] * s + O[0] * s) / B[1]).to.almost.equal(in_b * (1 - B[0] * s / B[1]))
        // <=>
        expect((R[1] - O[1] - R[0] * s + O[0] * s) / B[1] / (1 - B[0] * s / B[1])).to.almost.equal(in_b)
        const b = (R[1] - O[1] - R[0] * s + O[0] * s) / B[1] / (1 - B[0] * s / B[1])
        const a = (R[0] - O[0] - b * B[0]) / A[0]
        expect(b).to.almost.equal(in_b)
        expect(a).to.almost.equal(in_a)
        const projected = projectPointOntoPlane(P, O, A, B)
        expect(projected).to.deep.almost.equal({ a: in_a, b: in_b, d: -0.4, R: inR })
    })

    // the conditions for a triangle with an area > 0 are:
    // * A and B need to have at least one component to be not 0
    // * of those components not 0, they need to be in different postions within A and B,
    //   otherwise A and B would be on the same line
    // => we have the following 6 combinations to handle:
    describe("avoid division by zero", () => {
        it("A=(1,0,0), B=(0,1,0)", () => {
            const O = vec3.fromValues(4, 5, 6)
            const A = vec3.fromValues(1, 0, 0)
            const B = vec3.fromValues(0, 1, 0)
            const a = 0.1
            const b = 0.2
            const d = 0.3
            const { P, R } = makePforT(O, A, B, a, b, d)
            const projected = projectPointOntoPlane(P, O, A, B)
            expect(projected).to.deep.almost.equal({ a, b, d, R })
        })
        it("A=(1,0,0), B=(0,0,1)", () => {
            const O = vec3.fromValues(4, 5, 6)
            const A = vec3.fromValues(1, 0, 0)
            const B = vec3.fromValues(0, 0, 1)
            const a = 0.1
            const b = 0.2
            const d = 0.3
            const { P, R } = makePforT(O, A, B, a, b, d)
            const projected = projectPointOntoPlane(P, O, A, B)
            expect(projected).to.deep.almost.equal({ a, b, d, R })
        })
        it("A=(0,1,0), B=(1,0,0)", () => {
            const O = vec3.fromValues(4, 5, 6)
            const A = vec3.fromValues(0, 1, 0)
            const B = vec3.fromValues(1, 0, 0)
            const a = 0.1
            const b = 0.2
            const d = 0.3
            const { P, R } = makePforT(O, A, B, a, b, d)
            const projected = projectPointOntoPlane(P, O, A, B)
            expect(projected).to.deep.almost.equal({ a, b, d, R })
        })
        it("A=(0,1,0), B=(0,0,1)", () => {
            const O = vec3.fromValues(4, 5, 6)
            const A = vec3.fromValues(0, 1, 0)
            const B = vec3.fromValues(0, 0, 1)
            const a = 0.1
            const b = 0.2
            const d = 0.3
            const { P, R } = makePforT(O, A, B, a, b, d)
            const projected = projectPointOntoPlane(P, O, A, B)
            expect(projected).to.deep.almost.equal({ a, b, d, R })
        })
        it("A=(0,0,1), B=(1,0,0)", () => {
            const O = vec3.fromValues(4, 5, 6)
            const A = vec3.fromValues(0, 0, 1)
            const B = vec3.fromValues(1, 0, 0)
            const a = 0.1
            const b = 0.2
            const d = 0.3
            const { P, R } = makePforT(O, A, B, a, b, d)
            const projected = projectPointOntoPlane(P, O, A, B)
            expect(projected).to.deep.almost.equal({ a, b, d, R })
        })
        it("A=(0,0,1), B=(0,1,0)", () => {
            const O = vec3.fromValues(4, 5, 6)
            const A = vec3.fromValues(0, 0, 1)
            const B = vec3.fromValues(0, 1, 0)
            const a = 0.1
            const b = 0.2
            const d = 0.3
            const { P, R } = makePforT(O, A, B, a, b, d)
            const projected = projectPointOntoPlane(P, O, A, B)
            expect(projected).to.deep.almost.equal({ a, b, d, R })
        })
    })
})
function makePforT(O: vec3, A: vec3, B: vec3, a: number, b: number, d: number) {
    const P = vec3.clone(O)
    vec3.add(P, P, vec3.scale(vec3.create(), A, a))
    vec3.add(P, P, vec3.scale(vec3.create(), B, b))
    const R = vec3.clone(P)
    const cross = vec3.cross(vec3.create(), A, B)
    vec3.scale(cross, cross, d)
    vec3.add(P, P, cross)
    return { P, R }
}
