import * as fs from "fs"
import * as readline from "readline"

export class WavefrontObj {
    vertex: Float32Array
    indices: Uint16Array

    constructor() {
        this.vertex = new Float32Array()
        this.indices = new Uint16Array()
    }

    async load(input: fs.ReadStream) {
        const vertex = new Array<number>()
        const indices = new Array<number>()
        // const primitives = new Array<any>()
        const group = new Map<string, number>()

        const reader = readline.createInterface(input)
        for await (const line of reader) {
            // console.log(line)
            const tokens = line.trim().split(/\s+/)
            if (tokens.length === 0)
                continue
            switch(tokens[0]) {
                // comment
                case '#': break

                // vertex data
                case "v": // vertex X Y Z [W]
                    if (tokens.length < 4)
                        throw Error(`Too few arguments in ${line}`)
                        if (tokens.length > 5)
                        throw Error(`Too many arguments in ${line}`)
                    vertex.push(parseFloat(tokens[1]))
                    vertex.push(parseFloat(tokens[2]))
                    vertex.push(parseFloat(tokens[3]))
                    if (tokens.length === 5)
                        throw Error("Can't handle vertex with weight yet...")
                    //     vertex.push(parseFloat(tokens[4]))
                    // else
                    //     vertex.push(1)
                    break
                case "vt": // vectex texture U V W
                    // ignored for now
                    break
                case "vn": break // vertex normal I J K
                case "vp": break // vertext parameter space U V W

                // free-form curve/surface attributes
                case "deg": break
                case "bmat": break
                case "step": break
                case "cstype": break

                // elements
                case "p": break // point
                case "l": break // line
                case "f": // face( vertex[/[texture][/normal]])+
                    if (tokens.length !== 5)
                        throw Error("can't handle faces which are not quads yet")
                    for(let i=1; i<tokens.length; ++i) {
                         const split = tokens[i].split('/')
                         indices.push(parseInt(split[0], 10))
                    }
                    break
                case "curv": break // curve
                case "curv2": break // 2d curve
                case "surf": break // surface

                // free-form curve/surface body statements
                case "parm": break
                case "trim": break
                case "hole": break
                case "scrv": break
                case "sp": break
                case "end": break

                // connectivity between free-form surfaces
                case "con": break

                // grouping
                case "g": // <groupname>+ the following elements belong to that group
                    // Polygonal and free-form geometry statement.
                    this.endGroups()
                    for(let i=1; i<tokens.length; ++i) {
                        this.beginGroup(tokens[i])
                    }
                    break
                case "s": break
                case "mg": break
                case "o": break

                // display/render attributes
                case "bevel": break
                case "c_interp": break
                case "d_interp": break
                case "lod": break
                case "usemtl": // <materialname>
                    break
                case "mtllib": break
                case "shadow_obj": break
                case "trace_obj": break
                case "ctech": break
                case "stech": break

                default:
                    throw Error(`Unknown keyword '${tokens[0]}' in Wavefront OBJ file.`)
            }
            // console.log(tokens[0])
        }

        console.log(`found ${vertex.length} vertices, ${indices.length / 4} primitives`)

        this.vertex = new Float32Array(vertex)
        this.indices = new Uint16Array(indices)
    }

    beginGroup(name: string) {}

    endGroups() {}
}
