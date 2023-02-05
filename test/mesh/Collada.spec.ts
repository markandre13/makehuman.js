import { expect } from '@esm-bundle/chai'
import { Human } from '../../src//Human'
import { HumanMesh } from '../../src/mesh/HumanMesh'
import { WavefrontObj } from '../../src/mesh/WavefrontObj'

import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

import { exportCollada }  from "../../src/mesh/Collada"

describe("Collada", function() {
    
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    it("exportCollada() does not crash", function() {
        const human = Human.getInstance()
        const obj = new WavefrontObj()
        obj.load('data/3dobjs/base.obj.z')
        human.meshData = obj
        const scene = new HumanMesh(human, obj)
        console.log(exportCollada(scene)) // i could parse and check the result?
    })
})