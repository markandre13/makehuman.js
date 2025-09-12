// [X] algorithm to convert quads to triangles
//     output is a new index buffer list
// [ ] algorithm for flat shading index buffer
// [ ] algorithm to calculate normals
//     always use triangles as input, compensate by excluding duplicate normals when calculating the median
// [ ] algorithm to create edge indices

import { IndexBuffer } from "../buffers/IndexBuffer"
import { VertexBuffer } from "../buffers/VertexBuffer"

export function indicesForAllVertices(verts: VertexBuffer) {
    const buffer = new Uint16Array(verts.data.length / 3)
    for (let i = 0; i < buffer.length; ++i) {
        buffer[i] = i
    }
    return new IndexBuffer(verts.gl, buffer)
}


