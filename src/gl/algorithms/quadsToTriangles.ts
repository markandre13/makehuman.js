import { IndexBuffer } from "../buffers/IndexBuffer"

// TODO: make this a method of IndexBuffer?
/**
 * Convert index buffer containing quads to index buffer containing triangles
 *
 * 0   1       0   1     0
 *         ->         &
 * 3   2           2     3   2
 * TODO: input would more regularily be of number[] ?
 * TODO: create GLBuffer ondemand, e.g. via glbuffer(gl: WebGLContext) ?
 * @param quads
 * @returns
 */
export function quadsToTriangles(quads: IndexBuffer): IndexBuffer {
    const data = new Uint16Array((quads.data.length / 4) * 6)
    let i = 0, o = 0
    const b = quads.data
    while (i < b.length) {
        data[o++] = b[i]!
        data[o++] = b[i + 1]!
        data[o++] = b[i + 2]!

        data[o++] = b[i]!
        data[o++] = b[i + 2]!
        data[o++] = b[i + 3]!

        i += 3
    }
    return new IndexBuffer(quads.gl, data)
}
