import { StringToLine } from "../lib/StringToLine"
import { FileSystemAdapter } from "../filesystem/FileSystemAdapter"
import { isZero } from "mesh/HumanMesh"

/**
 * morph target
 */
export class Target {
    data!: Uint16Array // index
    verts!: Float32Array // x, y, z

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
        this.data = new Uint16Array(idx)
        this.verts = new Float32Array(vtx)
    }

    /**
     * calculate morph target from two lists of vertices
     * 
     * @param src 
     * @param dst 
     * @parem size an optional size
     */
    diff(src: Float32Array, dst: Float32Array, size?: number) {
        if (src.length !== dst.length) {
            throw Error(`Target.diff(src, dst): src and dst must have the same length but they are ${src.length} and ${dst.length}`)
        }
        let length: number
        if (size === undefined) {
            length = src.length
        } else {
            length = size * 3
        }
        const idx: number[] = []
        const vtx: number[] = []
        for(let v = 0, i=0; v<length; ++i) {
            const sx = src[v]
            const dx = dst[v++]
            const sy = src[v]
            const dy = dst[v++]
            const sz = src[v]
            const dz = dst[v++]
            const x = dx - sx, y = dy - sy, z = dz - sz
            if (!isZero(x) || !isZero(y) || !isZero(z)) {
                idx.push(i)
                vtx.push(x, y, z)
            }
        }
        this.data = new Uint16Array(idx)
        this.verts = new Float32Array(vtx)
    }

    /**
     * apply morph target to vertices
     * 
     * @param verts destination
     * @param scale a value between 0 and 1
     */
    apply(verts: Float32Array, scale: number) {
        // console.log(`morphing ${this.data.length} vertices by ${scale}`)
        let dataIndex = 0,
            vertexIndex = 0
        while (dataIndex < this.data.length) {
            let index = this.data[dataIndex++] * 3
            verts[index++] += this.verts[vertexIndex++] * scale
            verts[index++] += this.verts[vertexIndex++] * scale
            verts[index++] += this.verts[vertexIndex++] * scale
        }
    }
}
