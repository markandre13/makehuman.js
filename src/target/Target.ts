import { StringToLine } from "../lib/StringToLine"
import { FileSystemAdapter } from "../filesystem/FileSystemAdapter"
import { isZero } from "mesh/HumanMesh"

/**
 * morph target
 */
export class Target {
    data: Array<number> // index    // TODO: this should be an Uint16Array
    verts: Array<number> // x, y, z // TODO: this should be an Float32Array

    constructor() {
        this.verts = new Array<number>()
        this.data = new Array<number>()
    }

    /**
     * load morph target from MakeHuman *.target file
     */
    load(filename: string) {
        this.parse(FileSystemAdapter.readFile(filename))
    }
    parse(data: string) {
        // each line has the format index x y z
        const reader = new StringToLine(data)

        let lineNumber = 0
        for (let line of reader) {
            ++lineNumber
            // console.log(line)
            line = line.trim()
            if (line.length === 0) continue
            if (line[0] === "#") continue
            const tokens = line.split(/\s+/)
            this.data.push(parseInt(tokens[0], 10))
            this.verts.push(parseFloat(tokens[1]))
            this.verts.push(parseFloat(tokens[2]))
            this.verts.push(parseFloat(tokens[3]))
        }
    }

    /**
     * calculate morph target from two lists of vertices
     * 
     * @param src 
     * @param dst 
     */
    diff(src: Float32Array, dst: Float32Array) {
        if (src.length !== dst.length) {
            throw Error(`Target.diff(src, dst): src and dst must have the same length but they are ${src.length} and ${dst.length}`)
        }
        for(let v = 0, i=0; v<src.length; ++i) {
            const sx = src[v]
            const dx = dst[v++]
            const sy = src[v]
            const dy = dst[v++]
            const sz = src[v]
            const dz = dst[v++]
            const x = dx - sx, y = dy - sy, z = dz - sz
            if (!isZero(x) || !isZero(y) || !isZero(z)) {
                this.data.push(i)
                this.verts.push(x, y, z)
            }
        }
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
