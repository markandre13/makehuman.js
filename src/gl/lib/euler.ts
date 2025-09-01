/*
 * converted from
 * https://github.com/cgohlke/transformations
 * Copyright (c) 2006-2022, Christoph Gohlke
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

import { mat4 } from "gl-matrix"
/**
 * Return homogeneous rotation matrix from Euler angles and axis sequence.
 *
 * ai, aj, ak : Euler's roll, pitch and yaw angles
 * axes : One of 24 axis sequences as string or encoded tuple
 */
export function euler_matrix(ai: number, aj: number, ak: number, axes: string = "sxyz"): mat4 {
    const tmp = _AXES2TUPLE.get(axes)
    if (tmp === undefined) {
        throw Error(`invalid axes of '${axes}'`)
    }
    const [firstaxis, parity, repetition, frame] = tmp

    let i = firstaxis!
    let j = _NEXT_AXIS[i + parity!]!
    let k = _NEXT_AXIS[i - parity! + 1]!

    if (frame) {
        ;[ai, ak] = [ak, ai]
    }
    if (parity) {
        ;[ai, aj, ak] = [-ai, -aj, -ak]
    }

    let [si, sj, sk] = [Math.sin(ai), Math.sin(aj), Math.sin(ak)]
    let [ci, cj, ck] = [Math.cos(ai), Math.cos(aj), Math.cos(ak)]
    let [cc, cs] = [ci * ck, ci * sk]
    let [sc, ss] = [si * ck, si * sk]

    const M = mat4.create()

    function set(row: number, col: number, v: number) {
        M[col * 4 + row] = v
    }
    if (repetition) {
        set(i, i, cj)
        set(i, j, sj * si)
        set(i, k, sj * ci)
        set(j, i, sj * sk)
        set(j, j, -cj * ss + cc)
        set(j, k, -cj * cs - sc)
        set(k, i, -sj * ck)
        set(k, j, cj * sc + cs)
        set(k, k, cj * cc - ss)
    } else {
        set(i, i, cj * ck)
        set(i, j, sj * sc - cs)
        set(i, k, sj * cc + ss)
        set(j, i, cj * sk)
        set(j, j, sj * ss + cc)
        set(j, k, sj * cs - sc)
        set(k, i, -sj)
        set(k, j, cj * si)
        set(k, k, cj * ci)
    }
    return M
}

/**
 * Return Euler angles from rotation matrix for specified axis sequence.
 *
 * Note that many Euler angle triplets can describe one matrix.
 * 
 * @param matrix
 * @param axes One of 24 axis sequences as string or encoded tuple
 */
export function euler_from_matrix(M: mat4, axes = "sxyz") {
    const tmp = _AXES2TUPLE.get(axes)
    if (tmp === undefined) {
        throw Error(`invalid axes of '${axes}'`)
    }
    const [firstaxis, parity, repetition, frame] = tmp

    const i = firstaxis!
    const j = _NEXT_AXIS[i + parity!]!
    const k = _NEXT_AXIS[i - parity! + 1]!

    function get(M: mat4, row: number, col: number) {
        return M[col * 4 + row]!
    }

    let x, y, z
    if (repetition) {
        const sy = Math.sqrt(get(M, i, j) * get(M, i, j) + get(M, i, k) * get(M, i, k))
        if (sy > Number.EPSILON) {
            x = Math.atan2(get(M, i, j), get(M, i, k))
            y = Math.atan2(sy, get(M, i, i))
            z = Math.atan2(get(M, j, i), -get(M, k, i))
        } else {
            x = Math.atan2(-get(M, j, k), get(M, j, j))
            y = Math.atan2(sy, get(M, i, i))
            z = 0.0
        }
    } else {
        const cy = Math.sqrt(get(M, i, i) * get(M, i, i) + get(M, j, i) * get(M, j, i))
        if (cy > Number.EPSILON) {
            x = Math.atan2(get(M, k, j), get(M, k, k))
            y = Math.atan2(-get(M, k, i), cy)
            z = Math.atan2(get(M, j, i), get(M, i, i))
        } else {
            x = Math.atan2(-get(M, j, k), get(M, j, j))
            y = Math.atan2(-get(M, k, i), cy)
            z = 0.0
        }
    }
    if (parity) {
        [x, y, z] = [-x, -y, -z]
    }
    if (frame) {
        [x, z] = [z, x]
    }
    return { x, y, z }
}

// axis sequences for Euler angles
const _NEXT_AXIS = [1, 2, 0, 1]

// map axes strings to/from tuples of inner axis, parity, repetition, frame
const _AXES2TUPLE = new Map([
    ["sxyz", [0, 0, 0, 0]],
    ["sxyx", [0, 0, 1, 0]],
    ["sxzy", [0, 1, 0, 0]],
    ["sxzx", [0, 1, 1, 0]],
    ["syzx", [1, 0, 0, 0]],
    ["syzy", [1, 0, 1, 0]],
    ["syxz", [1, 1, 0, 0]],
    ["syxy", [1, 1, 1, 0]],
    ["szxy", [2, 0, 0, 0]],
    ["szxz", [2, 0, 1, 0]],
    ["szyx", [2, 1, 0, 0]],
    ["szyz", [2, 1, 1, 0]],

    ["rzyx", [0, 0, 0, 1]],
    ["rxyx", [0, 0, 1, 1]],
    ["ryzx", [0, 1, 0, 1]],
    ["rxzx", [0, 1, 1, 1]],
    ["rxzy", [1, 0, 0, 1]],
    ["ryzy", [1, 0, 1, 1]],
    ["rzxy", [1, 1, 0, 1]],
    ["ryxy", [1, 1, 1, 1]],
    ["ryxz", [2, 0, 0, 1]],
    ["rzxz", [2, 0, 1, 1]],
    ["rxyz", [2, 1, 0, 1]],
    ["rzyz", [2, 1, 1, 1]],
])
