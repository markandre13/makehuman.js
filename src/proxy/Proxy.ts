// Human has setProxy, setHairProxy, setEyesProxy, ...

import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { Human } from "Human"
import { StringToLine } from "lib/StringToLine"
import { VertexBoneWeights } from "skeleton/VertexBoneWeights"
import { WavefrontObj } from "mesh/WavefrontObj"
import { mat3, vec3 } from 'gl-matrix'

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
    object?: any
    human: Human
    file: string
    // mtime
    uuid?: string
    // the basemesh this proxy is based on
    basemesh!: string
    tags: string[] = []
    version: number = 110

    weights?: Array<Array<number>>
    offsets?: Array<Array<number>>
    ref_vIdxs?: Array<Array<number>>

    vertWeights = new Map<number, Array<Array<number>>>()

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
        const name = basename(splitext(file))
        this.name = capitalize(name)
    }

    loadMeshAndObject(human: Human): WavefrontObj {
        const mesh = new WavefrontObj()
        mesh.load(this._obj_file!)
        return mesh
    }

    _finalize(refVerts: ProxyRefVert[]) {
        this.weights = refVerts.map(v => v._weights)
        this.ref_vIdxs = refVerts.map(v => v._verts)
        this.offsets = refVerts.map(v => v._offset)
    }

    // getCoords() methods are in: Object3D, Proxy, Skeleton
    // is this getCoords() only called by Proxy itself?

    //     self.human.setProxy(pxy)
    //   File "/Users/mark/upstream/makehuman/makehuman/./apps/human.py", line 158, in setProxy
    //     super(Human, self).setProxy(proxy)
    //   File "/Users/mark/upstream/makehuman/makehuman/./core/guicommon.py", line 392, in setProxy
    //     self.updateProxyMesh()
    //   File "/Users/mark/upstream/makehuman/makehuman/./core/guicommon.py", line 360, in updateProxyMesh
    //     self.proxy.update(self.__proxyMesh, fit_to_posed)
    //   File "/Users/mark/upstream/makehuman/makehuman/./shared/proxy.py", line 237, in update
    //     coords = self.getCoords(fit_to_posed)
    //   File "/Users/mark/upstream/makehuman/makehuman/./shared/proxy.py", line 211, in getCoords

    update(/*mesh, fit_to_posed=False*/) {
        // #log.debug("Updating proxy %s.", self.name)
        // if fit_to_posed:
        //     hcoord = self.human.meshData.coord
        // else:
        //     hcoord = self.human.getRestposeCoordinates()
        // coords = self.getCoords(hcoord)
        // mesh.changeCoords(coords)
        // mesh.calcNormals()
    }

    // looks like we get the base mesh in (morphed and/or posed)
    // what do we do with the proxy mesh?
    // or was the proxy mesh morphed/posed and this then corrects the proxy mesh???
    // a reasonable assumption might be: this takes the base mesh and output the proxy mesh,
    // with the faces, weights, etc. taken from the proxy mesh
    getCoords(hcoord: number[]): number[] {
        const matrix = this.tmatrix.getMatrix(hcoord)

        const ref_vIdxs = this.ref_vIdxs!
        const weights = this.weights!
        const offsets = this.offsets!

        const coord: number[] = []
        for(let i=0; i<ref_vIdxs.length; ++i) {
            let w0 = weights[i][0], w1 = weights[i][1], w2 = weights[i][2],
                idx = ref_vIdxs[i],
                idx0 = idx[0] * 3, idx1 = idx[1] * 3, idx2 = idx[2] * 3,
                t = vec3.transformMat3(
                    vec3.create(),
                    vec3.fromValues(offsets[i][0], offsets[i][1], offsets[i][2]),
                    matrix)

            let x = hcoord[idx0+0] * w0 + hcoord[idx1+0] * w1 + hcoord[idx2+0] * w2 + t[0]
            let y = hcoord[idx0+1] * w0 + hcoord[idx1+1] * w1 + hcoord[idx2+1] * w2 + t[1]
            let z = hcoord[idx0+2] * w0 + hcoord[idx1+2] * w1 + hcoord[idx2+2] * w2 + t[2]

            coord.push(x,y,z)
        }

        return coord
    }
}

export class TMatrix {
    scaleData?: Array<undefined | Array<number>>
    shearData?: Array<undefined | Array<number>>
    lShearData?: Array<undefined | Array<number>>
    rShearData?: Array<undefined | Array<number>>
    getScaleData(words: string[], idx: number) {
        // vn1 & nv2 are an index to a coordinate in the base mesh
        // den will be use to devide the distance between those coordinates
        const vn1 = parseInt(words[0])
        const vn2 = parseInt(words[1])
        const den = parseFloat(words[2])
        if (this.scaleData === undefined) {
            this.scaleData = [undefined, undefined, undefined]
        }
        this.scaleData[idx] = [vn1, vn2, den]
    }
    getShearData(words: string[], idx: number, side: "Left" | "Right" | undefined = undefined) {
        const vn1 = parseInt(words[0])
        const vn2 = parseInt(words[1])
        const x1 = parseFloat(words[2])
        const x2 = parseFloat(words[3])
        const bbdata = [vn1, vn2, x1, x2]
        if (side === "Left") {
            if (this.lShearData === undefined) {
                this.lShearData = [undefined, undefined, undefined]
            }
            this.lShearData[idx] = bbdata

        }
        if (side === "Right") {
            if (this.rShearData === undefined) {
                this.rShearData = [undefined, undefined, undefined]
            }
            this.rShearData[idx] = bbdata
        }
        if (side === undefined) {
            if (this.shearData === undefined) {
                this.shearData = [undefined, undefined, undefined]
            }
            this.shearData[idx] = bbdata
        }
    }
    getMatrix(hcoord: number[]): mat3 {
        if (this.scaleData !== undefined) {
            const matrix = mat3.identity(mat3.create())
            for (let n = 0; n < 3; ++n) {
                const [vn1, vn2, den] = this.scaleData[n]!
                const co1 = vn1 * 3
                const co2 = vn2 * 3
                const num = Math.abs(hcoord[co1 + n] - hcoord[co2 + n])
                matrix[n * 3 + n] = num / den
            }
            return matrix
        }
        if (this.shearData !== undefined) {
            throw Error("not implemented")
        }
        if (this.lShearData !== undefined) {
            throw Error("not implemented")
        }
        if (this.rShearData !== undefined) {
            throw Error("not implemented")
        }
        return mat3.identity(mat3.create())
    }
}

export class ProxyRefVert {
    _verts!: number[]
    _weights!: number[]
    _offset!: number[]
    constructor(human: Human) {
    }
    fromSingle(words: string[], vnum: number, vertWeights: Map<number, Array<Array<number>>>) {
        const v0 = parseInt(words[0])
        this._verts = [v0, 0, 1]
        this._weights = [1.0, 0.0, 0.0]
        this._offset = [0, 0, 0]
        this._addProxyVertWeight(vertWeights, v0, vnum, 1)
    }
    fromTriple(words: string[], vnum: number, vertWeights: Map<number, Array<Array<number>>>) {
        const v0 = parseInt(words[0])
        const v1 = parseInt(words[1])
        const v2 = parseInt(words[2])
        const w0 = parseFloat(words[3])
        const w1 = parseFloat(words[4])
        const w2 = parseFloat(words[5])
        let d0, d1, d2
        if (words.length > 6) {
            d0 = parseFloat(words[6])
            d1 = parseFloat(words[7])
            d2 = parseFloat(words[8])
        } else {
            [d0, d1, d2] = [0, 0, 0]
        }

        this._verts = [v0, v1, v2]
        this._weights = [w0, w1, w2]
        this._offset = [d0, d1, d2]

        this._addProxyVertWeight(vertWeights, v0, vnum, w0)
        this._addProxyVertWeight(vertWeights, v1, vnum, w1)
        this._addProxyVertWeight(vertWeights, v2, vnum, w2)
    }
    protected _addProxyVertWeight(vertWeights: Map<number, Array<Array<number>>>, v: number, pv: number, w: number) {
        if (vertWeights.has(v)) {
            vertWeights.get(v)!.push([pv, w])
        } else {
            vertWeights.set(v, [[pv, w]])
        }
    }
}

export function loadProxy(human: Human, path: string, type: ProxyType = "Clothes") {
    // .mhpxy
    const asciipath = path.substring(0, path.lastIndexOf(".")) + getAsciiFileExtension(type) + ".z"
    return loadTextProxy(human, asciipath, type)
}

const doRefVerts = 1
const doWeights = 2
const doDeleteVerts = 3

export function loadTextProxy(human: Human, filepath: string, type: ProxyType = "Clothes", data: string | undefined = undefined) {
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
