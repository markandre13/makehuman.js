import { IndexBuffer } from "../buffers/IndexBuffer"

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
