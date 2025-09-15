import { vec3 } from 'gl-matrix'

/**
 * distance from point P to line which passes through points L0 and L1
 *
 *           | (P L0) x (L0 L1) |
 *     d :=  --------------------
 *                |(L0 L1)|
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
