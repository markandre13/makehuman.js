// Human has setProxy, setHairProxy, setEyesProxy, ...

import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { Human } from "Human"
import { StringToLine } from "lib/StringToLine"
import { VertexBoneWeights } from "skeleton/VertexBoneWeights"

// proxy files .proxy, .mhclo
// mesh    : .obj
// material: .mhmat
// weights : .jsonw
// texture : .mhuv

// female_generic.obj
// female_generic.proxy

// teeth_base.mhclo
// teeth_base.obj

type ProxyType = 'Proxymeshes' | 'Clothes' | 'Hair' | 'Eyes' | 'Eyebrows' | 'Eyelashes' | 'Teeth' | 'Tongue'

const SimpleProxyTypes = ['Hair', 'Eyes', 'Eyebrows', 'Eyelashes', 'Teeth', 'Tongue']
const ProxyTypes = ['Proxymeshes', 'Clothes', ...SimpleProxyTypes]

export class Proxy {
    name!: string
    // license
    description: string = ""
    type: ProxyType
    // object
    human: Human
    file: string
    // mtime
    uuid?: string
    basemesh!: string
    tags: string[] = []
    version: number = 110

    ref_vIdxs?: any
    weights?: Map<string, any>
    vertWeights = new Map<any, any>()
    offsets?: any

    vertexBoneWeights?: VertexBoneWeights
    tmatrix = new TMatrix()

    z_depth: number = -1
    max_pole?: number

    special_pose = new Map<string, string>()

    uvLayers = new Map<number, string>()
    // material

    _obj_file?: string
    _vertexBoneWeights_file?: string
    _material_file?: string
    deleteVerts?: any
    weightsCache?: any
    cacheSkel?: any

    constructor(file: string, type: ProxyType, human: Human) {
        this.file = file
        this.type = type
        this.human = human
    }

    loadMeshAndObject(human: Human) {
    }
}

class TMatrix {
    getScaleData(words: string[], idx: number) {
    }
    getShearData(words: string[], idx: number, side: "Left"|"Right"|undefined) {
    }
}

class ProxyRefVert {
    constructor(human: Human) {
    }
    fromSingle(words: string[], vnum: number, vertWeights: Map<any, any>) {
    }
    fromTriple(words: string[], vnum: number, vertWeights: Map<any, any>) {
    }
}

export function loadProxy(human: Human, path: string, type: ProxyType = "Clothes") {
    // .mhpxy
    const asciipath = path.substring(0, path.lastIndexOf(".")) + getAsciiFileExtension(type) + ".z"
    loadTextProxy(human, asciipath, type)
}

const doRefVerts = 1
const doWeights = 2
const doDeleteVerts = 3

export function loadTextProxy(human: Human, filepath: string, type: ProxyType = "Clothes") {
    let lineNumber = 0
    const data = FileSystemAdapter.getInstance().readFile(filepath)
    const reader = new StringToLine(data)
    const folder = ""
    const proxy = new Proxy(filepath, type, human)

    const refVerts: ProxyRefVert[] = []

    let status = 0
    let vnum = 0
    for (let line of reader) {
        ++lineNumber
        // console.log(line)
        line = line.trim()
        if (line.length === 0)
            continue
        if (line[0] === '#')
            continue
        const words = line.split(/\s+/)
        if (words.length === 0) {
            continue
        }

        const key = words.shift()

        if (key === "name") {
            proxy.name = words.join(" ")
            continue
        }
        if (key === "uuid") {
            proxy.uuid = words.join(" ")
            continue
        }
        if (key === "description") {
            proxy.description = words.join(" ")
            continue
        }
        // elif key in ['author', 'license', 'homepage']:
        //     proxy.license.updateFromComment(words)
        if (key === "tag") {
            proxy.tags.push(words.join(" ").toLowerCase())
            continue
        }
        if (key === "version") {
            proxy.version = parseInt(words[0])
            continue
        }
        if (key === "z_depth") {
            proxy.z_depth = parseInt(words[0])
            continue
        }
        if (key === "max_pole") {
            proxy.max_pole = parseInt(words[0])
            continue
        }
        if (key === "special_pose") {
            proxy.special_pose.set(words[0], words[1])
            continue
        }
        if (key === "verts") {
            status = doRefVerts
            continue
        }
        if (key === "weights") {
            status = doWeights
            if (proxy.weights === undefined) {
                proxy.weights = new Map<string, any>()
            }
            const weights: any = []
            proxy.weights.set(words[0], weights)
            continue
        }
        if (key === "delete_verts") {
            status = doDeleteVerts
            continue
        }
        if (key === 'obj_file') {
            proxy._obj_file = _getFileName(folder, words[0], ".obj")
            continue
        }
        if (key === 'material') {
            const matFile = _getFileName(folder, words[0], ".mhmat")
            proxy._material_file = matFile
            // proxy.material.fromFile(proxy.material_file)
            continue
        }
        if (key === 'vertexboneweights_file') {
            console.log(`loaded weights...`)
            proxy._vertexBoneWeights_file = _getFileName(folder, words[0], ".jsonw")

            const data = FileSystemAdapter.getInstance().readFile(proxy._vertexBoneWeights_file)
            let json
            try {
                json = JSON.parse(data)
            }
            catch (error) {
                console.log(`Failed to parse JSON in ${proxy._vertexBoneWeights_file}:\n${data.substring(0, 256)}`)
                throw error
            }

            proxy.vertexBoneWeights = new VertexBoneWeights(proxy._vertexBoneWeights_file, json)
            continue
        }
        if (key == 'backface_culling') {
            // TODO remove in future
            console.warn('Deprecated parameter "backface_culling" used in proxy file. Set property backfaceCull in material instead.')
            continue
        }
        if (key == 'transparent') {
            // TODO remove in future
            console.warn('Deprecated parameter "transparent" used in proxy file. Set property in material file instead.')
            continue
        }
        if (key == 'uvLayer') {
            // TODO is this still used?
            let layer
            let uvFile
            if (words.length > 1) {
                layer = parseInt(words[0])
                uvFile = words[1]
            } else {
                layer = 0
                uvFile = words[0]
            }
            //uvMap = material.UVMap(proxy.name+"UV"+str(layer))
            //uvMap.read(proxy.mesh, _getFileName(folder, uvFile, ".mhuv"))
            // Delayed load, only store path here
            proxy.uvLayers.set(layer, _getFileName(folder, uvFile, ".mhuv"))
            continue
        }

        if (key === 'x_scale') {
            proxy.tmatrix.getScaleData(words, 0)
            continue
        }
        if (key === 'y_scale') {
            proxy.tmatrix.getScaleData(words, 1)
            continue
        }
        if (key === 'z_scale') {
            proxy.tmatrix.getScaleData(words, 2)
            continue
        }

        if (key == 'shear_x') {
            proxy.tmatrix.getShearData(words, 0, undefined)
            continue
        }
        if (key == 'shear_y') {
            proxy.tmatrix.getShearData(words, 1, undefined)
            continue
        }
        if (key == 'shear_z') {
            proxy.tmatrix.getShearData(words, 2, undefined)
            continue
        }
        if (key == 'l_shear_x') {
            proxy.tmatrix.getShearData(words, 0, 'Left')
            continue
        }
        if (key == 'l_shear_y') {
            proxy.tmatrix.getShearData(words, 1, 'Left')
            continue
        }
        if (key == 'l_shear_z') {
            proxy.tmatrix.getShearData(words, 2, 'Left')
            continue
        }
        if (key == 'r_shear_x') {
            proxy.tmatrix.getShearData(words, 0, 'Right')
            continue
        }
        if (key == 'r_shear_y') {
            proxy.tmatrix.getShearData(words, 1, 'Right')
            continue
        }
        if (key == 'r_shear_z') {
            proxy.tmatrix.getShearData(words, 2, 'Right')
            continue
        }

        if (key === "basemesh") {
            proxy.basemesh = words[0]
            continue
        }

        if (['shapekey', 'subsurf', 'shrinkwrap', 'solidify', 'objfile_layer', 'uvtex_layer',
            'use_projection', 'mask_uv_layer', 'texture_uv_layer', 'delete', 'vertexgroup_file']
            .findIndex(x => x === key) !== -1) {
            console.warn(`Deprecated parameter "${key}" used in proxy file. Please remove.`)
            continue
        }

        if (status == doRefVerts) {
            const refVert = new ProxyRefVert(human)
            refVerts.push(refVert)
            if (words.length == 0) {
                refVert.fromSingle([key!], vnum, proxy.vertWeights)
            } else {
                refVert.fromTriple([key!, ...words], vnum, proxy.vertWeights)
            }
            vnum += 1
            continue
        }

        if (status == doWeights) {
            //     v = int(words[0])
            //     w = float(words[1])
            //     weights.append((v,w))
            throw Error(`doWeights`)
        }

        if (status == doDeleteVerts) {
            //     sequence = False
            //     for v in words:
            //         if v == "-":
            //             sequence = True
            //         else:
            //             v1 = int(v)
            //             if sequence:
            //                 for vn in range(v0,v1+1):
            //                     proxy.deleteVerts[vn] = True
            //                 sequence = False
            //             else:
            //                 proxy.deleteVerts[v1] = True
            //             v0 = v1
            throw Error(`doDeleteVerts`)
        }

        console.warn(`Unknown keyword ${key} found in proxy file ${filepath}`)
        break
    }
}

function getAsciiFileExtension(proxyType: string) {
    if (proxyType === "Proxymeshes") {
        return ".proxy"
    } else {
        return ".mhclo"
    }
}

function _getFileName(folder: string, file: string, suffix: string) {
    // (name, ext) = os.path.split(file)
    // if ext:
    //     return os.path.join(folder, file)
    // else:
    //     return os.path.join(folder, file+suffix)
    return folder + file + suffix
}