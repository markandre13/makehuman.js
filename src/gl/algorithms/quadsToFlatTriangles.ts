import { vec3 } from "gl-matrix"
import { IndexBuffer } from "../buffers/IndexBuffer"
import { NormalBuffer } from "../buffers/NormalBuffer"
import { VertexBuffer } from "../buffers/VertexBuffer"

export function quadsToFlatTriangles(verts: VertexBuffer, quads: IndexBuffer) {
    const offset = 0
    const length = quads.data.length
    const xyz = verts.data
    const fxyz = quads.data
    const f2: number[] = []
    const v2: number[] = []
    const n2: number[] = []

    const p0 = vec3.create()
    const p1 = vec3.create()
    const p2 = vec3.create()
    const p3 = vec3.create()
    const u = vec3.create()
    const v = vec3.create()
    const n = vec3.create()

    for (let i = offset, fo = 0; i < length + offset;) {
        let i0 = fxyz[i++]! * 3
        let i1 = fxyz[i++]! * 3
        let i2 = fxyz[i++]! * 3
        let i3 = fxyz[i++]! * 3

        vec3.set(p0, xyz[i0]!, xyz[i0 + 1]!, xyz[i0 + 2]!)
        vec3.set(p1, xyz[i1]!, xyz[i1 + 1]!, xyz[i1 + 2]!)
        vec3.set(p2, xyz[i2]!, xyz[i2 + 1]!, xyz[i2 + 2]!)
        vec3.set(p3, xyz[i3]!, xyz[i3 + 1]!, xyz[i3 + 2]!)

        // vertices for quad
        v2.push(...p0)
        v2.push(...p1)
        v2.push(...p2)
        v2.push(...p3)

        // two triangles for quad
        f2.push(fo)
        f2.push(fo + 1)
        f2.push(fo + 2)
        f2.push(fo)
        f2.push(fo + 2)
        f2.push(fo + 3)
        fo += 4

        // normals
        vec3.subtract(u, p2, p1)
        vec3.subtract(v, p3, p1)
        vec3.cross(n, u, v)
        vec3.normalize(n, n)

        n2.push(...n)
        n2.push(...n)
        n2.push(...n)
        n2.push(...n)
    }

    return {
        vertices: new VertexBuffer(verts.gl, v2),
        normals: new NormalBuffer(verts.gl, n2),
        indices: new IndexBuffer(verts.gl, f2),
    }
}
