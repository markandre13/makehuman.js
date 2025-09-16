import { ReadonlyVec3 } from "gl-matrix"
import { isZero } from "./isZero"

/**
  * Given point P within plane T := O + a * A + b * B and return {a, b} or
  * in case the area between A and B is 0, return undefined.
  */

export function resolveParamsForPointInPlane(P: ReadonlyVec3, O: ReadonlyVec3, A: ReadonlyVec3, B: ReadonlyVec3) {
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
    const b = (P[j] - O[j] - (P[i] - O[i]) * s) / B[j] / (1 - B[i] * s / B[j])
    const a = (P[i] - O[i] - b * B[i]) / A[i]
    return { a, b }
}
