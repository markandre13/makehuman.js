import { PoseNode } from 'ui/poseView'
import { FileSystemAdapter } from './filesystem/FileSystemAdapter'
import { BiovisionHierarchy } from 'lib/BiovisionHierarchy'
import { mat4 } from 'gl-matrix'
import { toEuler } from 'mesh/Collada'
import { laugh01_IN } from 'laugh01'
import { boring01_IN } from 'boring01'

// MakeHuman 1.2 sets the pose 5 times when selecting a single pose...

// plugins/2_posing_expression.py
//   70  class ExpressionTaskView
//  152      def applyToPose(self, pose):
//  170          self.human.addAnimation(pose_)
//  171          self.human.setActiveAnimation('expr-lib-pose')
//  173          self.human.setPosed(True)
//  174          self.human.refreshPose()

//  178      def chooseExpression(self, filename): (1)
//  203          self.selectedPose = animation.poseFromUnitPose('expr-lib-pose', filename, self.base_anim)
//  204          self.applyToPose(self.selectedPose)
//  205          self.human.refreshPose()

// shared/animation.py
//   57  class AnimationTrack
//
//  264  class Pose(AnimationTrack):
//  287       def fromPoseUnit(self, filename, poseUnit):
//  312  class PoseUnit
//  422      def poseFromUnitPose(name, filename, poseUnit):
//  431          return Pose(name, emptyPose()).fromPoseUnit(filename, poseUnit)
//  818  class AnimatedMesh(object):
//  993      def setPosed(self, posed):
// 1034      def _pose()
// 1064          self.getBaseSkeleton().setPose(poseState)
// 1113      def refreshPose(self, updateIfInRest=False, syncSkeleton=True):

// apps/human.py
//   56  class Human(guicommon.Object, animation.AnimatedMesh)
// 1439      def refreshPose(self, updateIfInRest=False):
// 1445          super(Human, self).refreshPose(updateIfInRest)
//
// shared/skeleton.py
//       class Skeleton(object):
//  570      def setPose(self, poseMats):
export class ExpressionManager {
    facePoseUnits: BiovisionHierarchy
    facePoseUnitsNames: string[]
    poseUnitName2Frame = new Map<string, number>();
    expressions: string[]

    constructor() {
        // TODO: check if some of the json files contain some of the filenames being hardcoded here
        this.facePoseUnits = new BiovisionHierarchy('data/poseunits/face-poseunits.bvh')
        this.facePoseUnitsNames = JSON
            .parse(FileSystemAdapter.getInstance().readFile("data/poseunits/face-poseunits.json"))
            .framemapping as string[]
        this.facePoseUnitsNames.forEach((name, index) => this.poseUnitName2Frame.set(name, index))

        this.expressions = FileSystemAdapter.getInstance()
            .listDir("expressions")
            .filter(filename => filename.endsWith(".mhpose"))
            .map(filename => filename.substring(0, filename.length - 7))
    }

    setExpression(expression: number, poseNodes: PoseNode) {
        const expressionName = this.expressions[expression]
        console.log(`=================== ${expressionName} ===================`)
        // console.log(`ExpressionManager::setExpression(${expressionName})`)
        expression = JSON.parse(FileSystemAdapter.getInstance().readFile(`data/expressions/${expressionName}.mhpose`))
            .unit_poses as any
        this.applyExpression(expression, poseNodes)
    }

    applyExpression(expression: any, poseNodes: PoseNode) {
        //
        // calculate face pose from expression
        //
        const facePose = new Map<string, number[]>()
        for (let prop of Object.getOwnPropertyNames(expression)) {
            const value = expression[prop]
            const frame = this.poseUnitName2Frame.get(prop)!!
            // console.log(`${prop} (${frame}) = ${value}`)
            for (const joint of this.facePoseUnits.bvhJoints) {
                if (joint.name === "End effector") {
                    continue
                }
                const start = frame * joint.channels.length
                const rotation = [
                    value * joint.frames[start],
                    value * joint.frames[start + 1],
                    value * joint.frames[start + 2]
                ] as number[]

                let r = facePose.get(joint.name)
                if (r === undefined) {
                    r = [0, 0, 0]
                    facePose.set(joint.name, r)
                }
                // console.log(`rotate joint ${joint.name} by [${rotation[0]}, ${rotation[1]}, ${rotation[2]}]`)
                r[0] -= rotation[0]
                r[1] -= rotation[1]
                r[2] -= rotation[2]
            }
        }

        //
        // copy final rotation to pose
        //
        function d(num: number) {
            return Math.round((num + Number.EPSILON) * 1000000) / 1000000
        }

        function applyToPose(node: PoseNode | undefined) {
            if (node === undefined) {
                return
            }
            if (node.bone.name !== "head") {
                let r = facePose.get(node.bone.name)
                if (r === undefined) {
                    r = [0, 0, 0]
                }

                // const pm = mat4.create()
                // let pmIdx = node.bone.index * 12
                // for (let j = 0; j < 12; ++j) {
                //     pm[j] = laugh01_IN[pmIdx++]
                // }
                // mat4.transpose(pm, pm)
                // let out = pm

                let out = mat4.create()
                let tmp = mat4.create()
                mat4.multiply(out, out, mat4.fromXRotation(tmp, -r[0] / 360 * 2 * Math.PI))
                mat4.multiply(out, out, mat4.fromYRotation(tmp, -r[1] / 360 * 2 * Math.PI))
                mat4.multiply(out, out, mat4.fromZRotation(tmp, -r[2] / 360 * 2 * Math.PI))

                let out2 = calcWebGL(out, node.bone.matRestGlobal!)
                node.bone.matPose = out2

                // const { x, y, z } = toEuler(out2)
                // this.bone.matPose = out

                // if (node.bone.name === "jaw") {
                //     console.log("JAW")
                //     console.log(mrg)
                //     console.log(r)
                //     console.log(out)
                // }

                // node.x.value = x / (2 * Math.PI) * 360
                // node.y.value = y / (2 * Math.PI) * 360
                // node.z.value = z / (2 * Math.PI) * 360
                const e = 0.00003
                // if (Math.abs(r[0]) > e || Math.abs(r[1]) > e || Math.abs(r[2]) > e) {
                //     console.log(`${node.bone.name} := [${d(r[0])}, ${d(r[1])}, ${d(r[2])}] (${x}, ${y}, ${z})`)
                // }
            }
            applyToPose(node.next)
            applyToPose(node.down)
        }
        applyToPose(poseNodes.find("head"))
    }
}

export function calcWebGL(poseMat: mat4, matRestGlobal: mat4) {
    let matPose = mat4.fromValues(
        poseMat[0], poseMat[1], poseMat[2], 0,
        poseMat[4], poseMat[5], poseMat[6], 0,
        poseMat[8], poseMat[9], poseMat[10], 0,
        0, 0, 0, 1
    )
    const invRest = mat4.invert(mat4.create(), matRestGlobal)
    const m0 = mat4.multiply(mat4.create(), invRest, matPose)
    mat4.multiply(matPose, m0, matRestGlobal)
    matPose[12] = matPose[13] = matPose[14] = 0
    return matPose
}