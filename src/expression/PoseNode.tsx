import { TreeNode } from "toad.js/table/model/TreeNode"
import { Bone } from "../skeleton/Bone"
import { Signal } from "toad.js/Signal"
import { NumberRelModel } from "./NumberRelModel"
import { euler2matrix } from "gl/algorithms/euler"
import { deg2rad } from "gl/input/Context"

export class PoseNode implements TreeNode {
    static count = 0
    bone!: Bone
    next?: PoseNode
    down?: PoseNode

    x: NumberRelModel
    y: NumberRelModel
    z: NumberRelModel

    constructor(bone: Bone | undefined = undefined, signal: Signal<PoseNode> | undefined = undefined) {
        this.x = new NumberRelModel(0, { min: -180, max: 180, step: 5, default: 0 })
        this.y = new NumberRelModel(0, { min: -180, max: 180, step: 5, default: 0 })
        this.z = new NumberRelModel(0, { min: -180, max: 180, step: 5, default: 0 })

        if (bone === undefined || signal === undefined) {
            return
        }

        this.bone = bone

        bone.children.forEach((childBone) => {
            if (this.down === undefined) {
                this.down = new PoseNode(childBone, signal)
            } else {
                const next = this.down
                this.down = new PoseNode(childBone, signal)
                this.down.next = next
            }
        })
    }

    copyAllToSkeleton() {
        this.forEach((poseNode) => poseNode.copyEulerToBoneMatPose())
    }

    copyEulerToBoneMatPose() {
        this.bone.matUserPoseRelative = euler2matrix(
            deg2rad(this.x.value),
            deg2rad(this.y.value),
            deg2rad(this.z.value),
        )
        // console.log(`PoseNode(${this.bone.name}) ${this.x.value}, ${this.y.value}, ${this.z.value} -> Bone.matPose`)
    }

    find(boneName: string): PoseNode | undefined {
        if (this.bone.name === boneName) {
            return this
        }
        const next = this.next?.find(boneName)
        if (next) {
            return next
        }
        const down = this.down?.find(boneName)
        if (down) {
            return down
        }
        return undefined
    }

    forEach(cb: (node: PoseNode)=> void) {
        cb(this)
        this.next?.forEach(cb)
        this.down?.forEach(cb)
    }
}
