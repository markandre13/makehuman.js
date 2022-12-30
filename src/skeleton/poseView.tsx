import { TablePos } from 'toad.js/table/TablePos'
import { TreeNode } from 'toad.js/table/model/TreeNode'
import { TreeNodeModel } from 'toad.js/table/model/TreeNodeModel'
import { TreeAdapter } from 'toad.js/table/adapter/TreeAdapter'

import { Bone } from "./Bone"
import { Text } from "toad.js/view/Text"
import { NumberModel } from 'toad.js/model/NumberModel'
import { Fragment } from 'toad.jsx/lib/jsx-runtime'
import { Signal } from 'toad.js/Signal'

export class PoseNode implements TreeNode {
    static count = 0
    bone!: Bone
    next?: PoseNode
    down?: PoseNode

    x: NumberModel
    y: NumberModel
    z: NumberModel

    constructor(bone: Bone | undefined = undefined, signal: Signal<PoseNode> | undefined = undefined) {
        this.x = new NumberModel(0, { min: -180, max: 180, step: 5 })
        this.y = new NumberModel(0, { min: -180, max: 180, step: 5 })
        this.z = new NumberModel(0, { min: -180, max: 180, step: 5 })

        if (bone === undefined || signal === undefined) {
            return
        }

        this.x.modified.add( () => signal.trigger(this))
        this.y.modified.add( () => signal.trigger(this))
        this.z.modified.add( () => signal.trigger(this))

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

// this tells <toad-table> how to render TreeNodeModel<PoseNode>
export class PoseTreeAdapter extends TreeAdapter<PoseNode> {

    constructor(model: TreeNodeModel<PoseNode>) {
        super(model)
        this.config.expandColumn = true
    }

    override get colCount(): number {
        return 2
    }

    override showCell(pos: TablePos, cell: HTMLSpanElement) {
        if (this.model === undefined) {
            console.log("no model")
            return
        }
        const node = this.model.rows[pos.row].node
        switch (pos.col) {
            case 0:
                this.treeCell(pos, cell, node.bone.name)
                break
            case 1:
                const x = <>
                    <Text model={node.x} style={{ width: '50px' }} />
                    <Text model={node.y} style={{ width: '50px' }} />
                    <Text model={node.z} style={{ width: '50px' }} />
                </> as Fragment
                cell.replaceChildren(...x)
                break
        }
    }
}


