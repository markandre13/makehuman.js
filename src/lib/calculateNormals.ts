import { vec3 } from 'gl-matrix'

export function calculateNormals(vertex: Float32Array, indices: number[]): number[] {

    function addNormal(index: number, normal: vec3) {
        normals[index] += normal[0]
        normals[index + 1] += normal[1]
        normals[index + 2] += normal[2]
    }

    const normals = new Array<number>(vertex.length)
    normals.fill(0)
    
    // add vectors
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

        addNormal(i1, n)
        addNormal(i2, n)
        addNormal(i3, n)
    }

    // normalize
    for(let normalIndex = 0; normalIndex < vertex.length; normalIndex += 3) {
        const normal = vec3.fromValues(normals[normalIndex], normals[normalIndex + 1], normals[normalIndex + 2])
        vec3.normalize(normal, normal)
        normals[normalIndex] = normal[0]
        normals[normalIndex + 1] = normal[1]
        normals[normalIndex + 2] = normal[2]
    }
    return normals
}
