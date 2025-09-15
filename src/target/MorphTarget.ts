import { StringToLine } from "../lib/StringToLine"
import { FileSystemAdapter } from "../filesystem/FileSystemAdapter"
import { isZero } from "gl/algorithms/isZero"

/**
 * morph target
 */
export class MorphTarget {
    /**
     * indices modified by the morph target
     */
    indices!: Uint16Array
    /**
     * delta translation for indices stored in 'indices'
     */
    dxyz!: Float32Array

    /**
     * load morph target from MakeHuman *.target file
     */
    load(filename: string) {
        this.parse(FileSystemAdapter.readFile(filename))
    }
    parse(data: string) {
        // each line has the format index x y z
        const idx: number[] = []
        const vtx: number[] = []

        const reader = new StringToLine(data)
        let lineNumber = 0
        for (let line of reader) {
            ++lineNumber
            line = line.trim()
            if (line.length === 0) continue
            if (line[0] === "#") continue
            const tokens = line.split(/\s+/)
            idx.push(parseInt(tokens[0], 10))
            vtx.push(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]))
        }
        this.indices = new Uint16Array(idx)
        this.dxyz = new Float32Array(vtx)
    }

    /**
     * calculate morph target from two lists of vertices
     *
     * @param src
     * @param dst
     * @param size an optional size
     */
    diff(src: Float32Array, dst: Float32Array, size?: number) {
        if (src.length !== dst.length) {
            throw Error(
                `MorphTarget.diff(src, dst): src and dst must have the same length but they are ${src.length} and ${dst.length}`
            )
        }
        let length: number
        if (size === undefined) {
            length = src.length
        } else {
            length = size * 3
        }
        const indices: number[] = []
        const dxyz: number[] = []
        for (let v = 0, i = 0; v < length; ++i) {
            const sx = src[v]
            const dx = dst[v++]
            const sy = src[v]
            const dy = dst[v++]
            const sz = src[v]
            const dz = dst[v++]
            const x = dx - sx,
                y = dy - sy,
                z = dz - sz
            if (!isZero(x) || !isZero(y) || !isZero(z)) {
                indices.push(i)
                dxyz.push(x, y, z)
            }
        }
        this.indices = new Uint16Array(indices)
        this.dxyz = new Float32Array(dxyz)
    }

    /**
     * apply morph target to vertices
     *
     * @param verts destination
     * @param scale scale morp target by (value between 0 and 1)
     */
    apply(verts: Float32Array, scale: number) {
        // console.log(`morphing ${this.data.length} vertices by ${scale}`)
        let dataIndex = 0,
            vertexIndex = 0
        while (dataIndex < this.indices.length) {
            let index = this.indices[dataIndex++] * 3
            verts[index++] += this.dxyz[vertexIndex++] * scale
            verts[index++] += this.dxyz[vertexIndex++] * scale
            verts[index++] += this.dxyz[vertexIndex++] * scale
        }
    }
}
