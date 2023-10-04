// on rotation
// https://docs.blender.org/manual/en/latest/advanced/appendices/rotations.html
// * euler modes: any variation of xyz, trouble is 'gimbal lock'
// * axis angle mode: axis xyz + rotation w
// * quaternion: best


// rotation matrix to euler angles
// https://learnopencv.com/rotation-matrix-to-euler-angles/

import { mat4 } from "gl-matrix"

function almost(left: number, right: number) {
    return Math.abs(left - right) <= 1e-6
}

function isRotation(m: mat4): boolean {
    let mT = mat4.transpose(mat4.create(), m)
    let mI = mat4.invert(mat4.create(), m)
    if (!mat4.equals(mT, mI)) {
        return false
    }
    let d = mat4.determinant(m)
    if (!almost(d, 1.0)) {
        return false
    }
    return true
}

function at(m: mat4, a: number, b: number) {
    return m[a + b * 4]
}

// https://github.com/mrdoob/three.js/blob/f4601f33b222c34dedb4b2d4d5dd554894fab251/src/math/Euler.js#L104
export function toEuler(m: mat4) {
    // if (!isRotation(m)) {
    //     throw Error(`matrix is not rotation with translation`)
    // }

    const sy = at(m, 0, 0) * at(m, 0, 0) + at(m, 0, 1) * at(m, 0, 1)
    const singular = sy < Number.EPSILON

    let x, y, z
    if (!singular) {
        x = Math.atan2(at(m, 2, 1), at(m, 2, 2))
        y = Math.atan2(-at(m, 2, 0), sy)
        z = Math.atan2(at(m, 1, 0), at(m, 0, 0))
    } else {
        x = Math.atan2(-at(m, 1, 2), at(m, 1, 1))
        y = Math.atan2(-at(m, 2, 0), sy)
        z = 0
    }
    return {x,y,z}
}