import { PoseNode } from 'ui/poseView'
import { FileSystemAdapter } from './filesystem/FileSystemAdapter'
import { BiovisionHierarchy } from 'lib/BiovisionHierarchy'

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
                node.x.value = r[0]
                node.y.value = r[1]
                node.z.value = r[2]
                const e = 0.00003
                if (Math.abs(r[0]) > e || Math.abs(r[1]) > e || Math.abs(r[2]) > e) {
                    console.log(`${node.bone.name} := [${d(r[0])}, ${d(r[1])}, ${d(r[2])}]`)
                }
            }
            applyToPose(node.next)
            applyToPose(node.down)
        }
        applyToPose(poseNodes.find("head"))
    }
}
