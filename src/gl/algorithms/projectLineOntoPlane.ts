import { ReadonlyVec3, vec3 } from "gl-matrix"
import { intersectLineAndPlane } from "./intersectLineAndPlane"
import { resolveParamsForPointInPlane } from "./resolveParamsForPointInPlane"

/**
 * Project line L + l * D onto plane O + a * A + b * B and return {a, b} or
 * in case the area between A and B is 0, return undefined.
 *
 * Originally intended to map point onto triangle, which is the case when a ≥ 0 ∧ b ≥ 0 ∧ a+b ≤ 1.
 */
export function projectLineOntoPlane(L: ReadonlyVec3, D: ReadonlyVec3, O: ReadonlyVec3, A: ReadonlyVec3, B: ReadonlyVec3) {
    const n = vec3.cross(vec3.create(), A, B)
    vec3.normalize(n, n)
    const P = intersectLineAndPlane(L, D, O, n)
    if (!P) {
        return undefined
    }
    const param = resolveParamsForPointInPlane(P, O, A, B)
    if (!param) {
        return param
    }
    const d = vec3.distance(L, P)
    return { ...param, P, d }
}
