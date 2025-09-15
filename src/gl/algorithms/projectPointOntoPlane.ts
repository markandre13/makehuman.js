import { ReadonlyVec3, vec3 } from "gl-matrix"
import { isZero } from "gl/algorithms/isZero"

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

    // calculate a and b and avoid division by zero
    let a = NaN, b = NaN
    let i, j
    if (!isZero(A[0])) {
        i = 0
        if (!isZero(B[1])) {
            j = 1
        }
        else if (!isZero(B[2])) {
            j = 2
        } else {
            return undefined
        }
    }
    else if (!isZero(A[1])) {
        i = 1
        if (!isZero(B[0])) {
            j = 0
        }
        else if (!isZero(B[2])) {
            j = 2
        } else {
            return undefined
        }
    }
    else if (!isZero(A[2])) {
        i = 2
        if (!isZero(B[0])) {
            j = 0
        }
        else if (!isZero(B[1])) {
            j = 1
        } else {
            return undefined
        }
    } else {
        return undefined
    }
    const s = A[j] / A[i]
    b = (R[j] - O[j] - (R[i] - O[i]) * s) / B[j] / (1 - B[i] * s / B[j])
    a = (R[i] - O[i] - b * B[i]) / A[i]
    return { a, b, d, R }
}
