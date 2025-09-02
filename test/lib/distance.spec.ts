import { expect, use } from 'chai'
import { chaiAlmost } from '../chai/chaiAlmost'
import { mat4, vec2, vec3, vec4 } from 'gl-matrix'
use(chaiAlmost(0.0001))

import { distancePointToLine, findVertex } from '../../src/lib/distance'
import {
    createModelViewMatrix,
    createProjectionMatrix,
} from '../../src/render/util'

describe('lib', function () {
    it('distancePointToLine(P, L0, L1): number', function () {
        const p = vec3.fromValues(15, 17, 12)
        const origin = vec3.fromValues(2, 5, 7)
        const direction = vec3.fromValues(3, 8, 9)
        
        const l0 = vec3.scaleAndAdd(vec3.create(), origin, direction, -1.32)
        const l1 = vec3.scaleAndAdd(vec3.create(), origin, direction, 2.23)

        expect(distancePointToLine(p, l0, l1)).to.almost.equal(11.296476867164806)

        const m0 = vec3.scaleAndAdd(vec3.create(), origin, direction, 8.72)
        const m1 = vec3.scaleAndAdd(vec3.create(), origin, direction, -32.15)
        expect(distancePointToLine(p, m0, m1)).to.almost.equal(11.296476867164806)
    })

//   screen space
    it('world to screen to world', function() {
        // GIVEN
        const canvas = { width: 1061, height: 878 }

        // GIVEN from model to screen
        const pointInModelSpace = vec4.fromValues(-0.6809099912643433, -2.361138105392456, 3.3671700954437256, 1)
        const projectionMatrix = createProjectionMatrix(canvas)
        const modelViewMatrix = createModelViewMatrix({rotateX: 15, rotateY: 25} as any)
        const m0 = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix)
        const pointInClipSpace = vec4.transformMat4(vec4.create(), pointInModelSpace, m0)
        const screen = vec2.fromValues(pointInClipSpace[0]/pointInClipSpace[3], pointInClipSpace[1]/pointInClipSpace[3])

        console.log(vec2.str(screen))

        // THEN from screen to world
        const fieldOfView = (45 * Math.PI) / 180 // in radians
        const aspect = canvas.width / canvas.height
        const f = 1.0 / Math.tan(fieldOfView / 2);
        const x = screen[0] / f * aspect
        const y = screen[1] / f
        // console.log(x, y)

        // from world to model
        const l0 = vec4.fromValues(0,0,0,1)
        const l1 = vec4.fromValues(x, y, -1, 1)
        const inv = mat4.invert(mat4.create(), modelViewMatrix)!
        vec4.transformMat4(l0, l0, inv)
        vec4.transformMat4(l1, l1, inv)

        const d = distancePointToLine(pointInModelSpace as vec3, l0 as vec3, l1 as vec3)
        expect(d).to.almost.equal(0)
    })

    it('findVertex()', function() {
        const vertex = new Float32Array([
            2, 5, 7,
            -0.6809099912643433, -2.361138105392456, 3.3671700954437256,
            0, -3, 4
        ])

        const canvas = { width: 1061, height: 878 }
        const projectionMatrix = createProjectionMatrix(canvas)
        const modelViewMatrix = createModelViewMatrix({rotateX: 15, rotateY: 25} as any)
        const m0 = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix)

        for(let idx=0; idx<vertex.length; ) {
            const x = vertex[idx++]
            const y = vertex[idx++]
            const z = vertex[idx++]
            const pointInModelSpace = vec4.fromValues(x, y, z, 1)

            const pointInClipSpace = vec4.transformMat4(vec4.create(), pointInModelSpace, m0)
            const pointInRelativeScreenSpace = vec2.fromValues(pointInClipSpace[0]/pointInClipSpace[3], pointInClipSpace[1]/pointInClipSpace[3])
            const pointInScreenSpace = vec2.fromValues(
                (pointInRelativeScreenSpace[0] * 0.5 + 0.5) * canvas.width,
                (pointInRelativeScreenSpace[1] * -0.5 + 0.5) * canvas.height
            )

            const i = findVertex(pointInScreenSpace, vertex, canvas, modelViewMatrix)
            expect(i).to.equal(idx - 3)
        }
    })
})


// https://nickthecoder.wordpress.com/2013/01/17/unproject-vec3-in-gl-matrix-library/

// https://www.songho.ca/opengl/gl_projectionmatrix.html
//   local/object space (objects coordinate system)

//     model matrix
  
//   world space
  
//     view matrix
  
//   view space (camera's perspective)
  
//     projection matrix
  
//   clip space (x,y,z in [-1, 1])
  
//     viewport transform

/**
 * 
 * ⎧ f/aspect   0                     0   0 ⎫
 * ⎪        0   f                     0   0 ⎪ 
 * ⎪        0   0       (far+near) * nf  -1 ⎪
 * ⎩        0   0   2 * far * near * nf   0 ⎭
 * 
 * @param m 
 * @param fovy 
 * @param aspect 
 * @param near 
 * @param far 
 * @returns 
 */

function perspective(m: mat4, fovy: number, aspect: number, near: number, far: number) {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
 
    m[0] = f / aspect;
    m[1] = 0;
    m[2] = 0;
    m[3] = 0;

    m[4] = 0;
    m[5] = f;
    m[6] = 0;
    m[7] = 0;

    m[8] = 0;
    m[9] = 0;
    m[10] = (far + near) * nf;
    m[11] = -1;

    m[12] = 0;
    m[13] = 0;
    m[14] = 2 * far * near * nf;
    m[15] = 0;

    return m;
  }

  function transformPerspective(v: vec4, fovy: number, aspect: number, near: number, far: number) {
    const f = 1.0 / Math.tan(fovy / 2);
    const x = f/aspect * v[0];
    const y = f * v[1];
    const w = -v[2];
    return vec2.fromValues(x/w, y/w)
  }