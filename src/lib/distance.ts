import { mat4, vec2, vec3, vec4 } from 'gl-matrix'

/**
 * distance from point p to line which passes through point l0 and l1
 *
 *           | (P L0) x (L0 L1) |
 *     d :=  --------------------
 *               |(L0 L1)|
 *
 * @param p
 * @param l0
 * @param l1
 */
export function distancePointToLine(p: vec3, l0: vec3, l1: vec3): number {
    const lineDirection = vec3.sub(vec3.create(), l1, l0)
    const a = vec3.sub(vec3.create(), l0, p)
    vec3.cross(a, a, lineDirection)
    return vec3.len(a) / vec3.len(lineDirection)
}

/**
 * Find a vertex close to the given screen position
 *
 * @param screen screen position
 * @param vertex vertices to look for
 * @param canvas canvas as passed to createProjectionMatrix(canvas)
 * @param modelViewMatrix model matrix as created with createModelViewMatrix(rotX, rotY)
 * @returns index within vertex closest to the given screen position
 */
export function findVertex(
    screen: vec2,
    vertex: Float32Array,
    canvas: { width: number; height: number },
    modelViewMatrix: mat4
) {
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = canvas.width / canvas.height
    const f = 1.0 / Math.tan(fieldOfView / 2)

    let x = ( screen[0] / canvas.width - 0.5 ) * 2 / f * aspect
    let y = ( screen[1] / canvas.height - 0.5 ) * -2 / f

    const l0 = vec4.fromValues(0, 0, 0, 1)
    const l1 = vec4.fromValues(x, y, -1, 1)
    const inv = mat4.invert(mat4.create(), modelViewMatrix)
    vec4.transformMat4(l0, l0, inv)
    vec4.transformMat4(l1, l1, inv)

    let minD: number | undefined
    let minI: number | undefined

    // console.log(vertex)

    for (let idx = 0; idx < vertex.length; ) {
        const x = vertex[idx++]
        const y = vertex[idx++]
        const z = vertex[idx++]
        const v = vec3.fromValues(x, y, z)

        const d = distancePointToLine(v, l0 as vec3, l1 as vec3)
        // console.log(`${idx/3-1} (${x}, ${y}, ${z})-> ${d}`)
        if (minD === undefined || d < minD) {
            // console.log(`${idx/3} -> ${d}`)
            minD = d
            minI = idx
        }
    }
    if (minI === undefined || minD! > 0.2) {
        return undefined
    }
    // console.log(`findVertex(${vec2.str(screen)}) -> ${minD}, ${minI!-3}`)
    return minI - 3
}
