import { vec3 } from 'gl-matrix'
import { HumanMesh } from 'mesh/HumanMesh'

export function calculateNormals(vertex: number[], indices: number[]): number[] {

    function addNormal(index: number, normal: vec3) {
        const n0 = vec3.fromValues(normals[index], normals[index + 1], normals[index + 2])
        const n1 = vec3.create()
        vec3.add(n1, n0, normal)
        normals[index] = n1[0]
        normals[index + 1] = n1[1]
        normals[index + 2] = n1[2]
        ++counter[index / 3]
    }

    const normals = new Array<number>(vertex.length)
    const counter = new Array<number>(vertex.length / 3)
    normals.fill(0)
    counter.fill(0)
    for (let i = 0; i < indices.length;) {
        const i1 = indices[i++] * 3
        const i2 = indices[i++] * 3
        const i3 = indices[i++] * 3

        const p1 = vec3.fromValues(vertex[i1], vertex[i1 + 1], vertex[i1 + 2])
        const p2 = vec3.fromValues(vertex[i2], vertex[i2 + 1], vertex[i2 + 2])
        const p3 = vec3.fromValues(vertex[i3], vertex[i3 + 1], vertex[i3 + 2])

        const u = vec3.create()
        vec3.subtract(u, p2, p1)

        const v = vec3.create()
        vec3.subtract(v, p3, p1)

        const n = vec3.create()
        vec3.cross(n, u, v)
        vec3.normalize(n, n)

        addNormal(i1, n)
        addNormal(i2, n)
        addNormal(i3, n)
    }
    let normalIndex = 0, counterIndex = 0
    while (counterIndex < counter.length) {
        const normal = vec3.fromValues(normals[normalIndex], normals[normalIndex + 1], normals[normalIndex + 2])
        vec3.scale(normal, normal, 1.0 / counter[counterIndex])
        normals[normalIndex] = normal[0]
        normals[normalIndex + 1] = normal[1]
        normals[normalIndex + 2] = normal[2]
        counterIndex += 1
        normalIndex += 3
    }
    return normals
}
