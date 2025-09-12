// [X] algorithm to convert quads to triangles
//     output is a new index buffer list
// [ ] algorithm for flat shading index buffer
// [ ] algorithm to calculate normals
//     always use triangles as input, compensate by excluding duplicate normals when calculating the median
// [ ] algorithm to create edge indices

import { vec3 } from "gl-matrix"
import { IndexBuffer } from "./buffers/IndexBuffer"
import { VertexBuffer } from "./buffers/VertexBuffer"
import { NormalBuffer } from "./buffers/NormalBuffer"

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

export function indicesForAllVertices(verts: VertexBuffer) {
    const buffer = new Uint16Array(verts.data.length / 3)
    for (let i = 0; i < buffer.length; ++i) {
        buffer[i] = i
    }
    return new IndexBuffer(verts.gl, buffer)
}

export function trianglesToFlatTriangles() { }

export function quadsToEdges(gl: WebGL2RenderingContext, quads: number[] | Uint16Array): IndexBuffer {
    const edges: number[] = []
    const knownEdges = new Map<number, Set<number>>()

    function edge(e0: number, e1: number) {
        let m0 = knownEdges.get(e0)
        let m1 = knownEdges.get(e1)
        if (m0 === undefined && m1 === undefined) {
            edges.push(e0, e1)
            knownEdges.set(e0, new Set([e1]))
            return
        }
        if (m0 === undefined) {
            [m0, m1] = [m1, m0];
            [e0, e1] = [e1, e0]
        }
        if (m0!.has(e1)) {
            return
        }
        m0!.add(e1)
        edges.push(e0, e1)
    }
    const data = quads
    for (let i = 0; i < data.length;) {
        const e0 = data[i++]!
        const e1 = data[i++]!
        const e2 = data[i++]!
        const e3 = data[i++]!
        edge(e0, e1)
        edge(e1, e2)
        edge(e2, e3)
        edge(e3, e0)
    }
    return new IndexBuffer(gl, edges)
}

export function trianglesToEdges(gl: WebGL2RenderingContext, triangles: number[] | Uint16Array): IndexBuffer {
    const edges: number[] = []
    const knownEdges = new Map<number, Set<number>>()

    function edge(e0: number, e1: number) {
        let m0 = knownEdges.get(e0)
        let m1 = knownEdges.get(e1)
        if (m0 === undefined && m1 === undefined) {
            edges.push(e0, e1)
            knownEdges.set(e0, new Set([e1]))
            return
        }
        if (m0 === undefined) {
            [m0, m1] = [m1, m0];
            [e0, e1] = [e1, e0]
        }
        if (m0!.has(e1)) {
            return
        }
        m0!.add(e1)
        edges.push(e0, e1)
    }
    const data = triangles
    for (let i = 0; i < data.length;) {
        const e0 = data[i++]!
        const e1 = data[i++]!
        const e2 = data[i++]!
        edge(e0, e1)
        edge(e1, e2)
        edge(e2, e0)
    }
    return new IndexBuffer(gl, edges)
}