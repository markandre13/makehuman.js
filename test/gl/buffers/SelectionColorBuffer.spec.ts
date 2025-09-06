import { expect, use } from "chai"
import { chaiAlmost } from "../../chai/chaiAlmost"
use(chaiAlmost())

import { SelectionColorBuffer } from "../../../src/gl/buffers/SelectionColorBuffer"
import { VertexBuffer } from "../../../src/gl/buffers/VertexBuffer"

describe("SelectionColorBuffer", () => {
    let selection!: SelectionColorBuffer
    beforeEach(() => {
        const vertices = new VertexBuffer({} as any, [0, 1, 2, 3, 4, 5, 6, 7, 8])
        selection = new SelectionColorBuffer(vertices)
    })
    describe("indicds", () => {
        it("a new selection is empty", () => {
            expect(selection.array).to.deep.equal([])
        })
        it("set(index, bool) can select/deselect an index", () => {
            selection.set(0, true)
            selection.set(2, true)
            expect(selection.array).to.deep.equal([0, 2])
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                1, 1, 1,
                0, 0, 0,
                1, 1, 1
            ]))


            selection.set(2, false)
            expect(selection.array).to.deep.equal([0])
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                1, 1, 1,
                0, 0, 0,
                0, 0, 0
            ]))
        })
        it("toggle(index) select/deselect an index", () => {
            selection.toggle(1)
            expect(selection.array).to.deep.equal([1])
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                0, 0, 0,
                1, 1, 1,
                0, 0, 0,
            ]))

            selection.toggle(1)
            expect(selection.array).to.deep.equal([])
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                0, 0, 0,
                0, 0, 0,
                0, 0, 0,
            ]))


        })
        it("clear() removes all indices", () => {
            selection.set(0, true)
            selection.set(2, true)
            selection.clear()
            expect(selection.array).to.deep.equal([])
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                0, 0, 0,
                0, 0, 0,
                0, 0, 0,
            ]))

        })
        it("array = [...] can set indices", () => {
            selection.array = [0, 2]
            expect(selection.array).to.deep.equal([0, 2])
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                1, 1, 1,
                0, 0, 0,
                1, 1, 1,
            ]))

            selection.array = [1]
            expect(selection.array).to.deep.equal([1])
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                0, 0, 0,
                1, 1, 1,
                0, 0, 0,
            ]))

        })
    })
    describe("colors", () => {
        it("initial all black", () => {
            expect(selection.data).to.deep.equal(new Float32Array([
                0, 0, 0,
                0, 0, 0,
                0, 0, 0
            ]))
        })
        it("index is white", () => {
            selection.set(1, true)
            expect(selection.data).to.deep.equal(new Float32Array([
                0, 0, 0,
                1, 1, 1,
                0, 0, 0,
            ]))
        })
        // almost
        // why the heck 32 floating point??? what a waste!!!
        it("color can be changed after indices had been set", () => {
            selection.set(1, true)
            selection.rgb = [0.2, 0.5, 0.7]
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                0, 0, 0,
                0.2, 0.5, 0.7,
                0, 0, 0,
            ]))
        })
        it("color can be changed before indices are set", () => {
            selection.rgb = [0.2, 0.5, 0.7]
            selection.set(1, true)
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                0, 0, 0,
                0.2, 0.5, 0.7,
                0, 0, 0,
            ]))
        })
        it("clear()", () => {
            selection.set(1, true)
            selection.clear()
            expect(selection.data).to.deep.almost.equal(new Float32Array([
                0, 0, 0,
                0, 0, 0,
                0, 0, 0,
            ]))
        })

    })
})