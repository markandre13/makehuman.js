import { TreeNode } from 'toad.js/table/model/TreeNode'
import { Bone } from "../skeleton/Bone"
import { Signal } from 'toad.js/Signal'
import { mat4 } from 'gl-matrix'
import { NumberRelModel } from './NumberRelModel'

export class PoseNode implements TreeNode {
    static count = 0;
    bone!: Bone
    next?: PoseNode
    down?: PoseNode

    x: NumberRelModel
    y: NumberRelModel
    z: NumberRelModel

    updateBone() {
        let out = mat4.create()
        let tmp = mat4.create()
        mat4.fromXRotation(out, this.x.value / 360 * 2 * Math.PI)
        mat4.fromYRotation(tmp, this.y.value / 360 * 2 * Math.PI)
        mat4.multiply(out, out, tmp)
        mat4.fromZRotation(tmp, this.z.value / 360 * 2 * Math.PI)
        mat4.multiply(out, out, tmp)
        this.bone.matPose = out
        // this.bone.update()
        this.bone.skeleton.boneslist!.forEach(bone => bone.update())
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

    constructor(bone: Bone | undefined = undefined, signal: Signal<PoseNode> | undefined = undefined) {
        this.x = new NumberRelModel(0, { min: -180, max: 180, step: 5, default: 0 })
        this.y = new NumberRelModel(0, { min: -180, max: 180, step: 5, default: 0 })
        this.z = new NumberRelModel(0, { min: -180, max: 180, step: 5, default: 0 })

        if (bone === undefined || signal === undefined) {
            return
        }

        const update = () => {
            this.updateBone()
            signal.trigger(this)
        }

        this.x.modified.add(update)
        this.y.modified.add(update)
        this.z.modified.add(update)

        this.bone = bone

        // TODO: reduce nesting
        // E.g. instead of
        //     spine05
        //       spine04
        //         spine03
        //           spine02
        //             spine01
        //               neck01
        //               clavicle.R
        //               clavicle.L
        //             breast.R
        //             breast.L
        // arrange it as
        //     spine05
        //       spine04
        //       spine03
        //       spine02
        //         spine01
        //           neck01
        //           clavicle.R
        //           clavicle.L
        //         breast.R
        //         breast.L
        bone.children.forEach(childBone => {
            if (this.down === undefined) {
                this.down = new PoseNode(childBone, signal)
            } else {
                const next = this.down
                this.down = new PoseNode(childBone, signal)
                this.down.next = next
            }
        })
    }
}
