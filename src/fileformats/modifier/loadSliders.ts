import { EthnicModifier } from "./EthnicModifier"
import { MacroModifier } from "./MacroModifier"
import { UniversalModifier } from "./UniversalModifier"
import { Modifier } from "./Modifier"
import { Human } from "../../Human"
import { FileSystemAdapter } from "../../filesystem/FileSystemAdapter"

// from apps/gui/guimodifier.py
export function loadSliders(filename: string): void {
    return parseSliders(
        FileSystemAdapter.getInstance().readFile(filename),
        filename)
}

export function parseSliders(data: string, filename: string = "memory"): void {
    
}
