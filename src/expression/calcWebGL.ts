import { mat4 } from "gl-matrix"

export function calcWebGL(poseMat: mat4, matRestGlobal: mat4): mat4 {
    // prettier-ignore
    let matPose = mat4.fromValues(
        poseMat[0], poseMat[1], poseMat[2],  0,
        poseMat[4], poseMat[5], poseMat[6],  0,
        poseMat[8], poseMat[9], poseMat[10], 0,
        0,          0,          0,           1  )
    const invRest = mat4.invert(mat4.create(), matRestGlobal)
    const m0 = mat4.multiply(mat4.create(), invRest, matPose)
    mat4.multiply(matPose, m0, matRestGlobal)
    matPose[12] = matPose[13] = matPose[14] = 0
    return matPose
}
