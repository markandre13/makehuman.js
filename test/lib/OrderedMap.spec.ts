import { expect } from '@esm-bundle/chai'
import { OrderedMap } from '../../src/lib/OrderedMap'

const epsilon = Number.EPSILON
// const epsilon = 0.000000001

describe("OrderedMap", () => {
    const less = (a: number, b: number) => a < b
    describe("set(key, value); set", () => {
        it("one entry", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(10, 50)
            expect(map.size).to.equal(1)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }])
        })
        it("two entries: 1st < 2nd", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(10, 50)
            map.set(20, 60)
            expect(map.size).to.equal(2)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }, { k: 20, v: 60 }])
        })
        it("two entries: 1st > 2nd", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(20, 60)
            map.set(10, 50)
            expect(map.size).to.equal(2)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }, { k: 20, v: 60 }])
        })
        it("three entries: 10, 20, 30", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(10, 50)
            map.set(20, 60)
            map.set(30, 70)
            expect(map.size).to.equal(3)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }, { k: 20, v: 60 }, { k: 30, v: 70 }])
        })
        it("three entries: 20, 10, 30", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(20, 60)
            map.set(10, 50)
            map.set(30, 70)
            expect(map.size).to.equal(3)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }, { k: 20, v: 60 }, { k: 30, v: 70 }])
        })
        it("three entries: 20, 30, 10", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(20, 60)
            map.set(30, 70)
            map.set(10, 50)
            expect(map.size).to.equal(3)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }, { k: 20, v: 60 }, { k: 30, v: 70 }])
        })
        it("three entries: 30, 20, 10", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(30, 70)
            map.set(20, 60)
            map.set(10, 50)
            expect(map.size).to.equal(3)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }, { k: 20, v: 60 }, { k: 30, v: 70 }])
        })
    })
    describe("set(key, value); replace", () => {
        it("one entry", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(10, 50)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }])
            map.set(10, 55)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 55 }])
        })
        it("two entries", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(10, 50)
            map.set(20, 60)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }, { k: 20, v: 60 }])
            map.set(10, 55)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 55 }, { k: 20, v: 60 }])
            map.set(20, 65)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 55 }, { k: 20, v: 65 }])
        })
        it("three entries", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(10, 50)
            map.set(20, 60)
            map.set(30, 70)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 50 }, { k: 20, v: 60 }, { k: 30, v: 70 }])
            map.set(10, 55)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 55 }, { k: 20, v: 60 }, { k: 30, v: 70 }])
            map.set(20, 65)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 55 }, { k: 20, v: 65 }, { k: 30, v: 70 }])
            map.set(30, 75)
            expect(map.entries()).to.deep.equal([{ k: 10, v: 55 }, { k: 20, v: 65 }, { k: 30, v: 75 }])
        })
    })
    describe("get(key): value", () => {
        it("empty", () => {
            const map = new OrderedMap<number, number>(less)
            expect(map.size).to.equal(0)
            expect(map.get(8)).to.equal(undefined)
        })
        it("one entry", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(20, 40)

            expect(map.size).to.equal(1)
            expect(map.get(15)).to.equal(undefined)
            expect(map.get(20)).to.equal(40)
            expect(map.get(25)).to.equal(undefined)
        })
        it("two entries", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(20, 40)
            map.set(30, 50)

            expect(map.get(15)).to.equal(undefined)
            expect(map.get(20)).to.equal(40)
            expect(map.get(25)).to.equal(undefined)
            expect(map.get(30)).to.equal(50)
            expect(map.get(35)).to.equal(undefined)
        })
        it("three entries", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(20, 40)
            map.set(30, 50)
            map.set(40, 60)

            expect(map.get(15)).to.equal(undefined)
            expect(map.get(20)).to.equal(40)
            expect(map.get(25)).to.equal(undefined)
            expect(map.get(30)).to.equal(50)
            expect(map.get(35)).to.equal(undefined)
            expect(map.get(40)).to.equal(60)
            expect(map.get(45)).to.equal(undefined)
        })

        it("four entries", () => {
            const map = new OrderedMap<number, number>(less)
            map.set(20, 40)
            map.set(30, 50)
            map.set(40, 60)
            map.set(50, 70)

            expect(map.get(15)).to.equal(undefined)
            expect(map.get(20)).to.equal(40)
            expect(map.get(25)).to.equal(undefined)
            expect(map.get(30)).to.equal(50)
            expect(map.get(35)).to.equal(undefined)
            expect(map.get(40)).to.equal(60)
            expect(map.get(45)).to.equal(undefined)
            expect(map.get(50)).to.equal(70)
            expect(map.get(55)).to.equal(undefined)
        })
    })
})


const m = new Map<number, number>()