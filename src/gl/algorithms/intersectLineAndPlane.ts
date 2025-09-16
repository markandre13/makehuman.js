import { ReadonlyVec3, vec3 } from "gl-matrix"
import { isZero } from "./isZero"

/**
 * point of intersection between line and plane
 *
 * @param l0 line: some point on line
 * @param l line: line direction
 * @param p0 plane: some point on plane
 * @param n plane: normal
 * @returns vec3: point of intersection, null: no intersection, undefined: plane contains whole line
 */
export function intersectLineAndPlane(l0: ReadonlyVec3, l: ReadonlyVec3, p0: ReadonlyVec3, n: ReadonlyVec3): vec3 | null | undefined {
    // https://en.wikipedia.org/wiki/Line–plane_intersection
    const v = vec3.sub(vec3.create(), p0, l0)
    const dividend = vec3.dot(v, n)
    const divisor = vec3.dot(l, n)
    if (isZero(divisor)) {
        if (isZero(dividend)) {
            // plane contains line
            return undefined
        } else {
            // no intersection
            return null
        }
    }
    const r = vec3.clone(l)
    vec3.scale(r, r, dividend / divisor)
    vec3.add(r, r, l0)
    return r
}
