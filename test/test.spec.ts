import { expect } from "chai"
import { URL } from "url"
import * as fs from "fs"
import * as readline from "readline"

// http://paulbourke.net/dataformats/obj/

class WavefrontObj {
    async load(input: fs.ReadStream) {
        const reader = readline.createInterface(input)
        for await (let line of reader) {
            //console.log(line)
            let tokens = line.trim().split(/\s+/)
            if (tokens.length == 0)
                continue
            switch(tokens[0]) {
                // comment
                case '#': break

                // vertex data
                case "v": break // vertex X Y Z [W]
                case "vt": break // vectex texture U V W
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
                case "g": // <groupname> start a group
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

                // case "g": // GROUPNAME
                // case "s": // 'off'
                // case "f": // 5/5 3/6 4/7 6/8

                // case "vt": // vectex texture
                // case "vn": // vertex normal
                // case "vp": // vertext parameter space

                // case "deg"
            }
            //console.log(tokens[0])
        }
    }
}

describe("class WavefrontOBJ", ()=> {
    it("can parse base.obj without throwing an exception", async ()=> {
        // let url = new URL("file://./data/3dobjs/base.obj")
        const url = "data/3dobjs/base.obj"
        const stream = fs.createReadStream(url)
        const obj = new WavefrontObj().load(stream)
    })
})
