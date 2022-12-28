import { TablePos } from 'toad.js/table/TablePos'
import { TreeNode } from 'toad.js/table/model/TreeNode'
import { TreeNodeModel } from 'toad.js/table/model/TreeNodeModel'
import { TreeAdapter } from 'toad.js/table/adapter/TreeAdapter'

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
        bone.children.forEach(childBone => {
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

// this tells <toad-table> how to render TreeNodeModel<PoseNode>
export class PoseTreeAdapter extends TreeAdapter<PoseNode> {

    constructor(model: TreeNodeModel<PoseNode>) {
        super(model)
        this.config.expandColumn = true
    }

    override get colCount(): number {
        return 1
    }

    override showCell(pos: TablePos, cell: HTMLSpanElement) {
        if (this.model === undefined) {
            console.log("no model")
            return
        }
        const node = this.model.rows[pos.row].node
        // switch (pos.col) {
        //     case 0:
        this.treeCell(pos, cell, node.bone.name)
        //        break
        //     case 1:
        //         if (node.model) {
        //             const x = <>
        //                 <Text model={node.model} style={{ width: '50px' }} />
        //                 <Slider model={node.model} style={{width: '200px' }}/>
        //             </> as Fragment
        //             cell.replaceChildren(...x)
        //         }
        //         break
        // }
    }
}


