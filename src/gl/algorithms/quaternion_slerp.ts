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

import { quat2 } from "gl-matrix"

/**
 * Return spherical linear interpolation between two quaternions.
 * 
 * @param quat0 
 * @param quat1 
 * @param fraction 
 * @param spin 
 * @param shortestpath 
 */
export function quaternion_slerp(quat0: quat2, quat1: quat2, fraction: number, spin = 0, shortestpath = true) {
    const _EPS = Number.EPSILON * 4.0

    let q0 = quat2.copy(quat2.create(), quat0)
    const q1 = quat2.copy(quat2.create(), quat1)

    // console.log(`Q0 = ${quat0}`)
    // console.log(`Q0 = ${q0}`)
    // console.log(`Q1 = ${quat1}`)
    // console.log(`Q1 = ${q1}`)

    if (fraction === 0.0) {
        return q0
    }
    if (fraction === 1.0) {
        return q1
    }
    let d = quat2.dot(q0 as any, q1 as any)

    if (Math.abs(Math.abs(d) - 1.0) < _EPS) {
        return q0
    }
    if (shortestpath && d < 0.0) {
        // invert rotation
        d = -d
        for (let i = 0; i < q0.length; ++i) {
            q0[i] = -q0[i]
        }
    }
    const angle = Math.acos(d) + spin * Math.PI
    if (Math.abs(angle) < _EPS) {
        return q0
    }
    const isin = 1.0 / Math.sin(angle)
    const a0 = Math.sin((1.0 - fraction) * angle) * isin
    const a1 = Math.sin(fraction * angle) * isin
    const q2 = quat2.create()
    for (let i = 0; i < q0.length; ++i) {
        q0[i] *= a0
        q1[i] *= a1
        q2[i] = q1[i] + q0[i]
    }
    return q2
}
