import { FileSystemAdapter } from "../../filesystem/FileSystemAdapter"
import { TreeNode, TreeNodeModel, TreeAdapter } from "toad.js"

export class SliderNode implements TreeNode {
    static count = 0
    label: string
    next?: SliderNode
    down?: SliderNode
    constructor(label: string) {
        SliderNode.count++
        this.label = label
    }
}

// class SliderTreeAdapter extends TreeAdapter<SliderNode> {
//     override displayCell(col: number, row: number): Node | undefined {       
//         return this.model && this.treeCell(row, this.model.rows[row].node.label)
//     }
// }
// TreeAdapter.register(SliderTreeAdapter, TreeNodeModel, SliderNode)

interface X {
    sortOrder: number
    label?: string
    cameraView: string
    showMacroStats?: boolean
    modifiers: any
}

function capitalize(s: string): string {
    return s[0].toUpperCase() +  s.slice(1)
}

export function labelFromModifier(groupName: String, name: string): string {
    const tlabel = name.split("-")

    if (tlabel[tlabel.length-1].indexOf("|") !== -1)
        tlabel.pop()

    if (tlabel.length > 1 && tlabel[0] === groupName)
        tlabel.shift()

    tlabel[0] = capitalize(tlabel[0])

    return tlabel.join(" ")
}

/*
 * loadSliders() loads data/modifiers/modeling_sliders.json, which contains the ui tree
 * listing containing the "Main", "Gender", "Face", "Torso", "Arms and legs" tabs, containing
 * a slider for each modifier.
 *
 * (the original is located in apps/gui/guimodifier.py)
 */
export function loadSliders(filename: string): SliderNode {
    const root = parseSliders(
        FileSystemAdapter.getInstance().readFile(filename),
        filename)
    console.log(`Loaded ${SliderNode.count} slider nodes from file ${filename}`)
    return root
}

export function parseSliders(data: string, filename: string = "memory"): SliderNode {
    const json = JSON.parse(data)
    let rootNode: SliderNode | undefined
    let lastTabNode: SliderNode | undefined
    for(const [k, v] of Object.entries(json).sort(
        (a: [string, any], b: [string, any]): number => a[1].sortOrder - b[1].sortOrder )
    ) {
        let label = k
        const o = v as X
        if (o.label !== undefined)
            label = o.label
        // console.log(label)          // Tab
        const tabNode = new SliderNode(label)
        if (lastTabNode)
            lastTabNode.next = tabNode
        else
            rootNode = tabNode
        lastTabNode = tabNode
        let lastCategoryNode: SliderNode | undefined
        for(const [k, v] of Object.entries(o.modifiers)) {
            // console.log(`    ${capitalize(k)}`) // Category
            const categoryNode = new SliderNode(capitalize(k))
            if (lastCategoryNode)
                lastCategoryNode.next = categoryNode
            else
                lastTabNode.down = categoryNode
            lastCategoryNode = categoryNode
            let lastSliderNode: SliderNode | undefined
            for(const o of v as []) {
                const m = o as any
                let label = (o as any).label
                if (label === undefined) {
                    const name = m.mod.split("/")
                    label = labelFromModifier(name[0], name[1])
                }
                const sliderNode = new SliderNode(label)
                if (lastSliderNode)
                    lastSliderNode.next = sliderNode
                else
                    lastTabNode.down = sliderNode
                lastSliderNode = sliderNode
                // console.log(`        ${label}`)
            }
        }
    }
    if (rootNode === undefined)
        throw Error("No sliders found.")
    return rootNode
}
