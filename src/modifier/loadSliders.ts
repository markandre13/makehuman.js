import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'
import { Human } from './Human'
import { NumberModel } from 'toad.js/model/NumberModel'
import { TreeNode } from 'toad.js/table/model/TreeNode'
import { Modifier } from './Modifier'

export interface Category {
    sortOrder: number
    label?: string
    cameraView: string
    showMacroStats?: boolean
    modifiers: any
}

export interface ModifierSpec {
    mod: string
    label: string
    cam?: string
    enabledCondition?: string
}

export class SliderNode implements TreeNode {
    static count = 0
    label: string
    category?: Category
    modifierSpec?: ModifierSpec
    modifier?: Modifier
    model?: NumberModel
    next?: SliderNode
    down?: SliderNode
    constructor(human?: Human, label?: string, modifierSpec?: ModifierSpec) {
        SliderNode.count++
        this.label = label || ''
        this.modifierSpec = modifierSpec

        if (modifierSpec) {
            // modifier.mod can have values like
            //   buttocks/buttocks-buttocks-volume-decr|incr-decr|incr
            //   stomach/stomach-pregnant-decr|incr
            // human.getModifier(modifier.mod) locates the Modifier for that name
            // for this to work, modifiers need to have been added with human.addModifier(...)

            // in apps/gui/guimodifier.py loadModifierTaskViews

            // class Modifier has getMin() & getMax() to get the range
            this.modifier = human!.getModifier(modifierSpec.mod)
            if (this.modifier !== undefined) {
                const modifier = this.modifier
                this.model = this.modifier.getModel()
                this.model.modified.add(() => {
                    // modifier.setValue(this.model!.value)
                    // modifier.updateValue(this.model!.value)
                    // self.modifier.updateValue(value, G.app.getSetting('realtimeNormalUpdates'))
                    // human!.updateProxyMesh(true)
                })
                // } else {
                //     console.log(`SliderNode(): no modifier '${modifierSpec.mod}' found for slider`)
            }
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
export function loadSliders(human: Human, filename: string): SliderNode {
    const root = parseSliders(
        human,
        FileSystemAdapter.readFile(filename),
        filename)
    console.log(`Loaded ${SliderNode.count} slider nodes from file ${filename}`)
    return root
}

export function parseSliders(human: Human, data: string, filename = 'memory'): SliderNode {
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

        const tabNode = new SliderNode(human, label)
        tabNode.category = tab
        if (lastTabNode)
            lastTabNode.next = tabNode
        else
            rootNode = tabNode
        lastTabNode = tabNode

        let lastCategoryNode: SliderNode | undefined
        for (const [categoryKey, categoryValue] of Object.entries(tab.modifiers)) {
            const categoryNode = new SliderNode(human, capitalize(categoryKey))
            if (lastCategoryNode)
                lastCategoryNode.next = categoryNode
            else
                lastTabNode.down = categoryNode
            lastCategoryNode = categoryNode
            let lastSliderNode: SliderNode | undefined
            for (const modifier of categoryValue as ModifierSpec[]) {
                let label = modifier.label
                if (label === undefined) {
                    const name = modifier.mod.split('/')
                    label = labelFromModifier(name[0], name[1])
                }
                const sliderNode = new SliderNode(human, label, modifier)
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
