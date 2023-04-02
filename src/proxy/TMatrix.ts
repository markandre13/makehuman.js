import { mat3 } from 'gl-matrix'

export class TMatrix {
    scaleData?: Array<undefined | Array<number>>
    shearData?: Array<undefined | Array<number>>
    lShearData?: Array<undefined | Array<number>>
    rShearData?: Array<undefined | Array<number>>
    getScaleData(words: string[], idx: number) {
        // vn1 & nv2 are an index to a coordinate in the base mesh
        // den will be use to devide the distance between those coordinates
        const vn1 = parseInt(words[0])
        const vn2 = parseInt(words[1])
        const den = parseFloat(words[2])
        if (this.scaleData === undefined) {
            this.scaleData = [undefined, undefined, undefined]
        }
        this.scaleData[idx] = [vn1, vn2, den]
    }
    getShearData(words: string[], idx: number, side: "Left" | "Right" | undefined = undefined) {
        const vn1 = parseInt(words[0])
        const vn2 = parseInt(words[1])
        const x1 = parseFloat(words[2])
        const x2 = parseFloat(words[3])
        const bbdata = [vn1, vn2, x1, x2]
        if (side === "Left") {
            if (this.lShearData === undefined) {
                this.lShearData = [undefined, undefined, undefined]
            }
            this.lShearData[idx] = bbdata

        }
        if (side === "Right") {
            if (this.rShearData === undefined) {
                this.rShearData = [undefined, undefined, undefined]
            }
            this.rShearData[idx] = bbdata
        }
        if (side === undefined) {
            if (this.shearData === undefined) {
                this.shearData = [undefined, undefined, undefined]
            }
            this.shearData[idx] = bbdata
        }
    }
    getMatrix(hcoord: Float32Array): mat3 {
        if (this.scaleData !== undefined) {
            const matrix = mat3.identity(mat3.create())
            for (let n = 0; n < 3; ++n) {
                const [vn1, vn2, den] = this.scaleData[n]!
                const co1 = vn1 * 3
                const co2 = vn2 * 3
                const num = Math.abs(hcoord[co1 + n] - hcoord[co2 + n])
                matrix[n * 3 + n] = num / den
            }
            return matrix
        }
        if (this.shearData !== undefined) {
            throw Error("not implemented")
        }
        if (this.lShearData !== undefined) {
            throw Error("not implemented")
        }
        if (this.rShearData !== undefined) {
            throw Error("not implemented")
        }
        return mat3.identity(mat3.create())
    }
}
