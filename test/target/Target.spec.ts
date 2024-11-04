import { expect } from "chai"

import { Target } from "../../src/target/Target"

describe("class Target", function () {
    describe("load(filename)/parse(filecontent)", () => {
        it("an empty file will result in an empty target", () => {
            const target = new Target()
            target.parse(``)
            expect(target.data.length).to.equal(0)
            expect(target.verts.length).to.equal(0)
        })
        it("parses lines of the format: index x y z", () => {
            const target = new Target()
            target.parse(`1 0.1 0.2 0.3\n9 0.7 0.8 0.9`)
            expect(target.data.length).to.equal(2)
            expect(target.data).to.deep.equal(new Uint16Array([1, 9]))
            expect(target.verts.length).to.equal(6)
            expect(target.verts).to.deep.equal(new Float32Array([0.1, 0.2, 0.3, 0.7, 0.8, 0.9]))
        })
        it("will skip empty lines", () => {
            const target = new Target()
            target.parse(`\n1 0.1 0.2 0.3\n\n9 0.7 0.8 0.9\n`)
            expect(target.data.length).to.equal(2)
            expect(target.data).to.deep.equal(new Uint16Array([1, 9]))
            expect(target.verts.length).to.equal(6)
            expect(target.verts).to.deep.equal(new Float32Array([0.1, 0.2, 0.3, 0.7, 0.8, 0.9]))
        })
        it("will skip comments, which start with '#'", () => {
            const target = new Target()
            target.parse(`# comment\n1 0.1 0.2 0.3\n#foo\n9 0.7 0.8 0.9\n#bar`)
            expect(target.data.length).to.equal(2)
            expect(target.data).to.deep.equal(new Uint16Array([1, 9]))
            expect(target.verts.length).to.equal(6)
            expect(target.verts).to.deep.equal(new Float32Array([0.1, 0.2, 0.3, 0.7, 0.8, 0.9]))
        })
    })
    describe("diff(source, target)", () => {
        it("can calculate the target from two vertex lists", () => {
            const src = new Float32Array([
                // prettier-ignore
                1, 2, 3,
                4, 5, 6
            ])
            const dst = new Float32Array([
                // prettier-ignore
                1, 2, 3,
                4 + 7, 5 + 8, 6 + 9
            ])
            const target = new Target()
            target.diff(src, dst)
            expect(target.data).to.deep.equal(new Uint16Array([1]))
            expect(target.verts).to.deep.equal(new Float32Array([7,8,9]))
        })
    })
})
