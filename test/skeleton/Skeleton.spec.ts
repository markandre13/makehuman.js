import { expect, use } from "chai"
import { chaiAlmost } from "../chai/chaiAlmost"
use(chaiAlmost(0.01))

import { loadSkeleton } from "../../src/skeleton/loadSkeleton"
import { Skeleton } from "../../src/skeleton/Skeleton"
import { FileSystemAdapter } from "../../src/filesystem/FileSystemAdapter"
import { HTTPFSAdapter } from "../../src/filesystem/HTTPFSAdapter"
import { MorphManager } from "../../src/modifier/MorphManager"

import { mat4, vec4 } from "gl-matrix"
import { deg2rad, rad2deg } from "../../src/lib/calculateNormals"
import { HumanMesh } from "../../src/mesh/HumanMesh"
import { WavefrontObj } from "../../src/mesh/WavefrontObj"
import { euler2matrix, matrix2euler } from "gl/algorithms/euler"

describe("Skeleton", function () {
    let human: MorphManager
    let obj: WavefrontObj
    let humanMesh: HumanMesh
    let skeleton: Skeleton

    this.beforeAll(function () {
        console.log("load skeleton")
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
        human = new MorphManager()
        obj = new WavefrontObj("data/3dobjs/base.obj")
        humanMesh = new HumanMesh(human, obj)
        skeleton = loadSkeleton(humanMesh, "data/rigs/default.mhskel")
        const node = skeleton.poseNodes.find("toe5-1.R")!
        node.x.value = 15
        node.y.value = 10
        node.z.value = 5
        console.log("loaded skeleton...")
    })

    this.beforeEach(function() {
        skeleton.boneslist!.forEach(bone => {
            bone.matUserPoseRelative = mat4.create()
            bone.matUserPoseGlobal = undefined
        })
    })

    function str(m: mat4): string {
        const a = matrix2euler(m)
        return `${rad2deg(a.x).toFixed(2)}, ${rad2deg(a.y).toFixed(2)}, ${rad2deg(a.z).toFixed(2)}`
    }

    function xyz(m: mat4): number[] {
        const a = matrix2euler(m)
        return [rad2deg(a.x), rad2deg(a.y), rad2deg(a.z)]
    }

    it("set matUserPoseRelative and update", function () {

        const b0 = skeleton.getBone("root")
        const b1 = skeleton.getBone("spine05")
        const b2 = skeleton.getBone("spine04")

        skeleton.update()

        expect(xyz(b0.matPoseGlobal!)).to.deep.almost.equal([79.8, 0, 0])
        expect(xyz(b1.matPoseGlobal!)).to.deep.almost.equal([-27.63, 0, 0])
        expect(xyz(b2.matPoseGlobal!)).to.deep.almost.equal([19.80, 0, 0])

        // WHEN the skeleton is rotated 10 deg at 'root' around the x-axis
        b0.matUserPoseRelative = euler2matrix(deg2rad(10), 0, 0)
        skeleton.update()

        // console.log(`${b0.name}: global ${str(b0.matRestGlobal!)}. relative: ${str(b0.matRestRelative!)}, rest Global: ${str(b0.matPoseGlobal!)}`)
        // console.log(`${b1.name}: global ${str(b1.matRestGlobal!)}. relative: ${str(b1.matRestRelative!)}, rest Global: ${str(b1.matPoseGlobal!)}`)
        // console.log(`${b2.name}: global ${str(b2.matRestGlobal!)}. relative: ${str(b2.matRestRelative!)}, rest Global: ${str(b2.matPoseGlobal!)}`)

        // THEN the bones connected to it are also rotated by 10 deg
        expect(xyz(b0.matPoseGlobal!)).to.deep.almost.equal([89.8, 0, 0])
        expect(xyz(b1.matPoseGlobal!)).to.deep.almost.equal([-17.63, 0, 0])
        expect(xyz(b2.matPoseGlobal!)).to.deep.almost.equal([29.80, 0, 0])
    })

    it("set matUserPoseGlobal and update", function() {

        const b0 = skeleton.getBone("clavicle.L")
        const b1 = skeleton.getBone("shoulder01.L")
        const b2 = skeleton.getBone("upperarm01.L")
        const b3 = skeleton.getBone("upperarm02.L")
        const b4 = skeleton.getBone("lowerarm01.L")

        skeleton.update()

        expect(xyz(b0.matPoseGlobal!)).to.deep.almost.equal([-10.89, 5.57, -71.23])
        expect(xyz(b1.matPoseGlobal!)).to.deep.almost.equal([-32.63, 3.51, -121.51])
        expect(xyz(b2.matPoseGlobal!)).to.deep.almost.equal([-2.03, -8.28, -141.25])
        expect(xyz(b3.matPoseGlobal!)).to.deep.almost.equal([0.26, -8.24, -139.95])
        expect(xyz(b4.matPoseGlobal!)).to.deep.almost.equal([46.49, -8.24, -139.95])

        b2.matUserPoseGlobal = euler2matrix(deg2rad(10), deg2rad(20), deg2rad(30)) 
        skeleton.update()

        expect(xyz(b0.matPoseGlobal!)).to.deep.almost.equal([-10.89, 5.57, -71.23])
        expect(xyz(b1.matPoseGlobal!)).to.deep.almost.equal([-32.63, 3.51, -121.51])
        expect(xyz(b2.matPoseGlobal!)).to.deep.almost.equal([10, 20, 30]) // this is perfect
        expect(xyz(b3.matPoseGlobal!)).to.deep.almost.equal([10 + 2.94, 20 - 0.23, 30 + 1.35]) // there's some drift in here...
        expect(xyz(b4.matPoseGlobal!)).to.deep.almost.equal([10 + 49.17, 20 - 0.23, 30 + 1.35])

        b4.matUserPoseGlobal = euler2matrix(deg2rad(35), deg2rad(25), deg2rad(15))
        skeleton.update()

        // console.log(`${b0.name}: global: ${str(b0.matRestGlobal!)}. relative: ${str(b0.matRestRelative!)}, pose global: ${str(b0.matPoseGlobal!)}`)
        // console.log(`${b1.name}: global: ${str(b1.matRestGlobal!)}. relative: ${str(b1.matRestRelative!)}, pose global: ${str(b1.matPoseGlobal!)}`)
        // console.log(`${b2.name}: global: ${str(b2.matRestGlobal!)}. relative: ${str(b2.matRestRelative!)}, pose global: ${str(b2.matPoseGlobal!)}`)
        // console.log(`${b3.name}: global: ${str(b3.matRestGlobal!)}. relative: ${str(b2.matRestRelative!)}, pose global: ${str(b3.matPoseGlobal!)}`)
        // console.log(`${b4.name}: global: ${str(b4.matRestGlobal!)}. relative: ${str(b4.matRestRelative!)}, pose global: ${str(b4.matPoseGlobal!)}`)

        expect(xyz(b0.matPoseGlobal!)).to.deep.almost.equal([-10.89, 5.57, -71.23])
        expect(xyz(b1.matPoseGlobal!)).to.deep.almost.equal([-32.63, 3.51, -121.51])
        expect(xyz(b2.matPoseGlobal!)).to.deep.almost.equal([10, 20, 30]) // this is perfect
        expect(xyz(b3.matPoseGlobal!)).to.deep.almost.equal([10 + 2.94, 20 - 0.23, 30 + 1.35]) // there's some drift in here...
        expect(xyz(b4.matPoseGlobal!)).to.deep.almost.equal([35, 25, 15])
    })

    it("loaded default.mhskel matches python implementation", function () {
        expect(skeleton.roots).has.lengthOf(1)

        const rootBone = skeleton.roots[0]
        expect(rootBone.name).equal("root")

        // headPos and tailPost as in makehuman
        expect(rootBone.headPos).to.deep.almost.equal([0, 0.5639, -0.7609])
        expect(rootBone.tailPos).to.deep.almost.equal([0, 0.72685, 0.1445])

        // Bone.build() calculates length, yvector4, matRestGlobal, ...
        expect(rootBone.roll).to.equal("root____plane")
        expect(rootBone.length).to.almost.equal(0.9199466816932041)
        expect(rootBone.yvector4).to.deep.almost.equal(vec4.fromValues(0, 0.9199466816932041, 0, 1))
        // prettier-ignore
        expect(rootBone.matRestGlobal).to.deep.almost.equal(mat4.fromValues(
            1, 0, 0, 0,
            0, 0.1771298050880432, 0.9841874837875366, 0,
            0, -0.9841874837875366, 0.1771298050880432, 0,
            0, 0.5638999938964844, -0.7609000205993652, 1
        ))

        // matRestRelative
        // for the root bone matRestGlobal equals matRestRelative
        // prettier-ignore
        expect(rootBone.matRestRelative).to.deep.almost.equal(mat4.fromValues(
            // pre
            1, 0, 0, 0,
            0, 0.1771298050880432, 0.9841874837875366, 0,
            0, -0.9841874837875366, 0.1771298050880432, 0,
            0, 0.5638999938964844, -0.7609000205993652, 1
        ))

        const spineBone = rootBone.children.find((bone) => bone.name === "spine05")!
        // prettier-ignore
        expect(spineBone.matRestRelative).to.deep.almost.equal(mat4.fromValues(
            1, 0, 0, 0,
            0, -0.29943329095840454, -0.9541172385215759, 0,
            0, 0.9541172385215759, -0.29943329095840454, 0,
            0, 0.9199466705322266, 0, 1
        ))

        // further:
        // restPoseMatrix
        expect(skeleton.vertexWeights?.info.name).to.equal("MakeHuman weights")
        expect(skeleton.vertexWeights?.info.description).to.equal("Weights for default makehuman mesh")
        expect(skeleton.vertexWeights?.info.version).to.equal(110)
        expect(skeleton.vertexWeights?.info.license).to.equal("CC0")
        expect(skeleton.vertexWeights?.info.copyright).to.equal(
            "(c) 2020 Data Collection AB, Joel Palmius, Jonas Hauquier"
        )

        expect(skeleton.vertexWeights?._vertexCount).to.equal(19158)
        // console.log(">>>>>>>>>>>>>>>")
        expect(skeleton.vertexWeights?._data.size).to.equal(139)
        const spine05 = skeleton.vertexWeights?._data.get("spine05")!
        expect(spine05).lengthOf(2)
        // expect(spine05[0]).lengthOf(2058)
        // expect(spine05[1]).lengthOf(2058)
        // console.log(spine05.length)
        // console.log(spine05[0].length)
        // console.log(spine05[1].length)

        // console.log(spine05[0][0])
        // console.log(spine05[1][0])
        // console.log(spine05[0][1])
        // console.log(spine05[1][1])

        // weights
        //   "name": [{idx,weight}, ...

        // * normalize weights
        // * set _vertexCount
    })

    it("getJointNames() matches python implementation", function () {
        const out = [
            "root",
            "spine05",
            "spine04",
            "spine03",
            "spine02",
            "breast.L",
            "breast.R",
            "spine01",
            "clavicle.L",
            "shoulder01.L",
            "upperarm01.L",
            "upperarm02.L",
            "lowerarm01.L",
            "lowerarm02.L",
            "wrist.L",
            "finger1-1.L",
            "finger1-2.L",
            "finger1-3.L",
            "metacarpal1.L",
            "finger2-1.L",
            "finger2-2.L",
            "finger2-3.L",
            "metacarpal2.L",
            "finger3-1.L",
            "finger3-2.L",
            "finger3-3.L",
            "metacarpal3.L",
            "finger4-1.L",
            "finger4-2.L",
            "finger4-3.L",
            "metacarpal4.L",
            "finger5-1.L",
            "finger5-2.L",
            "finger5-3.L",
            "clavicle.R",
            "shoulder01.R",
            "upperarm01.R",
            "upperarm02.R",
            "lowerarm01.R",
            "lowerarm02.R",
            "wrist.R",
            "finger1-1.R",
            "finger1-2.R",
            "finger1-3.R",
            "metacarpal1.R",
            "finger2-1.R",
            "finger2-2.R",
            "finger2-3.R",
            "metacarpal2.R",
            "finger3-1.R",
            "finger3-2.R",
            "finger3-3.R",
            "metacarpal3.R",
            "finger4-1.R",
            "finger4-2.R",
            "finger4-3.R",
            "metacarpal4.R",
            "finger5-1.R",
            "finger5-2.R",
            "finger5-3.R",
            "neck01",
            "neck02",
            "neck03",
            "head",
            "jaw",
            "special04",
            "oris02",
            "oris01",
            "oris06.L",
            "oris07.L",
            "oris06.R",
            "oris07.R",
            "tongue00",
            "tongue01",
            "tongue02",
            "tongue03",
            "tongue04",
            "tongue07.L",
            "tongue07.R",
            "tongue06.L",
            "tongue06.R",
            "tongue05.L",
            "tongue05.R",
            "levator02.L",
            "levator03.L",
            "levator04.L",
            "levator05.L",
            "levator02.R",
            "levator03.R",
            "levator04.R",
            "levator05.R",
            "special01",
            "oris04.L",
            "oris03.L",
            "oris04.R",
            "oris03.R",
            "oris06",
            "oris05",
            "special03",
            "levator06.L",
            "levator06.R",
            "special06.L",
            "special05.L",
            "eye.L",
            "orbicularis03.L",
            "orbicularis04.L",
            "special06.R",
            "special05.R",
            "eye.R",
            "orbicularis03.R",
            "orbicularis04.R",
            "temporalis01.L",
            "oculi02.L",
            "oculi01.L",
            "temporalis01.R",
            "oculi02.R",
            "oculi01.R",
            "temporalis02.L",
            "risorius02.L",
            "risorius03.L",
            "temporalis02.R",
            "risorius02.R",
            "risorius03.R",
            "pelvis.L",
            "upperleg01.L",
            "upperleg02.L",
            "lowerleg01.L",
            "lowerleg02.L",
            "foot.L",
            "toe1-1.L",
            "toe1-2.L",
            "toe2-1.L",
            "toe2-2.L",
            "toe2-3.L",
            "toe3-1.L",
            "toe3-2.L",
            "toe3-3.L",
            "toe4-1.L",
            "toe4-2.L",
            "toe4-3.L",
            "toe5-1.L",
            "toe5-2.L",
            "toe5-3.L",
            "pelvis.R",
            "upperleg01.R",
            "upperleg02.R",
            "lowerleg01.R",
            "lowerleg02.R",
            "foot.R",
            "toe1-1.R",
            "toe1-2.R",
            "toe2-1.R",
            "toe2-2.R",
            "toe2-3.R",
            "toe3-1.R",
            "toe3-2.R",
            "toe3-3.R",
            "toe4-1.R",
            "toe4-2.R",
            "toe4-3.R",
            "toe5-1.R",
            "toe5-2.R",
            "toe5-3.R",
        ]
        expect(skeleton.getJointNames()).to.deep.equal(out)
    })

    it("getMHP()", function () {
        const out = skeleton.toMHP()
        expect(out).contains("\nbone toe5-1.R 15 10 5\n")
    })

    xit("xxx", function () {
        const obj = new WavefrontObj("data/3dobjs/base.obj")
        const humanMesh = new HumanMesh(new MorphManager(), obj)
        new Skeleton(humanMesh, "memory", {
            name: "bones",
            version: "1.0",
            tags: ["t1"],
            description: "desc",
            copyright: "copyleft",
            license: "gpl",

            bones: {
                root: {
                    head: "root____head", // -> joint
                    parent: null, // -> bone | null
                    reference: null, // -> [bone, ...] | null
                    rotation_plane: "root____plane", // -> plane
                    tail: "root____tail", // -> joint
                    // "roll": number // while the default mesh/skeleton has no roll, other rigs may need one
                    // "weights_reference": [...] // weights in default_weights.mhv to use?
                },
                "pelvis.L": {
                    head: "pelvis.L____head",
                    parent: "root",
                    reference: null,
                    rotation_plane: "pelvis.L____plane",
                    tail: "pelvis.L____tail",
                },
            },

            // A helper joint is a little cube included in the base mesh,
            // that is always morphed accordingly the base mesh.
            // Helper joints are used to recalculate the skeleton after the morphing.
            // Each helper joint is represented by a list of eight vert indices,
            joints: {
                root____head: [4223],
                root____tail: [
                    // 1, 8, 16 or 24 values -> vertex indices of a joint helper cube?
                    13622, 13623, 13624, 13625, 13626, 13627, 13628, 13629,
                ],
                "pelvis.L____head": [13622, 13623, 13624, 13625, 13626, 13627, 13628, 13629],
                "pelvis.L____tail": [13846, 13847, 13848, 13849, 13850, 13851, 13852, 13853],
            },

            planes: {
                root____plane: [
                    "root____head", // -> joint
                    "root____tail", // -> joint
                    "spine05____tail", // -> joint
                ],
                "pelvis.L____plane": ["upperleg01.L____tail", "upperleg01.L____head", "pelvis.L____head"],
            },
        })
    })
})

function degEuler2matrix(x: number, y: number, z: number) {
    return euler2matrix(deg2rad(x), deg2rad(y), deg2rad(z))
}
