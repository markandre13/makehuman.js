import { ReadonlyVec3, vec3 } from "gl-matrix"
import { intersectLineAndPlane } from "./intersectLineAndPlane"
import { resolveParamsForPointInPlane } from "./resolveParamsForPointInPlane"

/**
 * intersection of line with plane at P := O + a * A + b * B
 * 
 * d: distance between line origin and plane
 */
export interface Projection {
    a: number
    b: number
    P: vec3
    d: number
}

export function isInTriangle(projection: Projection) {
    return projection.a >= 0 && projection.b >= 0 && projection.a + projection.b <= 1
}

const V = vec3.create()
const T = vec3.create()

/**
 * Project line L + l * D onto plane O + a * A + b * B and return {a, b} or
 * in case the area between A and B is 0, return undefined.
 *
 * Originally intended to map point onto triangle, which is the case when a ≥ 0 ∧ b ≥ 0 ∧ a+b ≤ 1.
 */
export function projectLineOntoPlane(L: ReadonlyVec3, D: ReadonlyVec3, O: ReadonlyVec3, A: ReadonlyVec3, B: ReadonlyVec3): Projection | undefined {
    const n = vec3.cross(V, A, B)
    vec3.normalize(n, n)
    const P = intersectLineAndPlane(T, L, D, O, n)
    if (!P) {
        return undefined
    }
    const param = resolveParamsForPointInPlane(P, O, A, B)
    if (!param) {
        return param
    }
    const d = vec3.distance(L, P)
    return { ...param, P: vec3.clone(P), d }
}
