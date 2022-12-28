import { TreeNode } from 'toad.js'
import { Bone } from "./loadSkeleton"

export class PoseNode implements TreeNode {
    static count = 0
    bone!: Bone
    next?: PoseNode
    down?: PoseNode
    constructor(bone: Bone | undefined = undefined) {
        if (bone === undefined) {
            return
        }
        this.bone = bone
        bone.children.forEach( childBone => {
            if (this.down === undefined) {
                this.down = new PoseNode(childBone)
            } else {
                const next = this.down
                this.down = new PoseNode(childBone)
                this.down.next = next
            }
        })
   }
}