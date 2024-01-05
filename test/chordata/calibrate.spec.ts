import { expect, use } from "@esm-bundle/chai"
import { chaiAlmost } from "../chai/chaiAlmost"
import { COOPDecoder } from "../../src/chordata/COOPDecoder"
import { mat3, mat4, quat, quat2 } from "gl-matrix"
use(chaiAlmost())

// this is the current setup of my Chordata Motion.
// branch 2 doesn't work, hence i connected the base
// KCeptor to branch 5 instead.
//
//     LEFT     CENTER    RIGHT
//
//             5/42 neck
// 6/40 l-upperarm      4/40 r-upperarm
//             5/41 dorsal
// 6/41 l-lowerarm      4/41 r-lowerarm
//             5/40 base
// 6/42 l-hand          4/42 r-hand
//
// 1/40 l-upperleg      3/40 r-upperleg
//
// 1/41 l-lowerleg      3/41 r-lowerleg
//
// 1/42 l-foot          3/42 r-foot
//
// <branch>/<id> <name>

// GOAL: apply the chordata input to the makehuman skeleton
//
// Chordata has two calibrations
// KCeptor calibration
//    Needs to be done once for a new KCeptor.
//    The results will be stored inside the KCeptor.
//    The software on the Notochord is able to handle it.
// Pose calibration
//    Needs to be done after KCeptors have been mounted on
//    the body.
//    This consists of two steps:
//    * stand still in N-Pose (straight, arms & legs stretched, arms to body, legs together)
//      this will be used to a first vector
//    * rotate each KCeptor into a defined direction (arms to the sides, body & legs forward)
//      this will be used as a second vector
//    This needs to be implemented in makehuman.js
//
// Chordata's code is in https://gitlab.com/chordata/pose-calibration/
// But it's working with the raw sensor data, not just what is available via COOP
// and I have no clue what's going on by looking at the code...
//
// So I just try to come up with something on my own and see how that works.
//

function radians(d: number) {
    return d / 180 * Math.PI
}

// print in the style of chordata's python matrix
function str(m: mat4) {
    return `Matrix((${m[0]}, ${m[4]}, ${m[8]}, ${m[12]}),
    (${m[1]}, ${m[5]}, ${m[9]}, ${m[13]}),
    (${m[2]}, ${m[6]}, ${m[10]}, ${m[14]}),
    (${m[3]}, ${m[7]}, ${m[11]}, ${m[15]})
)`
}

function qs(q: quat2) {
    return `Quaternion((${q[3]}, ${q[0]}, ${q[1]}, ${q[2]}))`
}

describe("chordata", function () {
    it("calibrate()", function () {
        const identity = mat4.create()
        // console.log(str(mat4.rotateX(mat4.create(), identity, radians(5))))
        // console.log(str(mat4.rotateY(mat4.create(), identity, radians(5))))
        // console.log(str(mat4.rotateZ(mat4.create(), identity, radians(5))))

        console.log(qs(quat2.fromMat4(quat2.create(), mat4.rotateX(mat4.create(), identity, radians(5)))))
        console.log(qs(quat2.fromMat4(quat2.create(), mat4.rotateY(mat4.create(), identity, radians(5)))))
        console.log(qs(quat2.fromMat4(quat2.create(), mat4.rotateZ(mat4.create(), identity, radians(5)))))

        // const q = quat2.fromMat4(quat2.create(), m)

        // // const q = quat.create() // quat.fromValues(1,0,0,0)
        // console.log(quat2.str(q))
        // // const m = mat3.fromQuat(mat3.create(), q)
        // console.log(mat4.str(m))
    })
})
