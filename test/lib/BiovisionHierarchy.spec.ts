import { expect, use } from '@esm-bundle/chai'
import { chaiString } from "../chai/chaiString"
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { BiovisionHierarchy } from '../../src/lib/BiovisionHierarchy'
import { FileSystemAdapter } from '../../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../../src/filesystem/HTTPFSAdapter'

describe("class BiovisionHierarchy", function () {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
    it("first entry must be HIERARCHY", function () {
        new BiovisionHierarchy("biohazard.bvh", `HIERARCHY`)
        expect(() => new BiovisionHierarchy("biohazard.bvh", `THE DOCTOR`)).to.throw()
        expect(() => new BiovisionHierarchy("biohazard.bvh", `HIERARCHY VS THE DOCTOR`)).to.throw()
    })
    it("second entry must be ROOT <rootname>", function () {
        const bvh = new BiovisionHierarchy("biohazard.bvh", `HIERARCHY\nROOT enoch`)
        expect(bvh.rootJoint.name).to.equal("enoch")
        expect(() => new BiovisionHierarchy("biohazard.bvh", `HIERARCHY\nROOT`)).to.throw()
        expect(() => new BiovisionHierarchy("biohazard.bvh", `HIERARCHY\nROOT VS SQUARE`)).to.throw()
    })
    it.only("third entry must be joint data", function () {
        const bvh = new BiovisionHierarchy("biohazard.bvh", `HIERARCHY
ROOT root
{
    OFFSET 0.1 0.2 0.3
    CHANNELS 3 Xrotation Yrotation Zrotation
    JOINT spine05
    {
        OFFSET 1.9 2.8 3.7
        CHANNELS 3 Xrotation Yrotation Zrotation
        End Site
        {
            OFFSET 11 12 13
        }
    }
}
MOTION
Frames: 2
Frame Time: 0.041667
1 2 3 4 5 6
7 8 9 10 11 12
`)
        // SKELETON
        const root = bvh.rootJoint
        expect(root.name).to.equal("root")
        expect(root.parent).to.be.undefined
        expect(root.children).to.have.lengthOf(1)
        expect(root.offset).to.deep.equal([0.1, 0.2, 0.3])
        expect(root.position).to.deep.equal([0.1, 0.2, 0.3])
        expect(root.channels).to.deep.equal(["Xrotation", "Yrotation", "Zrotation"])
        expect(root.frames).to.deep.equal([1, 2, 3, 7, 8, 9])

        const child0 = root.children[0]
        expect(child0.name).to.equal("spine05")
        expect(child0.parent).to.equal(root)
        expect(child0.children).to.have.lengthOf(1)
        expect(child0.offset).to.deep.equal([1.9, 2.8, 3.7])
        expect(child0.position).to.deep.equal([2, 3, 4])
        expect(child0.channels).to.deep.equal(["Xrotation", "Yrotation", "Zrotation"])
        expect(child0.frames).to.deep.equal([4,  5,  6, 10, 11, 12])

        const child1 = child0.children[0]
        expect(child1.name).to.equal("End effector")
        expect(child1.parent).to.equal(child0)
        expect(child1.children).to.have.lengthOf(0)
        expect(child1.offset).to.deep.equal([11, 12, 13])
        expect(child1.position).to.deep.equal([13, 15, 17])
        expect(child1.channels).to.deep.equal([])
        expect(child1.frames).to.deep.equal([])

        expect(bvh.bvhJoints).to.deep.equal([root, child0, child1])

        expect(bvh.joints.size).to.equal(2)
        expect(bvh.joints.get(root.name)).to.equal(root)
        expect(bvh.joints.get(child0.name)).to.equal(child0)

        // MOTION
        expect(bvh.frameCount).to.equal(2)
        expect(bvh.frameTime).to.equal(0.041667)

        expect(() => new BiovisionHierarchy("biohazard.bvh", `HIERARCHY\nROOT root\nNOPE`)).to.throw()
    })
})
