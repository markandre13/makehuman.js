import { StringToLine } from '../lib/StringToLine'
import { FileSystemAdapter } from '../filesystem/FileSystemAdapter'
import { Mesh, Group, FaceGroup } from './Mesh'

// makehuman/shared/wavefront.py
export class WavefrontObj implements Mesh {
    name = ""

    // TODO: have a look at what WebGL needs

    vertex: number[]  // x,y,z (coord in makehuman)
    indices: number[] // quads of vertex indices (fvert in makehuman?)

    texture: number[] // u,v (texco in makehuman)
    
    normal: number[]  // x,y,z
    groups: Group[]   // name, startIndex, length
    material: Group[] // name, startIndex, length

    faceGroups = new Map<string, FaceGroup>()

    constructor() {
        this.vertex = []
        this.texture = []
        this.normal = []
        this.indices = []
        this.groups = []
        this.material = []
    }

    toString(): string {
        return `WavefrontObj {name: '${this.name}', vertices: ${this.vertex.length / 3}, quads: ${this.indices.length / 6}, groups: ${this.groups.length}} `
    }

    load(filename: string) {
        this.name = filename
        const data = FileSystemAdapter.getInstance().readFile(filename)
        const vertex = new Array<number>()
        const texture = new Array<number>()
        const normal = new Array<number>()
        const indices = new Array<number>()
        // const primitives = new Array<any>()
        const group = new Map<string, number>()
        const reader = new StringToLine(data)
        //  const reader = readline.createInterface(input)
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
                    if (tokens.length < 4)
                        throw Error(`Too few arguments in ${line}`)
                    if (tokens.length > 5)
                        throw Error(`Too many arguments in ${line}`)
                    vertex.push(parseFloat(tokens[1]))
                    vertex.push(parseFloat(tokens[2]))
                    vertex.push(parseFloat(tokens[3]))
                    if (tokens.length === 5)
                        throw Error('Can\'t handle vertex with weight yet...')
                    //     vertex.push(parseFloat(tokens[4]))
                    // else
                    //     vertex.push(1)
                    break
                case 'vt': // vectex texture U V
                    if (tokens.length < 3)
                        throw Error(`Too few arguments in ${line}`)
                    if (tokens.length > 4)
                        throw Error(`Too many arguments in ${line}`)
                    texture.push(parseFloat(tokens[1]))
                    texture.push(parseFloat(tokens[2]))
                    break
                case 'vn': // vertex normal I J K
                    if (tokens.length < 4)
                        throw Error(`Too few arguments in ${line}`)
                    if (tokens.length > 5)
                        throw Error(`Too many arguments in ${line}`)
                    normal.push(parseFloat(tokens[1]))
                    normal.push(parseFloat(tokens[2]))
                    normal.push(parseFloat(tokens[3]))
                    if (tokens.length === 5)
                        throw Error('Can\'t handle vertex with weight yet...')
                    //     vertex.push(parseFloat(tokens[4]))
                    // else
                    //     vertex.push(1)
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
                    if (tokens.length !== 5)
                        throw Error(`can't handle faces which are not quads yet (line ${lineNumber}: '${line}'}`)
                    // CONVERT QUAD INTO TRIANGLE FOR WEBGL
                    // 0   1
                    //
                    // 3   2
                    for (let i = 1; i < tokens.length; ++i) {
                        const split = tokens[i].split('/')
                        indices.push(parseInt(split[0], 10) - 1)
                    }
                    const idx = indices.length - 4
                    indices.push(indices[idx + 0])
                    indices.push(indices[idx + 2])
                    break
                case 'curv': break // curve
                case 'curv2': break // 2d curve
                case 'surf': break // surface

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
                    this.groups.push(new Group(tokens[1], indices.length))
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
                    this.material.push(new Group(tokens[1], indices.length))
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
        this.vertex = vertex
        this.texture = texture
        this.normal = normal
        this.indices = indices

        // set group's lengths
        if (this.groups.length > 0) {
            for (let i = 0; i < this.groups.length - 1; ++i) {
                this.groups[i].length = this.groups[i + 1].startIndex - this.groups[i].startIndex
            }
            this.groups[this.groups.length - 1].length = indices.length - this.groups[this.groups.length - 1].startIndex
        }

        if (this.material.length > 0) {
            for (let i = 0; i < this.material.length - 1; ++i) {
                this.material[i].length = this.material[i + 1].startIndex - this.material[i].startIndex
            }
            this.material[this.material.length - 1].length = indices.length - this.material[this.material.length - 1].startIndex
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
        console.log(`Loaded ${this.groups.length} groups (${joints} joints, ${helpers} helpers${groupNames}), ${this.material.length} materials, ${this.vertex.length / 3} vertices, ${this.texture.length/2} uvs, ${this.normal.length/3} normals. ${this.indices.length / 3} triangles from file '${filename}'`)
    }
}
