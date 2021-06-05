import { FileSystemAdapter } from '../../filesystem/FileSystemAdapter'
import { TreeNode, NumberModel } from 'toad.js'

export interface Category {
    sortOrder: number
    label?: string
    cameraView: string
    showMacroStats?: boolean
    modifiers: any
}

export interface Modifier {
    mod: string
    label: string
    cam?: string
    enabledCondition?: string
}

export class SliderNode implements TreeNode {
    static count = 0
    label: string
    category?: Category
    modifier?: Modifier
    model?: NumberModel
    next?: SliderNode
    down?: SliderNode
    constructor(label?: string, modifier?: Modifier) {
        SliderNode.count++
        this.label = label || ''
        this.modifier = modifier

        if (modifier) {
            // modifier.mod can have values like
            //   buttocks/buttocks-buttocks-volume-decr|incr-decr|incr
            //   stomach/stomach-pregnant-decr|incr
            // this should define the number range (decr: start at -1, incr: end at 1, incr-decr: ????)
            // there's no separate target file for 'incr-decr'

            // what's inside TargetFactory:
            //   groups: Map<target name, Component>
            //      "buttocks-buttocks-volume-decr"
            ///       parent: key: ["buttocks"]
            //        key: the name splitted at '-'
            //        data: gender, age, race, muscle, weight, height, breastsize, breastfirmness, bodypropotions: all undefined
            //        path: "/targets/buttocks/buttocks-volume-decr.target"
            //   images: Map<target name, image filename>
            //   index: (superset of groups?)
            //     "buttocks" -> ["buttocks-buttocks-volume-decr", "buttocks-buttocks-volume-incr"]
            //     "buttocks-buttocks-volume-decr" -> Component
            //     "buttocks-buttocks-volume-incr" -> Component
            //   targets:

            // using modifier.mod we then need to find the target files to load
            //   data/targets/stomach/stomach-pregnant-incr.target
            //   data/targets/buttocks/buttocks-volume-incr.target

            // if a target can only be influenced by a single slider, we could store the targets in the SliderNode

            // the value then needs to be translated back to scale factors for each target

            // the model needs to be re-rendered

            this.model = new NumberModel(0, { min: 0, max: 1, step: 0.01 })
            this.model.modified.add(() => {
                console.log(modifier)
                console.log(this.model!.value)
            })
        }
    }
}

function capitalize(s: string): string {
    return s[0].toUpperCase() + s.slice(1)
}

export function labelFromModifier(groupName: string, name: string): string {
    const tlabel = name.split('-')

    if (tlabel[tlabel.length - 1].indexOf('|') !== -1)
        tlabel.pop()

    if (tlabel.length > 1 && tlabel[0] === groupName)
        tlabel.shift()

    tlabel[0] = capitalize(tlabel[0])

    return tlabel.join(' ')
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

export function parseSliders(data: string, filename = 'memory'): SliderNode {
    const json = JSON.parse(data)
    let rootNode: SliderNode | undefined
    let lastTabNode: SliderNode | undefined
    for (const [tabKey, tabValue] of Object.entries(json).sort(
        (a: [string, any], b: [string, any]): number => a[1].sortOrder - b[1].sortOrder)
    ) {
        const tab = tabValue as Category

        let label = tabKey
        if (tab.label !== undefined)
            label = tab.label

        const tabNode = new SliderNode(label)
        tabNode.category = tab
        if (lastTabNode)
            lastTabNode.next = tabNode
        else
            rootNode = tabNode
        lastTabNode = tabNode

        let lastCategoryNode: SliderNode | undefined
        for (const [categoryKey, categoryValue] of Object.entries(tab.modifiers)) {
            const categoryNode = new SliderNode(capitalize(categoryKey))
            if (lastCategoryNode)
                lastCategoryNode.next = categoryNode
            else
                lastTabNode.down = categoryNode
            lastCategoryNode = categoryNode
            let lastSliderNode: SliderNode | undefined
            for (const modifier of categoryValue as Modifier[]) {
                let label = modifier.label
                if (label === undefined) {
                    const name = modifier.mod.split('/')
                    label = labelFromModifier(name[0], name[1])
                }
                const sliderNode = new SliderNode(label, modifier)
                if (lastSliderNode)
                    lastSliderNode.next = sliderNode
                else
                    lastCategoryNode.down = sliderNode
                lastSliderNode = sliderNode
            }
        }
    }
    if (rootNode === undefined)
        throw Error('No sliders found.')
    return rootNode
}
