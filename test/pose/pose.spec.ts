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
    it("load", function() {
        const poseunits: BodyPoseUnits = JSON.parse(FileSystemAdapter.readFile("data/poseunits/body-poseunits.json"))
        // console.log(JSON.stringify(poseunits))
        for (let poseName of Object.getOwnPropertyNames(poseunits.poses)) {
            console.log(`${poseName}`)
            const pose = poseunits.poses[poseName]
            for (let boneName of Object.getOwnPropertyNames(pose)) {
                const xyzw: number[] = pose[boneName]
                // the expression code uses dual quaternions (quat = rotation, quat2 = rotation & translation)
                const q = quat.fromValues(xyzw[0], xyzw[1], xyzw[2], xyzw[3])
                const t = vec3.create()
                // TODO: get translation from skeleton
                const q2 = quat2.fromRotationTranslation(quat2.create(), q, t)
                console.log(`    ${boneName}: ${q2}`)
            }
        }
    })
})
