import { expect, use } from '@esm-bundle/chai'
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { loadSkeleton } from '../../src/skeleton/loadSkeleton'
import { Skeleton } from '../../src/skeleton/Skeleton'
import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'
import { MorphManager } from '../../src/modifier/MorphManager'

import { HumanMesh } from '../../src/mesh/HumanMesh'
import { WavefrontObj } from '../../src/mesh/WavefrontObj'

import { makeDefaultBlendshapeToPoseConfig } from "../../src/blendshapes/defaultBlendshapeToPoseConfig"
import { MHFacePoseUnits } from '../../src/blendshapes/MHFacePoseUnits'
import { BlendshapeToPose } from '../../src/blendshapes/BlendshapeToPose'
import { BlendshapeModel } from "../../src/blendshapes/BlendshapeModel"

describe("BlendshapeToPoseConfig", function () {
    let human: MorphManager
    let obj: WavefrontObj
    let humanMesh: HumanMesh
    let skeleton: Skeleton

    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
        human = new MorphManager()
        obj = new WavefrontObj('data/3dobjs/base.obj')
        humanMesh = new HumanMesh(human, obj)
        skeleton = loadSkeleton(humanMesh, "data/rigs/default.mhskel")
    })

    it("makeDefaultBlendshapeToPoseConfig()", function() {
        const blendshapeToPoseConfig = makeDefaultBlendshapeToPoseConfig(skeleton)

        const l = blendshapeToPoseConfig.get("cheekSquintLeft")
        expect(l).to.not.be.undefined
        const lw = l!.poseUnitWeight.get("LeftCheekUp")
        expect(lw).to.equal(1)

        const r = blendshapeToPoseConfig.get("cheekSquintRight")
        expect(r).to.not.be.undefined
        const rw = r!.poseUnitWeight.get("RightCheekUp")
        expect(rw).to.equal(1)

        // blendshape weights from backend (e.g. mediapipe, live link)
        const blendshapeModel = new BlendshapeModel()

        // load makehumans original face pose units
        const faceposeunits = new MHFacePoseUnits(skeleton)

        // load makehuman.js user editable blendshape to pose configuration

        // convert user editable pose configuration to optimized blendshape to pose set
        const blendshape2pose = new BlendshapeToPose()
        blendshapeToPoseConfig.convert(faceposeunits, blendshape2pose)
    })
})
