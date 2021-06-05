import { StringToLine } from "../lib/StringToLine"
// import { vec3 } from 'gl-matrix'

// lib/targets.py
// getTargets()

// FILE: data/modifiers/modeling_modifiers.json
// points to the files in the data/targets/ directory: data/targets/<group>/<target>-(<min>|<max>).target
//
// [
// {
//    "group": "<group>"
//    "modifiers": [
//       { "macrovar": "<name>" [, "modifierType": "EthnicModifier"]
//       { "target": "<target>", "min": "<min>", "max": "<max>" },
//    ]
// }
// ]
//
// 
// data/targets/macrodetails/(african|asian|caucasian)-(male|female)-(baby|child|young|old).target
// data/targets/macrodetails/universal-(male|female)-(baby|child|young|old)-(minweight|averageweight|maxweight).target
// data/targets/macrodetails/height/(male|female)-(minmuscle|averagemuscle|maxmuscle)-(minweight|averageweight|maxweight)-(minheight|maxheight).target
// data/targets/macrodetails/proportions/(male|female)-(minmuscle|averagemuscle|maxmuscle)-(minweight|averageweight|maxweight)-(idealproportions|uncommonproportions).target
// FILE: data/modifiers/modeling_modifiers_desc.json
// additional description for the UI
//
// FILE: data/modifiers/modeling_sliders.json
//
// ./compile_targets.py: create a binary representation of the target files?
// ./lib/targets.py    : load target files?
// apps/human.py
// apps/compat.py
// apps/devtests.py
// apps/humanmodifier.py
// apps/warpmodifier.py
// core/algos3d.py: class Target!
// number: 64bit double float
// should use these instead to save memory and to improve performance:
// Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array
// Float32Array, Float64Array
// BigInt64Array, BigUint64Array
export class Target {
    verts: Array<number>; // x, y, z
    data: Array<number>; // index

    constructor() {
        this.verts = new Array<number>();
        this.data = new Array<number>();
    }

    load(data: string) {
        // index x y, z
        const reader = new StringToLine(data)
        //  const reader = readline.createInterface(input)
        let lineNumber = 0
        for (let line of reader) {
            ++lineNumber
            // console.log(line)
            line = line.trim()
            if (line.length === 0)
                continue
            if (line[0] === '#')
                continue
            const tokens = line.split(/\s+/)
            this.data.push(parseInt(tokens[0], 10))
            this.verts.push(parseFloat(tokens[1]))
            this.verts.push(parseFloat(tokens[2]))
            this.verts.push(parseFloat(tokens[3]))
        }
    }

    apply(verts: number[], scale: number) {
        let dataIndex = 0, vertexIndex = 0
        while(dataIndex < this.data.length) {
            let index = this.data[dataIndex++] * 3
            verts[index++] += this.verts[vertexIndex++] * scale
            verts[index++] += this.verts[vertexIndex++] * scale
            verts[index++] += this.verts[vertexIndex++] * scale
        }
    }
}
