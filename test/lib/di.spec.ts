import { expect } from "chai"
import { di } from "../../src/lib/di";

class A {
    private _name: string
    constructor(name: string) {
        // console.log(`A.constructor("${name}")`)
        this._name = name
    }
    get name(): string {
        return this._name
    }
}

class B {
    private _child: A
    constructor(child: A) {
        // console.log(`B.constructor(A)`)
        this._child = child
    }
    get name(): string {
        return this._child.name
    }
}

class C {
    private _child: B
    constructor(child: B) {
        // console.log(`C.constructor(B)`)
        this._child = child
    }
    get name(): string {
        return this._child.name
    }
}

class U {
    private _name: string
    constructor(name: string) {
        // console.log(`U.constructor("${name}")`)
        this._name = name
    }
    get name(): string {
        return this._name
    }
}

class V {
    private _name: string
    constructor(name: string) {
        // console.log(`V.constructor("${name}")`)
        this._name = name
    }
    get name(): string {
        return this._name
    }
}

class W {
    private _name: string
    constructor(name: string) {
        // console.log(`W.constructor("${name}")`)
        this._name = name
    }
    get name(): string {
        return this._name
    }
}

class S {
    private _u: U
    private _v: V
    constructor(u: U, v: V) {
        // console.log(`S.constructor(U ,V)`)
        this._u = u
        this._v = v
    }
    get name(): string {
        return `${this._u.name} + ${this._v.name}`
    }
}

class T {
    private _u: U
    private _v: V
    private _w: W

    constructor(u: U, v: V, w: W) {
        // console.log(`S.constructor(U ,V, W)`)
        this._u = u
        this._v = v
        this._w = w
    }
    get name(): string {
        return `${this._u.name} + ${this._v.name} + ${this._w.name}`
    }
}

describe("simple Dependency Injection inspired by KOIN", () => {
    beforeEach(() => {
        di.clear()
    })
    describe("single(CLASS, () => new CLASS()) -> get(CLASS)", () => {
        it("get() returns the singleton created by single()", () => {
            di.single(A, () => new A("alpha"))

            const a = di.get(A)

            expect(a).to.be.instanceOf(A)
            expect(a.name).to.equal("alpha")
        })
        it("get() for single() always returns the same instance", () => {
            di.single(A, () => new A("alpha"))

            const a0 = di.get(A)
            const a1 = di.get(A)

            expect(a0).to.equal(a1)
        })
    })
    describe("variations of instantiating objects which depend on other objects", () => {
        it("chain of two", () => {
            di.single(B, () => new B(di.get(A)))
            di.single(A, () => new A("bravo"))

            const b = di.get(B)

            expect(b).to.be.instanceOf(B)
            expect(b.name).to.equal("bravo")
        })
        it("chain of three", () => {
            di.single(C, () => new C(di.get(B)))
            di.single(B, () => new B(di.get(A)))
            di.single(A, () => new A("bravo"))

            const c = di.get(C)

            expect(c).to.be.instanceOf(C)
            expect(c.name).to.equal("bravo")
        })
        it("dependency of two", () => {
            di.single(S, () => new S(di.get(U), di.get(V)))
            di.single(U, () => new U("alfa"))
            di.single(V, () => new V("bravo"))

            const s = di.get(S)

            expect(s).to.be.instanceOf(S)
            expect(s.name).to.equal("alfa + bravo")
        })
        it("dependency of three", () => {
            di.single(T, () => new T(di.get(U), di.get(V), di.get(W)))
            di.single(U, () => new U("alfa"))
            di.single(V, () => new V("bravo"))
            di.single(W, () => new W("charly"))

            const t = di.get(T)

            expect(t).to.be.instanceOf(T)
            expect(t.name).to.equal("alfa + bravo + charly")
        })
    })
})
