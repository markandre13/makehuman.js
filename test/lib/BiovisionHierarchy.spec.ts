import { expect, use } from "@esm-bundle/chai"
import { chaiString } from "../chai/chaiString"
use(chaiString)
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost())

import { BiovisionHierarchy } from "../../src/lib/BiovisionHierarchy"
import { FileSystemAdapter } from "../../src/filesystem/FileSystemAdapter"
import { HTTPFSAdapter } from "../../src/filesystem/HTTPFSAdapter"
import { mat4, vec3 } from "gl-matrix"
import { Skeleton } from "../../src/skeleton/Skeleton"
import { Bone } from "../../src/skeleton/Bone"
import { Human } from "../../src/modifier/Human"
import { WavefrontObj } from "../../src/mesh/WavefrontObj"
import { HumanMesh } from "../../src/mesh/HumanMesh"
import { loadSkeleton } from "../../src/skeleton/loadSkeleton"

import { anim as run01_anmin, joints as run01_joints } from "../testdata/run01_anim"

describe("class BiovisionHierarchy", function () {
    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })
    it("load data/poseunits/face-poseunits.bvh", function () {
        const facePoseUnits = new BiovisionHierarchy()
        facePoseUnits.fromFile("data/poseunits/face-poseunits.bvh")
        expect(facePoseUnits.joints.get("toe4-3.R")?.frames).to.deep.almost.equal([
            3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6, -0, -0, 0, 3e-6, 1e-6, -1e-6, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0,
            0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0,
            -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, 3e-6, 1e-6, -1e-6, -0, -0, 0, 3e-6,
            1e-6, -1e-6, 3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6, -0, -0, 0, -0, -0, 0, -0, -0, 0, 3e-6,
            1e-6, -1e-6, -0, -0, 0, -0, -0, 0, 3e-6, 1e-6, -1e-6, -0, -0, 0, 3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6, 3e-6,
            1e-6, -1e-6, 3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6,
            3e-6, 1e-6, -1e-6, -0, -0, 0, 3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6, 3e-6, 1e-6, -1e-6, -0, -0, 0, -0, -0, 0,
            -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0, -0, -0, 0,
        ])
        expect(facePoseUnits.bvhJoints.map((j) => j.name).join(",")).to.equal(
            "root,spine05,spine04,spine03,spine02,spine01,neck01,neck02,neck03,head,levator02.L,levator03.L,levator04.L,levator05.L,End effector,special01,oris04.R,oris03.R,End effector,oris06,oris05,End effector,oris04.L,oris03.L,End effector,levator02.R,levator03.R,levator04.R,levator05.R,End effector,special03,levator06.R,End effector,levator06.L,End effector,special06.R,special05.R,orbicularis03.R,End effector,orbicularis04.R,End effector,eye.R,End effector,jaw,tongue00,tongue01,tongue02,tongue03,tongue07.L,End effector,tongue07.R,End effector,tongue04,End effector,tongue06.R,End effector,tongue06.L,End effector,tongue05.L,End effector,tongue05.R,End effector,special04,oris02,oris01,End effector,oris06.R,oris07.R,End effector,oris06.L,oris07.L,End effector,temporalis01.L,oculi02.L,oculi01.L,End effector,temporalis01.R,oculi02.R,oculi01.R,End effector,special06.L,special05.L,orbicularis04.L,End effector,orbicularis03.L,End effector,eye.L,End effector,temporalis02.R,risorius02.R,risorius03.R,End effector,temporalis02.L,risorius02.L,risorius03.L,End effector,clavicle.L,shoulder01.L,upperarm01.L,upperarm02.L,lowerarm01.L,lowerarm02.L,wrist.L,metacarpal4.L,finger5-1.L,finger5-2.L,finger5-3.L,End effector,metacarpal1.L,finger2-1.L,finger2-2.L,finger2-3.L,End effector,metacarpal3.L,finger4-1.L,finger4-2.L,finger4-3.L,End effector,metacarpal2.L,finger3-1.L,finger3-2.L,finger3-3.L,End effector,finger1-1.L,finger1-2.L,finger1-3.L,End effector,clavicle.R,shoulder01.R,upperarm01.R,upperarm02.R,lowerarm01.R,lowerarm02.R,wrist.R,metacarpal2.R,finger3-1.R,finger3-2.R,finger3-3.R,End effector,metacarpal3.R,finger4-1.R,finger4-2.R,finger4-3.R,End effector,finger1-1.R,finger1-2.R,finger1-3.R,End effector,metacarpal1.R,finger2-1.R,finger2-2.R,finger2-3.R,End effector,metacarpal4.R,finger5-1.R,finger5-2.R,finger5-3.R,End effector,breast.R,End effector,breast.L,End effector,pelvis.L,upperleg01.L,upperleg02.L,lowerleg01.L,lowerleg02.L,foot.L,toe5-1.L,toe5-2.L,toe5-3.L,End effector,toe4-1.L,toe4-2.L,toe4-3.L,End effector,toe2-1.L,toe2-2.L,toe2-3.L,End effector,toe1-1.L,toe1-2.L,End effector,toe3-1.L,toe3-2.L,toe3-3.L,End effector,pelvis.R,upperleg01.R,upperleg02.R,lowerleg01.R,lowerleg02.R,foot.R,toe4-1.R,toe4-2.R,toe4-3.R,End effector,toe2-1.R,toe2-2.R,toe2-3.R,End effector,toe5-1.R,toe5-2.R,toe5-3.R,End effector,toe1-1.R,toe1-2.R,End effector,toe3-1.R,toe3-2.R,toe3-3.R,End effector"
        )
        expect(facePoseUnits.jointslist.map((j) => j.name).join(",")).to.equal(
            "root,spine05,pelvis.L,pelvis.R,spine04,upperleg01.L,upperleg01.R,spine03,upperleg02.L,upperleg02.R,spine02,lowerleg01.L,lowerleg01.R,spine01,breast.R,breast.L,lowerleg02.L,lowerleg02.R,neck01,clavicle.L,clavicle.R,End effector,End effector,foot.L,foot.R,neck02,shoulder01.L,shoulder01.R,toe5-1.L,toe4-1.L,toe2-1.L,toe1-1.L,toe3-1.L,toe4-1.R,toe2-1.R,toe5-1.R,toe1-1.R,toe3-1.R,neck03,upperarm01.L,upperarm01.R,toe5-2.L,toe4-2.L,toe2-2.L,toe1-2.L,toe3-2.L,toe4-2.R,toe2-2.R,toe5-2.R,toe1-2.R,toe3-2.R,head,upperarm02.L,upperarm02.R,toe5-3.L,toe4-3.L,toe2-3.L,End effector,toe3-3.L,toe4-3.R,toe2-3.R,toe5-3.R,End effector,toe3-3.R,levator02.L,special01,levator02.R,special03,special06.R,jaw,temporalis01.L,temporalis01.R,special06.L,temporalis02.R,temporalis02.L,lowerarm01.L,lowerarm01.R,End effector,End effector,End effector,End effector,End effector,End effector,End effector,End effector,levator03.L,oris04.R,oris06,oris04.L,levator03.R,levator06.R,levator06.L,special05.R,tongue00,special04,oculi02.L,oculi02.R,special05.L,risorius02.R,risorius02.L,lowerarm02.L,lowerarm02.R,levator04.L,oris03.R,oris05,oris03.L,levator04.R,End effector,End effector,orbicularis03.R,orbicularis04.R,eye.R,tongue01,oris02,oris06.R,oris06.L,oculi01.L,oculi01.R,orbicularis04.L,orbicularis03.L,eye.L,risorius03.R,risorius03.L,wrist.L,wrist.R,levator05.L,End effector,End effector,End effector,levator05.R,End effector,End effector,End effector,tongue02,tongue05.L,tongue05.R,oris01,oris07.R,oris07.L,End effector,End effector,End effector,End effector,End effector,End effector,End effector,metacarpal4.L,metacarpal1.L,metacarpal3.L,metacarpal2.L,finger1-1.L,metacarpal2.R,metacarpal3.R,finger1-1.R,metacarpal1.R,metacarpal4.R,End effector,End effector,tongue03,tongue06.R,tongue06.L,End effector,End effector,End effector,End effector,End effector,finger5-1.L,finger2-1.L,finger4-1.L,finger3-1.L,finger1-2.L,finger3-1.R,finger4-1.R,finger1-2.R,finger2-1.R,finger5-1.R,tongue07.L,tongue07.R,tongue04,End effector,End effector,finger5-2.L,finger2-2.L,finger4-2.L,finger3-2.L,finger1-3.L,finger3-2.R,finger4-2.R,finger1-3.R,finger2-2.R,finger5-2.R,End effector,End effector,End effector,finger5-3.L,finger2-3.L,finger4-3.L,finger3-3.L,End effector,finger3-3.R,finger4-3.R,End effector,finger2-3.R,finger5-3.R,End effector,End effector,End effector,End effector,End effector,End effector,End effector,End effector"
        )
    })
    it("first entry must be HIERARCHY", function () {
        // new BiovisionHierarchy("biohazard.bvh", "none", `HIERARCHY\nROOT root`)
        expect(() => new BiovisionHierarchy().fromFile("biohazard.bvh", "auto", "none", `THE DOCTOR`)).to.throw()
        expect(() =>
            new BiovisionHierarchy().fromFile("biohazard.bvh", "auto", "none", `HIERARCHY VS THE DOCTOR`)
        ).to.throw()
    })
    it("second entry must be ROOT <rootname>", function () {
        // const bvh = new BiovisionHierarchy("biohazard.bvh", "none", `HIERARCHY\nROOT enoch`)
        // expect(bvh.rootJoint.name).to.equal("enoch")
        expect(() => new BiovisionHierarchy().fromFile("biohazard.bvh", "auto", "none", `HIERARCHY\nROOT`)).to.throw()
        expect(() =>
            new BiovisionHierarchy().fromFile("biohazard.bvh", "auto", "none", `HIERARCHY\nROOT VS SQUARE`)
        ).to.throw()
    })
    it("third entry must be joint data", function () {
        const bvh = new BiovisionHierarchy().fromFile(
            "biohazard.bvh",
            "auto",
            "none",
            `HIERARCHY
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
`
        )
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

        expect(() =>
            new BiovisionHierarchy().fromFile("biohazard.bvh", "auto", "none", `HIERARCHY\nROOT root\nNOPE`)
        ).to.throw()
    })

    it("createAnimationTrack(skel, name)", function () {
        const bvh = new BiovisionHierarchy().fromFile(
            "biohazard.bvh",
            "auto",
            "none",
            `HIERARCHY
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
`
        )
        const skeleton = {
            getBones: function (): Bone[] {
                return [
                    { name: "root", reference_bones: [] },
                    { name: "spine05", reference_bones: [] },
                ] as Bone[]
            },
        } as Skeleton

        const track = bvh.createAnimationTrack(skeleton, "Expression-Face-PoseUnits")

        expect(track.length).to.equal(4)
        // prettier-ignore
        const m0 = mat4.fromValues(
            0.9980212, -0.05230408, 0.0348995, 0.,
            0.05293623, 0.9984456, -0.01744178, 0.,
            -0.03393297, 0.01925471, 0.9992386, 0.,
            0, 0, 0, 1
        )
        mat4.transpose(m0, m0)
        expect(track[0]).deep.almost.equal(m0)
        // prettier-ignore
        const m1 = mat4.fromValues(
            0.99073744, -0.1041307, 0.08715574, 0.,
            0.11032021, 0.9914638, -0.06949103, 0.,
            -0.07917561, 0.07846241, 0.99376804, 0.,
            0, 0, 0, 1
        )
        mat4.transpose(m1, m1)
        expect(track[1]).deep.almost.equal(m1)

        // prettier-ignore
        const m2 = mat4.fromValues(
            0.9780762, -0.15491205, 0.1391731, 0.,
            0.17202055, 0.977673, -0.12068332, 0.,
            -0.11737048, 0.14197811, 0.98288673, 0.,
            0, 0, 0, 1)
        mat4.transpose(m2, m2)
        expect(track[2]).deep.almost.equal(m2)
        // prettier-ignore
        const m3 = mat4.fromValues(
            0.9601763, -0.20409177, 0.190809, 0.,
            0.23716263, 0.9563985, -0.17045777, 0.,
            -0.1477004, 0.20892227, 0.9667141, 0.,
            0, 0, 0, 1)
        mat4.transpose(m3, m3)
        expect(track[3]).deep.almost.equal(m3)
    })

    it("BVHJoint.calculateFrames()", function () {
        const bvh = new BiovisionHierarchy().fromFile(
            "biohazard.bvh",
            "auto",
            "none",
            `HIERARCHY
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
11 12 13 14 15 16 17 18 19 20`
        )
        expect(bvh.rootJoint.rotOrder).to.equal("szyx")
        // prettier-ignore
        const m0 = mat4.fromValues(
            0.99073744, -0.1041307, 0.08715574, 0.,
            0.11032021, 0.9914638, -0.06949103, 0.,
            -0.07917561, 0.07846241, 0.99376804, 0.,
            0, 0, 0, 1
        )
        mat4.transpose(m0, m0)
        // prettier-ignore
        const m1 = mat4.fromValues(
            0.9285075, -0.26624525, 0.25881904, 0.,
            0.32763818, 0.9154494, -0.23367861, 0.,
            -0.17471991, 0.30177134, 0.9372337, 0.,
            0, 0, 0, 1
        )
        mat4.transpose(m1, m1)
        expect(bvh.rootJoint.matrixPoses[0]).to.deep.almost.equal(m0)
        expect(bvh.rootJoint.matrixPoses[1]).to.deep.almost.equal(m1)
    })

    it("load pose", function () {
        const bvh = new BiovisionHierarchy().fromFile("data/poses/run01.bvh", "auto")

        // check that all joints at frame 0 have the correct pose matrix
        let index = 0
        bvh.jointslist.forEach((joint) => {
            if (joint.name !== "End effector") {
                expect(joint.name).to.equal(run01_joints[index].joint)
                expect(mat2mat(joint.matrixPoses[0])).to.deep.almost.equal(run01_joints[index].pose)
                ++index
            }
        })

        // check createAnimationTrack()
        const human = new Human()
        const obj = new WavefrontObj("data/3dobjs/base.obj")
        const scene = new HumanMesh(human, obj)
        const skel = loadSkeleton(scene, "data/rigs/default.mhskel")
        const anim = bvh.createAnimationTrack(skel)
        for (let i = 0; i < anim.length; ++i) {
            const m0 = anim[i]
            let m1: mat4
            const j = i * 12
            // prettier-ignore
            m1 = mat4.fromValues(
                run01_anmin[j + 0], run01_anmin[j + 4], run01_anmin[j + 8], 0,
                run01_anmin[j + 1], run01_anmin[j + 5], run01_anmin[j + 9], 0,
                run01_anmin[j + 2], run01_anmin[j + 6], run01_anmin[j + 10], 0, 
                run01_anmin[j + 3], run01_anmin[j + 7], run01_anmin[j + 11], 1
            )
            expect(m0, `matrix ${i}`).to.deep.almost.equal(m1)
        }
    })

    it.only("fromSkeleton", function () {
        const human = new Human()
        const obj = new WavefrontObj("data/3dobjs/base.obj")
        const scene = new HumanMesh(human, obj)
        const skeleton = loadSkeleton(scene, "data/rigs/default.mhskel")

        const bvh = new BiovisionHierarchy()

        bvh.fromSkeleton(skeleton)

        expect(bvh.bvhJoints.length).to.equal(241)

        expect(bvh.bvhJoints[0].name).to.equal("root")
        // prettier-ignore
        expect(bvh.bvhJoints[0].channels).to.deep.equal(["Xposition", "Yposition", "Zposition", "Zrotation", "Xrotation", "Yrotation"])
        expect(bvh.bvhJoints[0].frames).to.deep.almost.equal([0, 0, 0, 0, 0, 0])
        expect(bvh.bvhJoints[0].position).to.deep.almost.equal([0, 0.5639, -0.7609])
        expect(bvh.bvhJoints[0].offset).to.deep.almost.equal([0, 0.5639, -0.7609])

        expect(bvh.bvhJoints[1].name).to.equal("spine05")
        expect(bvh.bvhJoints[1].channels).to.deep.equal(["Zrotation", "Xrotation", "Yrotation"])
        expect(bvh.bvhJoints[1].frames).to.deep.almost.equal([0, 0, 0])
        expect(bvh.bvhJoints[1].position).to.deep.almost.equal([0, 0.72685003, 0.14450002])
        expect(bvh.bvhJoints[1].offset).to.deep.almost.equal([0, 0.16295004, 0.90540004])

        expect(bvh.bvhJoints[6].name).to.equal("End effector")
        expect(bvh.bvhJoints[6].channels).to.deep.equal([])
        expect(bvh.bvhJoints[6].frames).to.deep.almost.equal([])
        expect(bvh.bvhJoints[6].position).to.deep.almost.equal([0.7943, 3.8213, 1.5846])
        expect(bvh.bvhJoints[6].offset).to.deep.almost.equal([0.7943, -0.50724936, 1.6558499])

        expect(bvh.bvhJoints[10].name).to.equal("__clavicle.L")
        expect(bvh.bvhJoints[10].position).to.deep.almost.equal([0, 5.8902493, 0.06805])
        expect(bvh.bvhJoints[10].offset).to.deep.almost.equal([0, 1.5616999, 0.13929999])

        expect(bvh.bvhJoints[11].name).to.equal("clavicle.L")
        expect(bvh.bvhJoints[11].position).to.deep.almost.equal([0.26555, 5.19135, 0.6942501])
        expect(bvh.bvhJoints[11].offset).to.deep.almost.equal([0.26555, -0.69889927, 0.6262001])

        // bvh.bvhJoints.forEach( (it, idx) => console.log(`${idx} ${it.name}`))
    })

    // it("write", function() {
    //     //
    //     // shared/bvh.py:
    //     //    fromSkeleton(skel: Skeleton, animationTrack: mat4[] | undefined, dummyJoints=true)
    //     //    writeToFile(filename)
    //     // this should be able to write a previously read file
    //     // it get's the data from bvh.animationTrack
    // })

    it.skip("xxx", function () {
        const COMPARE_BONE = "upperleg02.L"

        const bvh_file = new BiovisionHierarchy().fromFile("data/poses/run01.bvh", "auto")

        const human = new Human()
        const obj = new WavefrontObj("data/3dobjs/base.obj")
        const scene = new HumanMesh(human, obj)
        const skel = loadSkeleton(scene, "data/rigs/default.mhskel")
        scene.skeleton = skel
        const anim = bvh_file.createAnimationTrack(skel)

        let bvh_root_translation: vec3
        if (bvh_file.joints.has("root")) {
            const root_bone = anim[0]
            bvh_root_translation = vec3.fromValues(root_bone[12], root_bone[13], root_bone[14])
        } else {
            bvh_root_translation = vec3.create()
        }

        function calculateBvhBoneLength(bvh_file: BiovisionHierarchy) {
            const bvh_joint = bvh_file.joints.get(COMPARE_BONE)
            const j0 = bvh_joint!.children[0].position
            const j1 = bvh_joint!.position
            const v0 = vec3.fromValues(j0[0], j0[1], j0[2])
            const v1 = vec3.fromValues(j1[0], j1[1], j1[2])
            const joint_length = vec3.len(vec3.sub(v0, v0, v1))
            console.log(`joint_length = ${joint_length}`)
            return joint_length
        }
        const bvh_bone_length = calculateBvhBoneLength(bvh_file)
        expect(bvh_bone_length).to.almost.equal(3.228637218475342)

        /**
         * Auto scale BVH translations by comparing upper leg length to make the
         * human stand on the ground plane, independent of body length.
         */
        function autoScaleAnim() {
            const bone = scene.skeleton.getBone(COMPARE_BONE)
            console.log(`bone.length=${bone.length}, bvh_bone_length=${bvh_bone_length}`)
            expect(bone.length).to.almost.equal(3.415726664182774)
            const scale_factor = bone.length / bvh_bone_length
            expect(scale_factor).to.almost.equal(1.0579468775980292)
            const trans = vec3.scale(vec3.create(), bvh_root_translation, scale_factor)
            console.log(`Scaling animation with factor ${scale_factor}`)
            // It's possible to use anim.scale() as well, but by repeated scaling we accumulate error
            // It's easier to simply set the translation, as poses only have a translation on
            // root joint

            // Set pose root bone translation
            // root_bone_idx = 0
            // posedata = anim.getAtFramePos(0, noBake=True)
            // posedata[root_bone_idx, :3, 3] = trans
            // anim.resetBaked()
        }
        autoScaleAnim()
    })
})

// print mat4 in the order used in python
function mat2txt(m: mat4) {
    const map = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15]
    let out = ""
    for (let i = 0; i < 16; ++i) {
        const x = m[map[i]]
        out += `${x} `
        if (i % 4 === 3) {
            out += "\n"
        }
    }
    return out.trimEnd()
}

function mat2mat(m: mat4) {
    const map = [0, 4, 8, 12, 1, 5, 9, 13, 2, 6, 10, 14, 3, 7, 11, 15]
    const out: number[] = new Array(12)
    for (let i = 0; i < 12; ++i) {
        out[i] = m[map[i]]
    }
    return out
}
