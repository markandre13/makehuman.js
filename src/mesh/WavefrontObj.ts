import { StringToLine } from '../lib/StringToLine'
import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'
import { Group } from './Group'

// makehuman/shared/wavefront.py
export class WavefrontObj {
    name = ""

    // makehuman: fverts, fuvs, fnorm; verts, uvs(texco)

    vertex: Float32Array  // x,y,z (coord in makehuman)
    uv: Float32Array // u,v (texco in makehuman)
    // normal: number[]  // x,y,z (due to morphing & skinning, normals are calculated in makehuman)

    // list of quads
    fxyz: number[] = [] // (fvert in makehuman)
    fuv: number[] = []

    groups: Group[]   // name, startIndex, length
    material: Group[] // name, startIndex, length

    toString(): string {
        return `WavefrontObj {name: '${this.name}', vertices: ${this.vertex.length / 3}, quads: ${this.fxyz.length / 6}, groups: ${this.groups.length}} `
    }

    constructor(filename: string, data?: string) {
        this.name = filename
        if (data === undefined) {
            data = FileSystemAdapter.getInstance().readFile(filename)
        }
        this.groups = []
        this.material = []
        const vertex: number[] = []
        const texcoord: number[] = []
        const normal: number[] = []

        const reader = new StringToLine(data)

        let lineNumber = 0
        for (let line of reader) {
            ++lineNumber
            // console.log(line)
            line = line.trim()
            if (line.length === 0)
                continue
            if (line[0] === '#') {
                // TODO: might want to parse # basemesh <name>
                continue
            }
            const tokens = line.split(/\s+/)
            switch (tokens[0]) {
                // vertex data
                case 'v': // vertex X Y Z [W]
                    if (tokens.length !== 4) {
                        throw Error(`vertex (v) must have 3 arguments in ${line}`)
                    }
                    vertex.push(parseFloat(tokens[1]))
                    vertex.push(parseFloat(tokens[2]))
                    vertex.push(parseFloat(tokens[3]))
                    break
                case 'vt': // vertex texture U V
                    if (tokens.length != 3) {
                        throw Error(`vertex texture (vt) must have 2 arguments in ${line}`)
                    }
                    texcoord.push(parseFloat(tokens[1]))
                    texcoord.push(parseFloat(tokens[2]))
                    break
                case 'vn': // vertex normal I J K
                    if (tokens.length != 4) {
                        throw Error(`vertex normal (vn) must have 3 arguments in ${line}`)
                    }
                    normal.push(parseFloat(tokens[1]))
                    normal.push(parseFloat(tokens[2]))
                    normal.push(parseFloat(tokens[3]))
                    break
                case 'vp': break // vertext parameter space U V W

                // free-form curve/surface attributes
                case 'deg': break
                case 'bmat': break
                case 'step': break
                case 'cstype': break

                // elements
                case 'p': break // point
                case 'l': break // line
                case 'f': // face( vertex[/[texture][/normal]])+
                    if (tokens.length !== 5) {
                        throw Error(`can't handle faces which are not quads yet (line ${lineNumber}: '${line}'}`)
                    }
                    for (let i = 1; i < tokens.length; ++i) {
                        const split = tokens[i].split('/')
                        this.fxyz.push(parseInt(split[0], 10) - 1)
                        this.fuv.push(parseInt(split[1], 10) - 1)
                    }
                    break
                case 'curv': break  // curve
                case 'curv2': break // 2d curve
                case 'surf': break  // surface

                // free-form curve/surface body statements
                case 'parm': break
                case 'trim': break
                case 'hole': break
                case 'scrv': break
                case 'sp': break
                case 'end': break

                // connectivity between free-form surfaces
                case 'con': break

                // grouping
                case 'g': // <groupname>+ the following elements belong to that group    
                    this.groups.push(new Group(tokens[1], this.fxyz.length))
                    break
                case 's': break
                case 'mg': break
                case 'o': // <object name>
                    this.name = tokens[1]
                    break

                // display/render attributes
                case 'bevel': break
                case 'c_interp': break
                case 'd_interp': break
                case 'lod': break
                case 'usemtl': // <materialname>
                    this.material.push(new Group(tokens[1], this.fxyz.length))
                    break
                case 'mtllib': break
                case 'shadow_obj': break
                case 'trace_obj': break
                case 'ctech': break
                case 'stech': break

                default:
                    throw Error(`Unknown keyword '${tokens[0]}' in Wavefront OBJ file in line '${line}' of length ${line.length}'.`)
            }
        }
        this.vertex = new Float32Array(vertex)
        this.uv = new Float32Array(texcoord)

        // set group's lengths
        if (this.groups.length > 0) {
            for (let i = 0; i < this.groups.length - 1; ++i) {
                this.groups[i].length = this.groups[i + 1].startIndex - this.groups[i].startIndex
            }
            this.groups[this.groups.length - 1].length = this.fxyz.length - this.groups[this.groups.length - 1].startIndex
        }

        if (this.material.length > 0) {
            for (let i = 0; i < this.material.length - 1; ++i) {
                this.material[i].length = this.material[i + 1].startIndex - this.material[i].startIndex
            }
            this.material[this.material.length - 1].length = this.fxyz.length - this.material[this.material.length - 1].startIndex
        }

        this.logStatistics(filename)
    }

    getFaceGroup(name: string): Group | undefined {
        // the facegroups are not groups
        // and they might be either stored in one of these:
        //   makehuman/data/rigs/default_weights.mhw
        //   makehuman/data/poses/benchmark.bvh
        //   makehuman/data/poses/tpose.bvh
        //   makehuman/data/poseunits/face-poseunits.bvh
        // or maybe the code i have here is correct but the weight must be read as part of the rig?

        // return undefined
        const x = this.groups
            .filter(g => g.name === name)
        if (x.length !== 1) {
            return undefined
        }
        return x[0]
    }

    logStatistics(filename: string) {
        let groupNames = ""
        let joints = 0
        let helpers = 0
        this.groups.forEach(g => {
            if (g.name.startsWith("joint-")) {
                ++joints
            } else
                if (g.name.startsWith("helper-")) {
                    ++helpers
                } else {
                    if (groupNames.length === 0) {
                        groupNames = g.name
                    } else {
                        groupNames = `${groupNames}, ${g.name}`
                    }
                }
        })
        if (groupNames.length !== 0) {
            groupNames = ` and ${groupNames}`
        }
        console.log(`Loaded ${this.groups.length} groups (${joints} joints, ${helpers} helpers${groupNames}), ${this.material.length} materials, ${this.vertex.length / 3} vertices, ${this.uv.length/2} uvs, ${this.fxyz.length / 3} triangles from file '${filename}'`)
    }
}
