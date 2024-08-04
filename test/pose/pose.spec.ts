import { expect, use } from '@esm-bundle/chai'
import { chaiString } from '../chai/chaiString'
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost(0.00001))

import { mat4, vec3, quat, quat2 } from 'gl-matrix'

import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

interface BodyPoseUnits {
    name: string
    poses: any
}

describe("pose", function() {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    //right   left
    //   |     |
    //   24---23
    //   |     |
    //   26   25
    //   |     |
    //   28   27

    it("neutral", function() {
            const hipLeft = vec3.fromValues(0.5,0,0) // 23 left hip
            const hipRight = vec3.fromValues(-0.5,0,0) // 24 right hip
            const hipDirection = vec3.sub(vec3.create(), hipRight, hipLeft)

            // const hipDirection = vec3.fromValues(-1,0, 0) // neutral, front
            // const hipDirection = vec3.fromValues(0,0, 1) // 90 right
            // const hipDirection = vec3.fromValues(0,0,-1) // 90 left
            vec3.normalize(hipDirection, hipDirection)
            const hipRY = Math.atan2(hipDirection[0], -hipDirection[2]) + Math.PI / 2
            const rootPoseGlobal = mat4.fromYRotation(mat4.create(), hipRY)
            // no rotation
            expect(hipRY).to.equal(0)
            // matrix is identity
            expect(mat4.equals(mat4.create(), rootPoseGlobal)).to.be.true
    })

    it("90d right", function() {
        // const hipA = vec3.fromValues(0.5,0,0) // 23 left hip
        // const hipB = vec3.fromValues(-0.5,0,0) // 24 right hip
        // const hipDirection = vec3.sub(vec3.create(), hipB, hipA)

        // const hipDirection = vec3.fromValues(-1,0, 0) // neutral, front
        const hipDirection = vec3.fromValues(0,0, 1) // 90 right
        // const hipDirection = vec3.fromValues(0,0,-1) // 90 left
        vec3.normalize(hipDirection, hipDirection)
        const hipRY = Math.atan2(hipDirection[0], -hipDirection[2]) + Math.PI / 2
        const rootPoseGlobal = mat4.fromYRotation(mat4.create(), hipRY)
        // no rotation
        expect(2 * Math.PI - hipRY).to.equal(Math.PI / 2)
        // matrix is identity
        // expect(mat4.equals(mat4.create(), rootPoseGlobal)).to.be.true
    })

})
