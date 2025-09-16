import { ReadonlyVec3, vec3 } from "gl-matrix"
import { resolveParamsForPointInPlane } from "./resolveParamsForPointInPlane"

/**
 * Project point P onto plane T := O + a * A + b * B and return {a, b} or
 * in case the area between A and B is 0, return undefined.
 * 
 * Originally intended to map point onto triangle, which is the case when a ≥ 0 ∧ b ≥ 0 ∧ a+b ≤ 1.
 */
export function projectPointOntoPlane(P: ReadonlyVec3, O: ReadonlyVec3, A: ReadonlyVec3, B: ReadonlyVec3) {
    // https://stackoverflow.com/questions/55189333/how-to-get-distance-from-point-to-plane-in-3d
    // n := cross( p1-p0 , p2-p0 )
    const n = vec3.cross(vec3.create(), A, B)
    // n := n/|n|
    vec3.normalize(n, n)
    // dist := |dot ( p-p0 , n )|
    const d = vec3.dot(vec3.sub(vec3.create(), P, O), n)
    
    // R := P projected onto T
    const R = vec3.sub(vec3.create(), P, vec3.scale(vec3.create(), n, d))
    const param = resolveParamsForPointInPlane(R, O, A, B)
    if (!param) {
        return param
    }
    return { ...param, d, R }
}
