import { EthnicModifier } from "./EthnicModifier"
import { MacroModifier } from "./MacroModifier"
import { UniversalModifier } from "./UniversalModifier"
import { Modifier } from "./Modifier"
import { Human } from "../../Human"
import { FileSystemAdapter } from "../../filesystem/FileSystemAdapter"

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
export function loadSliders(filename: string): void {
    return parseSliders(
        FileSystemAdapter.getInstance().readFile(filename),
        filename)
}

export function parseSliders(data: string, filename: string = "memory"): void {
    const json = JSON.parse(data)
    for(const [k, v] of Object.entries(json).sort(
        (a: [string, any], b: [string, any]): number => a[1].sortOrder - b[1].sortOrder )
    ) {
        let label = k
        const o = v as X
        if (o.label !== undefined)
            label = o.label
        console.log(label)          // Tab
        for(const [k, v] of Object.entries(o.modifiers)) {
            console.log(`    ${capitalize(k)}`) // Category
            for(const o of v as []) {
                const m = o as any
                let label = (o as any).label
                if (label === undefined) {
                    const name = m.mod.split("/")
                    label = labelFromModifier(name[0], name[1])
                }
                console.log(`        ${label}`)
            }
        }
    }
}
