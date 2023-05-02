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
    it("load data/poseunits/face-poseunits.bvh", function () {
        const facePoseUnits = new BiovisionHierarchy('data/poseunits/face-poseunits.bvh')
        expect(facePoseUnits.joints.get("toe4-3.R")?.frames).to.deep.almost.equal([
            3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06, -0.e+00, -0.e+00, 0.e+00,
            3.e-06, 1.e-06, -1.e-06, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            3.e-06, 1.e-06, -1.e-06, -0.e+00, -0.e+00, 0.e+00, 3.e-06, 1.e-06, -1.e-06,
            3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            3.e-06, 1.e-06, -1.e-06, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            3.e-06, 1.e-06, -1.e-06, -0.e+00, -0.e+00, 0.e+00, 3.e-06, 1.e-06, -1.e-06,
            3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06,
            3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06,
            3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06, -0.e+00, -0.e+00, 0.e+00,
            3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06, 3.e-06, 1.e-06, -1.e-06,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00,
            -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00, -0.e+00, -0.e+00, 0.e+00])
        expect(facePoseUnits.bvhJoints.map(j => j.name).join(",")).to.equal("root,spine05,spine04,spine03,spine02,spine01,neck01,neck02,neck03,head,levator02.L,levator03.L,levator04.L,levator05.L,End effector,special01,oris04.R,oris03.R,End effector,oris06,oris05,End effector,oris04.L,oris03.L,End effector,levator02.R,levator03.R,levator04.R,levator05.R,End effector,special03,levator06.R,End effector,levator06.L,End effector,special06.R,special05.R,orbicularis03.R,End effector,orbicularis04.R,End effector,eye.R,End effector,jaw,tongue00,tongue01,tongue02,tongue03,tongue07.L,End effector,tongue07.R,End effector,tongue04,End effector,tongue06.R,End effector,tongue06.L,End effector,tongue05.L,End effector,tongue05.R,End effector,special04,oris02,oris01,End effector,oris06.R,oris07.R,End effector,oris06.L,oris07.L,End effector,temporalis01.L,oculi02.L,oculi01.L,End effector,temporalis01.R,oculi02.R,oculi01.R,End effector,special06.L,special05.L,orbicularis04.L,End effector,orbicularis03.L,End effector,eye.L,End effector,temporalis02.R,risorius02.R,risorius03.R,End effector,temporalis02.L,risorius02.L,risorius03.L,End effector,clavicle.L,shoulder01.L,upperarm01.L,upperarm02.L,lowerarm01.L,lowerarm02.L,wrist.L,metacarpal4.L,finger5-1.L,finger5-2.L,finger5-3.L,End effector,metacarpal1.L,finger2-1.L,finger2-2.L,finger2-3.L,End effector,metacarpal3.L,finger4-1.L,finger4-2.L,finger4-3.L,End effector,metacarpal2.L,finger3-1.L,finger3-2.L,finger3-3.L,End effector,finger1-1.L,finger1-2.L,finger1-3.L,End effector,clavicle.R,shoulder01.R,upperarm01.R,upperarm02.R,lowerarm01.R,lowerarm02.R,wrist.R,metacarpal2.R,finger3-1.R,finger3-2.R,finger3-3.R,End effector,metacarpal3.R,finger4-1.R,finger4-2.R,finger4-3.R,End effector,finger1-1.R,finger1-2.R,finger1-3.R,End effector,metacarpal1.R,finger2-1.R,finger2-2.R,finger2-3.R,End effector,metacarpal4.R,finger5-1.R,finger5-2.R,finger5-3.R,End effector,breast.R,End effector,breast.L,End effector,pelvis.L,upperleg01.L,upperleg02.L,lowerleg01.L,lowerleg02.L,foot.L,toe5-1.L,toe5-2.L,toe5-3.L,End effector,toe4-1.L,toe4-2.L,toe4-3.L,End effector,toe2-1.L,toe2-2.L,toe2-3.L,End effector,toe1-1.L,toe1-2.L,End effector,toe3-1.L,toe3-2.L,toe3-3.L,End effector,pelvis.R,upperleg01.R,upperleg02.R,lowerleg01.R,lowerleg02.R,foot.R,toe4-1.R,toe4-2.R,toe4-3.R,End effector,toe2-1.R,toe2-2.R,toe2-3.R,End effector,toe5-1.R,toe5-2.R,toe5-3.R,End effector,toe1-1.R,toe1-2.R,End effector,toe3-1.R,toe3-2.R,toe3-3.R,End effector")
        expect(facePoseUnits.jointslist.map(j => j.name).join(",")).to.equal("root,spine05,pelvis.L,pelvis.R,spine04,upperleg01.L,upperleg01.R,spine03,upperleg02.L,upperleg02.R,spine02,lowerleg01.L,lowerleg01.R,spine01,breast.R,breast.L,lowerleg02.L,lowerleg02.R,neck01,clavicle.L,clavicle.R,End effector,End effector,foot.L,foot.R,neck02,shoulder01.L,shoulder01.R,toe5-1.L,toe4-1.L,toe2-1.L,toe1-1.L,toe3-1.L,toe4-1.R,toe2-1.R,toe5-1.R,toe1-1.R,toe3-1.R,neck03,upperarm01.L,upperarm01.R,toe5-2.L,toe4-2.L,toe2-2.L,toe1-2.L,toe3-2.L,toe4-2.R,toe2-2.R,toe5-2.R,toe1-2.R,toe3-2.R,head,upperarm02.L,upperarm02.R,toe5-3.L,toe4-3.L,toe2-3.L,End effector,toe3-3.L,toe4-3.R,toe2-3.R,toe5-3.R,End effector,toe3-3.R,levator02.L,special01,levator02.R,special03,special06.R,jaw,temporalis01.L,temporalis01.R,special06.L,temporalis02.R,temporalis02.L,lowerarm01.L,lowerarm01.R,End effector,End effector,End effector,End effector,End effector,End effector,End effector,End effector,levator03.L,oris04.R,oris06,oris04.L,levator03.R,levator06.R,levator06.L,special05.R,tongue00,special04,oculi02.L,oculi02.R,special05.L,risorius02.R,risorius02.L,lowerarm02.L,lowerarm02.R,levator04.L,oris03.R,oris05,oris03.L,levator04.R,End effector,End effector,orbicularis03.R,orbicularis04.R,eye.R,tongue01,oris02,oris06.R,oris06.L,oculi01.L,oculi01.R,orbicularis04.L,orbicularis03.L,eye.L,risorius03.R,risorius03.L,wrist.L,wrist.R,levator05.L,End effector,End effector,End effector,levator05.R,End effector,End effector,End effector,tongue02,tongue05.L,tongue05.R,oris01,oris07.R,oris07.L,End effector,End effector,End effector,End effector,End effector,End effector,End effector,metacarpal4.L,metacarpal1.L,metacarpal3.L,metacarpal2.L,finger1-1.L,metacarpal2.R,metacarpal3.R,finger1-1.R,metacarpal1.R,metacarpal4.R,End effector,End effector,tongue03,tongue06.R,tongue06.L,End effector,End effector,End effector,End effector,End effector,finger5-1.L,finger2-1.L,finger4-1.L,finger3-1.L,finger1-2.L,finger3-1.R,finger4-1.R,finger1-2.R,finger2-1.R,finger5-1.R,tongue07.L,tongue07.R,tongue04,End effector,End effector,finger5-2.L,finger2-2.L,finger4-2.L,finger3-2.L,finger1-3.L,finger3-2.R,finger4-2.R,finger1-3.R,finger2-2.R,finger5-2.R,End effector,End effector,End effector,finger5-3.L,finger2-3.L,finger4-3.L,finger3-3.L,End effector,finger3-3.R,finger4-3.R,End effector,finger2-3.R,finger5-3.R,End effector,End effector,End effector,End effector,End effector,End effector,End effector,End effector")
    })
    it("first entry must be HIERARCHY", function () {
        new BiovisionHierarchy("biohazard.bvh", `HIERARCHY\nROOT root`)
        expect(() => new BiovisionHierarchy("biohazard.bvh", `THE DOCTOR`)).to.throw()
        expect(() => new BiovisionHierarchy("biohazard.bvh", `HIERARCHY VS THE DOCTOR`)).to.throw()
    })
    it("second entry must be ROOT <rootname>", function () {
        const bvh = new BiovisionHierarchy("biohazard.bvh", `HIERARCHY\nROOT enoch`)
        expect(bvh.rootJoint.name).to.equal("enoch")
        expect(() => new BiovisionHierarchy("biohazard.bvh", `HIERARCHY\nROOT`)).to.throw()
        expect(() => new BiovisionHierarchy("biohazard.bvh", `HIERARCHY\nROOT VS SQUARE`)).to.throw()
    })
    it("third entry must be joint data", function () {
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
        // TODO check that calculateFrames has been called for the joints

        const root = bvh.rootJoint
        expect(root.skeleton).to.equal(bvh)
        expect(root.name).to.equal("root")
        expect(root.parent).to.be.undefined
        expect(root.children).to.have.lengthOf(1)
        expect(root.offset).to.deep.equal([0.1, 0.2, 0.3])
        expect(root.position).to.deep.equal([0.1, 0.2, 0.3])
        expect(root.channels).to.deep.equal(["Xrotation", "Yrotation", "Zrotation"])
        expect(root.frames).to.deep.equal([1, 2, 3, 7, 8, 9])

        const child0 = root.children[0]
        expect(child0.skeleton).to.equal(bvh)
        expect(child0.name).to.equal("spine05")
        expect(child0.parent).to.equal(root)
        expect(child0.children).to.have.lengthOf(1)
        expect(child0.offset).to.deep.equal([1.9, 2.8, 3.7])
        expect(child0.position).to.deep.equal([2, 3, 4])
        expect(child0.channels).to.deep.equal(["Xrotation", "Yrotation", "Zrotation"])
        expect(child0.frames).to.deep.equal([4, 5, 6, 10, 11, 12])

        const child1 = child0.children[0]
        expect(child1.skeleton).to.equal(bvh)
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

    describe("BVHJoint.calculateFrames()", function() {
        it.only("foo", () => {
            const bvh = new BiovisionHierarchy("biohazard.bvh", `HIERARCHY
ROOT root
{
    OFFSET 1 2 3
    CHANNELS 6 Xposition Yposition Zposition Xrotation Yrotation Zrotation
    End Site
    {
        OFFSET 4 5 6
    }
}
MOTION
Frames: 2
Frame Time: 0.041667
1 2 3 4 5 6 7 9 10
11 12 13 14 15 16 17 18 19 20`)
            expect(bvh.rootJoint.rotOrder).to.equal("szyx")
        })
    })
})
