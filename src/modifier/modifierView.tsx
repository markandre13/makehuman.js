import { TablePos } from 'toad.js/table/TablePos'
import { TreeNode } from 'toad.js/table/model/TreeNode'
import { TreeNodeModel } from 'toad.js/table/model/TreeNodeModel'
import { TreeAdapter } from 'toad.js/table/adapter/TreeAdapter'

import { Text } from 'toad.js/view/Text'
import { Slider } from 'toad.js/view/Slider'
import { Fragment } from "toad.jsx"

import { SliderNode } from './loadSliders'

// this tells <toad-table> how to render TreeNodeModel<SliderNode>
export class SliderTreeAdapter extends TreeAdapter<SliderNode> {
    constructor(model: TreeNodeModel<SliderNode>) {
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
                this.treeCell(pos, cell, node.label)
                break
            case 1:
                if (node.model) {
                    const x = <>
                        <Text model={node.model} style={{ width: '50px' }} />
                        <Slider model={node.model} style={{width: '200px' }}/>
                    </> as Fragment
                    cell.replaceChildren(...x)
                }
                break
        }
    }
}
