import { Human } from "Human"

export class ProxyRefVert {
    _verts!: number[]
    _weights!: number[]
    _offset!: number[]
    constructor(human: Human) {
    }
    fromSingle(words: string[], vnum: number, vertWeights: Map<number, Array<Array<number>>>) {
        const v0 = parseInt(words[0])
        this._verts = [v0, 0, 1]
        this._weights = [1.0, 0.0, 0.0]
        this._offset = [0, 0, 0]
        this._addProxyVertWeight(vertWeights, v0, vnum, 1)
    }
    fromTriple(words: string[], vnum: number, vertWeights: Map<number, Array<Array<number>>>) {
        const v0 = parseInt(words[0])
        const v1 = parseInt(words[1])
        const v2 = parseInt(words[2])
        const w0 = parseFloat(words[3])
        const w1 = parseFloat(words[4])
        const w2 = parseFloat(words[5])
        let d0, d1, d2
        if (words.length > 6) {
            d0 = parseFloat(words[6])
            d1 = parseFloat(words[7])
            d2 = parseFloat(words[8])
        } else {
            [d0, d1, d2] = [0, 0, 0]
        }

        this._verts = [v0, v1, v2]
        this._weights = [w0, w1, w2]
        this._offset = [d0, d1, d2]

        this._addProxyVertWeight(vertWeights, v0, vnum, w0)
        this._addProxyVertWeight(vertWeights, v1, vnum, w1)
        this._addProxyVertWeight(vertWeights, v2, vnum, w2)
    }
    protected _addProxyVertWeight(vertWeights: Map<number, Array<Array<number>>>, v: number, pv: number, w: number) {
        if (vertWeights.has(v)) {
            vertWeights.get(v)!.push([pv, w])
        } else {
            vertWeights.set(v, [[pv, w]])
        }
    }
}
