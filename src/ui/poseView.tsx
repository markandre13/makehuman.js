import { TablePos } from 'toad.js/table/TablePos'
import { TreeNodeModel } from 'toad.js/table/model/TreeNodeModel'
import { TreeAdapter } from 'toad.js/table/adapter/TreeAdapter'

import { TextField } from "toad.js/view/TextField"
import { Fragment } from 'toad.jsx/lib/jsx-runtime'
import { PoseNode } from '../expression/PoseNode'

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
                    <TextField model={node.x} style={{ width: '50px' }} />
                    <TextField model={node.y} style={{ width: '50px' }} />
                    <TextField model={node.z} style={{ width: '50px' }} />
                </> as Fragment
                cell.replaceChildren(...x)
                break
        }
    }
}


