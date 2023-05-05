import { expect, use } from '@esm-bundle/chai'
import { chaiString } from './chai/chaiString'
use(chaiString)
import { chaiAlmost } from "./chai/chaiAlmost"
use(chaiAlmost())

import { mat4, vec3, vec4 } from 'gl-matrix'

import { FileSystemAdapter } from '../src/filesystem/FileSystemAdapter'
import { HTTPFSAdapter } from '../src/filesystem/HTTPFSAdapter'
import { loadSkeleton } from '../src/skeleton/loadSkeleton'
import { Human } from '../src/modifier/Human'
import { HumanMesh } from '../src/mesh/HumanMesh'
import { WavefrontObj } from '../src/mesh/WavefrontObj'
import { laugh01_IN, laugh01_mrg, laugh01_OUT } from '../src/laugh01'
import { toEuler } from '../src/mesh/Collada'
import { calcWebGL, ExpressionManager } from '../src/ExpressionManager'

describe("expression", function () {

    this.beforeAll(function () {
        FileSystemAdapter.setInstance(new HTTPFSAdapter())
    })

    function m2s(name: string, m: mat4) {
        return `${name} =
[${m[0]}, ${m[1]}, ${m[2]}, ${m[3]},
 ${m[4]}, ${m[5]}, ${m[6]}, ${m[7]},
 ${m[8]}, ${m[9]}, ${m[10]}, ${m[11]},
 ${m[12]}, ${m[13]}, ${m[14]}, ${m[15]}]`
    }

    it("python matrix order", function () {
        const poseMats = mat4.fromValues(
            0.36235777, 0., 0.9320391, 10.,
            0., 1., 0., 11.,
            -0.9320391, 0., 0.36235777, 12.,
            0., 0., 0., 1.)
        // console.log(m2s(poseMats))

        const matRestGlobal = mat4.fromValues(
            0.921061, -0.38941833, 0., 10.243435,
            0.38941833, 0.921061, 0., 27.130648,
            0., 0., 1., 22.,
            0., 0., 0., 1.)
        // console.log(m2s(matRestGlobal))

        let matPose = calcPython(poseMats, matRestGlobal)

        // console.log(m2s(matPose))

        const out = mat4.fromValues(
            0.45905408, 0.22870827, 0.8584649, 0.,
            0.22870828, 0.90330374, -0.3629531, 0.,
            -0.85846484, 0.3629531, 0.36235777, 0.,
            0., 0., 0., 1.)

        expect(matPose).to.deep.almost.equal(out)
    })

    it("webgl matrix order", function () {
        const poseMats = mat4.fromValues(
            0.36235777, 0., 0.9320391, 10.,
            0., 1., 0., 11.,
            -0.9320391, 0., 0.36235777, 12.,
            0., 0., 0., 1.)
        mat4.transpose(poseMats, poseMats)

        const matRestGlobal = mat4.fromValues(
            0.921061, -0.38941833, 0., 10.243435,
            0.38941833, 0.921061, 0., 27.130648,
            0., 0., 1., 22.,
            0., 0., 0., 1.)
        mat4.transpose(matRestGlobal, matRestGlobal)

        let matPose = calcWebGL(poseMats, matRestGlobal)

        const expectedValue = mat4.fromValues(
            0.45905408, 0.22870827, 0.8584649, 0.,
            0.22870828, 0.90330374, -0.3629531, 0.,
            -0.85846484, 0.3629531, 0.36235777, 0.,
            0., 0., 0., 1.)
        mat4.transpose(expectedValue, expectedValue)

        expect(matPose).to.deep.almost.equal(expectedValue)

        const { x, y, z } = toEuler(matPose)
        console.log(`x: ${x}, y: ${y}, z: ${z}`)
        console.log(m2s(`matPose`, matPose))
    })
    it("jaw (python)", function () {
        const matRestGlobal = mat4.fromValues(
            1.0000000e+00, 0.0000000e+00, -3.4035770e-09, 0.0000000e+00,
            -1.8546673e-09, -8.3848995e-01, -5.4491717e-01, 7.0325418e+00,
            -2.8538647e-09, 5.4491717e-01, -8.3848995e-01, 5.6428331e-01,
            0.0000000e+00, 0.0000000e+00, 0.0000000e+00, 1.0000000e+00)

        const z = -14.271322 // rotation relative to BVH
        // const poseMat = mat4.fromValues(
        //     1., 0., 0., 0,
        //     0., 0.9691392, -0.24651398, 0,
        //     0., 0.24651398, 0.9691392, 0,
        //     0, 0, 0, 1)
        const poseMat = mat4.fromRotation(mat4.create(), z / 360 * 2 * Math.PI, vec3.fromValues(1, 0, 0))
        // console.log(m2s(poseMat))

        const out = mat4.fromValues(
            1.0000000e+00, 8.3902929e-10, -1.0503709e-10, 0.0000000e+00,
            -8.3902907e-10, 9.6913916e-01, -2.4651399e-01, 0.0000000e+00,
            -1.0503731e-10, 2.4651399e-01, 9.6913916e-01, 0.0000000e+00,
            0.0000000e+00, 0.0000000e+00, 0.0000000e+00, 1.0000000e+00)

        let matPose = calcPython(poseMat, matRestGlobal)

        // console.log(m2s(matPose))
        // console.log(m2s(out))

        expect(matPose).to.deep.almost.equal(out)
    })

    it("jaw (webgl)", function () {
        // makehuman will have two skeletons.

        // this is jaws matRestGlobal from the 2nd skeleton
        const matRestGlobal = mat4.fromValues(
            1.0000000e+00, 0.0000000e+00, -3.4035770e-09, 0.0000000e+00,
            -1.8546673e-09, -8.3848995e-01, -5.4491717e-01, 7.0325418e+00,
            -2.8538647e-09, 5.4491717e-01, -8.3848995e-01, 5.6428331e-01,
            0.0000000e+00, 0.0000000e+00, 0.0000000e+00, 1.0000000e+00)
        mat4.transpose(matRestGlobal, matRestGlobal)
        const z = -14.271322 // rotation relative to BVH
        // const poseMat = mat4.fromValues(
        //     1., 0., 0., 0,
        //     0., 0.9691392, -0.24651398, 0,
        //     0., 0.24651398, 0.9691392, 0,
        //     0, 0, 0, 1)
        const poseMat = mat4.fromRotation(mat4.create(), -z / 360 * 2 * Math.PI, vec3.fromValues(1, 0, 0))
        // mat4.transpose(poseMat, poseMat)
        // console.log(m2s(poseMat))

        const out = mat4.fromValues(
            1.0000000e+00, 8.3902929e-10, -1.0503709e-10, 0.0000000e+00,
            -8.3902907e-10, 9.6913916e-01, -2.4651399e-01, 0.0000000e+00,
            -1.0503731e-10, 2.4651399e-01, 9.6913916e-01, 0.0000000e+00,
            0.0000000e+00, 0.0000000e+00, 0.0000000e+00, 1.0000000e+00)
        mat4.transpose(out, out)

        let matPose = calcWebGL(poseMat, matRestGlobal)

        // console.log(m2s(matPose))
        // console.log(m2s(out))

        expect(matPose).to.deep.almost.equal(out)
    })

    function calcPython(poseMat: mat4, matRestGlobal: mat4) {
        let matPose = mat4.fromValues(
            poseMat[0], poseMat[1], poseMat[2], 0,
            poseMat[4], poseMat[5], poseMat[6], 0,
            poseMat[8], poseMat[9], poseMat[10], 0,
            0, 0, 0, 1
        )
        const invRest = mat4.invert(mat4.create(), matRestGlobal)
        const m0 = mat4.multiply(mat4.create(), matRestGlobal, matPose)
        mat4.multiply(matPose, m0, invRest)
        matPose[3] = matPose[7] = matPose[11] = 0
        return matPose
    }

    it("with real word data", async function () {
        this.timeout(10000)

        // python's matRestGlobal for root is (but only when doing the expression!!!)
        //  [[ 1.0000000e+00  5.9630129e-10 -8.2031509e-10  0.0000000e+00]
        //   [-8.5134000e-10  5.4039057e-02 -9.9853885e-01  5.1756668e-01]
        //   [-5.5110094e-10  9.9853879e-01  5.4039061e-02 -6.4773333e-01]
        //   [ 0.0000000e+00  0.0000000e+00  0.0000000e+00  1.0000000e+00]]

        const human = new Human()
        const obj = new WavefrontObj('data/3dobjs/base.obj')
        const scene = new HumanMesh(human, obj)
        const skeleton = loadSkeleton(scene, 'data/rigs/default.mhskel')
        // for (const bone of skeleton.boneslist!) {
        //     if (bone.name === "root" || bone.name === "jaw" || bone.name === "spine05") {
        //         console.log(m2s(`${bone.name}.matRestGlobal`, bone.matRestGlobal!))
        //     }
        // }

        let boneIdx = 0
        for (let mrgIdx = 0, pmIdx = 0, outIdx = 0; mrgIdx < laugh01_mrg.length;) {
            const bone = skeleton.boneslist![boneIdx++]

            // if (bone.name !== "root" && bone.name !== "spine05" && bone.name !== "jaw" && bone.name !== "head") {
            //     continue
            // }

            const mrg = mat4.create()
            for (let j = 0; j < 16; ++j) {
                mrg[j] = laugh01_mrg[mrgIdx++]
            }
            mat4.transpose(mrg, mrg)

            const pm = mat4.create()
            for (let j = 0; j < 12; ++j) {
                pm[j] = laugh01_IN[pmIdx++]
            }
            mat4.transpose(pm, pm)

            const pout = mat4.create()
            for (let j = 0; j < 16; ++j) {
                pout[j] = laugh01_OUT[outIdx++]
            }
            mat4.transpose(pout, pout)
            const out = calcWebGL(pm, mrg)

            let diff = false
            const epsilon = Number.EPSILON
            for (let i = 0; i < 16; ++i) {
                if (Math.abs(bone.matRestGlobal![i] - mrg[i]) >= epsilon) {
                    diff = true
                }
            }

            console.log(`---------------------------------------- ${bone.name} ----------------------------------------`)
            if (diff) {
                console.log(`matRestGlobal differs for bone ${bone.name}`)
            }
            console.log(m2s(`bone  .matRestGlobal`, bone.matRestGlobal!))
            console.log(m2s(`python.matRestGlobal`, mrg))

            // console.log(m2s(`my     poseMat`, out))
            // console.log(m2s(`python poseMat`, pout))

        }

    })

    // plugins/2_posing_expression.py
    // def _load_pose_units(self):
    // def chooseExpression(self, filename):
    //     self.selectedPose = animation.poseFromUnitPose('expr-lib-pose', filename, self.base_anim)
    //     self.applyToPose(self.selectedPose)
    //     self.human.refreshPose()
    // def getBlendedPose(self, poses, weights, additiveBlending=True, only_data=False):
    //    this function calculates the values in the _IN array
    // jaw = -14.271322498,0,0
    it.only("calculate", function () {
        // LOAD SKELETON
        const human = new Human()
        const obj = new WavefrontObj('data/3dobjs/base.obj')
        const scene = new HumanMesh(human, obj)
        const skeleton = loadSkeleton(scene, "data/rigs/default.mhskel")

        // const name = "boring01"
        const name = "laugh01"
        const mgr = new ExpressionManager()
        // const map = mgr.calculateExpression(
        //     mgr.expressions.findIndex((v) => v === name)
        // )
        // map.forEach( (value, key) => console.log(`${key} = ${value}`))

        const unit_poses = JSON.parse(FileSystemAdapter.getInstance().readFile(`data/expressions/${name}.mhpose`))
            .unit_poses as any

        // poses & weight as in getBlendedPose(...)
        const poses: number[] = []
        const weight: number[] = []
        for (let poseName of Object.getOwnPropertyNames(unit_poses)) {
            poses.push(mgr.poseUnitName2Frame.get(poseName)!)
            weight.push(unit_poses[poseName])
        }
        // console.log(weight)
        // console.log(poses)

        // 2_posing_expression.py
        //     class ExpressionTaskView(gui3d.TaskView, filecache.MetadataCacher):
        //         def _load_pose_units(self):
        //              self.base_bvh = bvh.load("data/poseunits/face-poseunits.bvh", allowTranslation="none"))

        //              TODO: createAnimationTrack() is not implemented yet
        //              self.base_anim = self.base_bvh.createAnimationTrack(self.human.getBaseSkeleton(), name="Expression-Face-PoseUnits")

        //              self.poseunit_names = loadJson("poseunits/face-poseunits.json").framemapping
        //              self.base_anim = animation.PoseUnit(self.base_anim.name, self.base_anim._data, self.poseunit_names)
        //         def chooseExpression(self, filename):
        //             self.selectedPose = animation.poseFromUnitPose('expr-lib-pose', filename, self.base_anim)
        // animation.py
        //     def poseFromUnitPose(name, filename, poseUnit):
        //         return Pose(name, emptyPose()).fromPoseUnit(filename, poseUnit)
        //     class Pose(AnimationTrack):
        //         def fromPoseUnit(self, filename, poseUnit):
        //             self._data = poseUnit.getBlendedPose(list(self.unitposes.keys()), list(self.unitposes.values()), only_data=True)
        //     class PoseUnit(AnimationTrack):
        //         def getBlendedPose(self, poses, weights, additiveBlending=True, only_data=False):
        //             ...

        // bvh.py: def createAnimationTrack(self, skel=None, name=None):
        // L198
        const base_anim = mgr.facePoseUnits.createAnimationTrack(skeleton, "Expression-Face-PoseUnits")

        for (let b_idx = 0, pmIdx = 0; b_idx < skeleton.boneslist!.length; ++b_idx) {
            const expectPoseMat = mat4.create()
            for (let j = 0; j < 12; ++j) {
                expectPoseMat[j] = laugh01_IN[pmIdx++] // THIS MIGHT BE THE WRONG ARRAY
            }
            mat4.transpose(expectPoseMat, expectPoseMat)

            expect(base_anim[b_idx], `base_anim[${b_idx}]`).to.deep.almost.equal(expectPoseMat)
        }
    })
})
