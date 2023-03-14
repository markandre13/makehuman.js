// Human has setProxy, setHairProxy, setEyesProxy, ...

import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { Human } from "modifier/Human"
import { StringToLine } from "lib/StringToLine"
import { VertexBoneWeights } from "skeleton/VertexBoneWeights"
import { WavefrontObj } from "mesh/WavefrontObj"
import { vec3 } from 'gl-matrix'
import { ProxyRefVert } from "./ProxyRefVert"
import { TMatrix } from "./TMatrix"
import { Skeleton } from "skeleton/Skeleton"
import { zipForEach } from "lib/zipForEach"

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
    mesh!: WavefrontObj
    file: string
    // mtime
    uuid?: string
    // the name of the basemesh this proxy is based on
    basemesh!: string
    tags: string[] = []
    version: number = 110

    // these describe how the basemesh is mapped to the proxy mesh
    // * the outer arrays have one entry for each proxy mesh entry
    //   * 'ref_vIdxs' references 3 vertices in the base mesh
    //   * 'weights' has 3 weights for each of those 3 vertices in the base mesh
    //   * 'offsets' contains an additional translation which is adjusted by tmatrix
    //   * all is added together and we have a vertex in the proxy mesh
    ref_vIdxs!: Array<Array<number>> // (Vidx1,Vidx2,Vidx3) list with references to human vertex indices, indexed by proxy vert
    weights!: Array<Array<number>>   // (w1,w2,w3) list, with weights per human vertex (mapped by ref_vIdxs), indexed by proxy vert
    tmatrix = new TMatrix()          // Offset transformation matrix. Replaces scale
    offsets!: Array<Array<number>>   // (x,y,z) list of vertex offsets, indexed by proxy vert

    vertWeights = new Map<number, Array<Array<number>>>() // (proxy-vert, weight) list for each parent vert (reverse mapping of self.weights, indexed by human vertex)

    // Explicitly defined custom vertex-to-bone weights, connecting the proxy mesh to the reference skeleton (optional)
    // Not to be confused with the vertex weights assigned for mapping the proxy mesh geometry to the base mesh
    vertexBoneWeights?: VertexBoneWeights // 

    z_depth: number = -1 // Render order depth for the proxy object. Also used to determine which proxy object should mask others (delete faces)
    max_pole?: number // Signifies the maximum number of faces per vertex on the mesh topology. undefined per default.

    special_pose = new Map<string, string>() // Special poses that should be set on the human when this proxy is active to make it look good

    uvLayers = new Map<number, string>()
    // material

    _obj_file?: string
    _vertexBoneWeights_file?: string
    _material_file?: string
    deleteVerts?: any
    weightsCache?: any
    cacheSkel?: any
    human: Human

    constructor(file: string, type: ProxyType, human: Human) {
        this.file = file
        this.type = type
        const name = basename(splitext(file))
        this.name = capitalize(name)

        this.human = human
    }

    loadMeshAndObject(): WavefrontObj {
        const mesh = new WavefrontObj()
        mesh.load(this._obj_file!)
        return mesh
    }

    _finalize(refVerts: ProxyRefVert[]) {
        this.weights = refVerts.map(v => v._weights)
        this.ref_vIdxs = refVerts.map(v => v._verts)
        this.offsets = refVerts.map(v => v._offset)
    }

    /**
     * Return proxy meth vertices adjusted to base mesh
     * 
     * More suitable for morphing (translate) than posing (rotate), especially when the offset is noticable.
     * 
     * @param hcoord base mesh vertices (may be morphed/posed)
     * @returns proxy mesh vertices
     */
    getCoords(hcoord: number[]): number[] {
        const matrix = this.tmatrix.getMatrix(this.human.scene.vertexMorphed)

        const ref_vIdxs = this.ref_vIdxs! // three vertices in the base mesh
        const weights = this.weights!     // three weights for each of those vertices
        const offsets = this.offsets!     // an additional translation

        const coord: number[] = []
        for (let i = 0; i < ref_vIdxs.length; ++i) {
            let w0 = weights[i][0], w1 = weights[i][1], w2 = weights[i][2],
                idx = ref_vIdxs[i],
                idx0 = idx[0] * 3, idx1 = idx[1] * 3, idx2 = idx[2] * 3,
                t = vec3.transformMat3(
                    vec3.create(),
                    vec3.fromValues(offsets[i][0], offsets[i][1], offsets[i][2]),
                    matrix)

            let x = hcoord[idx0 + 0] * w0 + hcoord[idx1 + 0] * w1 + hcoord[idx2 + 0] * w2 + t[0]
            let y = hcoord[idx0 + 1] * w0 + hcoord[idx1 + 1] * w1 + hcoord[idx2 + 1] * w2 + t[1]
            let z = hcoord[idx0 + 2] * w0 + hcoord[idx1 + 2] * w1 + hcoord[idx2 + 2] * w2 + t[2]

            coord.push(x, y, z)
        }

        return coord
    }

    // return the weights for the proxy mesh
    // o will be at least needed when exporting to wavefront, collada, ...
    // o for testing without export, we could apply the proxy to the morphed mesh
    //   and then pose the rig with it's own weights
    getVertexWeights(humanWeights: VertexBoneWeights, skel: Skeleton | undefined = undefined, allowCache = false) {
        const weights = this._getVertexWeights(humanWeights)
        return new VertexBoneWeights(this.file, { weights })
    }

    _getVertexWeights(humanWeights: VertexBoneWeights) {
        if (this.vertexBoneWeights) {
            throw Error(`not implemented`)
        }
        // Remap weights through proxy mapping
        const WEIGHT_THRESHOLD = 1e-4  // Threshold for including bone weight
        const weights = {} as any
        // humanWeights is from the base skeleton
        humanWeights._data.forEach(([indxs, wghts], bname) => {
            const vgroup: number[][] = []
            zipForEach(indxs, wghts, (v, wt) => {
                let vlist = this.vertWeights.get(v)
                if (vlist === undefined) {
                    return
                }
                for (let [pv, w] of vlist) {
                    const pw = w * wt
                    if (pw > WEIGHT_THRESHOLD) {
                        vgroup.push([pv, pw])
                    }
                }
            })
            if (vgroup.length > 0) {
                weights[bname] = vgroup
            }
        })
        return weights
    }
}

export function loadProxy(human: Human, path: string, type: ProxyType = "Clothes"): Proxy {
    // .mhpxy
    const asciipath = path.substring(0, path.lastIndexOf(".")) + getAsciiFileExtension(type) + ".z"
    const proxy = loadTextProxy(human, asciipath, type)
    proxy.mesh = proxy.loadMeshAndObject()
    return proxy
}

const doRefVerts = 1
const doWeights = 2
const doDeleteVerts = 3

export function loadTextProxy(human: Human, filepath: string, type: ProxyType = "Clothes", data: string | undefined = undefined): Proxy {
    let lineNumber = 0
    if (data === undefined) {
        data = FileSystemAdapter.getInstance().readFile(filepath)
    }
    const reader = new StringToLine(data)
    const folder = filepath.substring(0, filepath.lastIndexOf("/"))
    const proxy = new Proxy(filepath, type, human)

    const refVerts: ProxyRefVert[] = []
    // let weights: Array<Array<number>> | undefined = undefined

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
            // data to adjust proxy to basemesh
            status = doRefVerts
            continue
        }
        if (key === "weights") {
            status = doWeights
            // TODO: proxy.weights is different and will be overwritten, weights is unused
            // if (proxy.weights === undefined) {
            //     proxy.weights = new Map<string, number[]>()
            // }
            // weights = []
            // proxy.weights.set(words[0], weights)
            continue
        }
        if (key === "delete_verts") {
            // vertices to delete (e.g. clothes may remove parts of the body mesh)
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
            // TODO: weights isn't actually used
            // const v = parseInt(words[0])
            // const w = parseFloat(words[1])
            // weights!.push([v, w])
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

    if (proxy.z_depth === -1) {
        console.warn(`Proxy file ${filepath} does not specify a Z depth. Using 50.`)
        proxy.z_depth = 50
    }

    // since max-pole is used for the calculation of neighboring planes we have to double it initially
    proxy.max_pole! *= 2

    proxy._finalize(refVerts)

    return proxy
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
    return `${folder}/${file.substring(0, file.indexOf("."))}${suffix}`
}

function basename(path: string) {
    return path.split('/').reverse()[0]
}
function splitext(path: string) {
    return path.split('.')[0]
}
function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
