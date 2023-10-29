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
        
    })
})
