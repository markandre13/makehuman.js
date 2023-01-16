// Human has setProxy, setHairProxy, setEyesProxy, ...

import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { Human } from "Human"
import { StringToLine } from "lib/StringToLine"

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
    uuid!: string
    description!: string
    version!: number
    z_depth!: number
    max_pole!: number

    basemesh!: string

    constructor(file: string, type: ProxyType, human: Human) {
    }

    loadMeshAndObject(human: Human) {
    }
}

export function loadProxy(human: Human, path: string, type: ProxyType = "Clothes") {
    // .mhpxy
    const asciipath = path.substring(0, path.lastIndexOf(".")) + getAsciiFileExtension(type) + ".z"
    loadTextProxy(human, asciipath, type)
}

export function loadTextProxy(human: Human, filepath: string, type: ProxyType = "Clothes") {
    const data = FileSystemAdapter.getInstance().readFile(filepath)
    const reader = new StringToLine(data)
    const proxy = new Proxy(filepath, type, human)
    let lineNumber = 0
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
            // proxy.tags.append( " ".join(words[1:]).lower() )
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
        if (key === "") {
            continue
        }
        // elif key == 'special_pose':
        //     proxy.special_pose[words[1]] = words[2]

        // elif key == 'verts':
        //     status = doRefVerts
        // elif key == 'weights':
        //     status = doWeights
        //     if proxy.weights is None:
        //         proxy.weights = {}
        //     weights = []
        //     proxy.weights[words[1]] = weights
        // elif key == "delete_verts":
        //     status = doDeleteVerts

        // elif key == 'obj_file':
        //     proxy._obj_file = _getFileName(folder, words[1], ".obj")

        // elif key == 'material':
        //     matFile = _getFileName(folder, words[1], ".mhmat")
        //     proxy._material_file = matFile
        //     proxy.material.fromFile(proxy.material_file)

        // elif key == 'vertexboneweights_file':
        //     from animation import VertexBoneWeights
        //     proxy._vertexBoneWeights_file = _getFileName(folder, words[1], ".jsonw")
        //     proxy.vertexBoneWeights = VertexBoneWeights.fromFile(proxy.vertexBoneWeights_file)

        // elif key == 'backface_culling':
        //     # TODO remove in future
        //     log.warning('Deprecated parameter "backface_culling" used in proxy file. Set property backfaceCull in material instead.')
        // elif key == 'transparent':
        //     # TODO remove in future
        //     log.warning('Deprecated parameter "transparent" used in proxy file. Set property in material file instead.')

        // elif key == 'uvLayer':
        //     # TODO is this still used?
        //     if len(words) > 2:
        //         layer = int(words[1])
        //         uvFile = words[2]
        //     else:
        //         layer = 0
        //         uvFile = words[1]
        //     #uvMap = material.UVMap(proxy.name+"UV"+str(layer))
        //     #uvMap.read(proxy.mesh, _getFileName(folder, uvFile, ".mhuv"))
        //     # Delayed load, only store path here
        //     proxy.uvLayers[layer] = _getFileName(folder, uvFile, ".mhuv")

        // elif key == 'x_scale':
        //     proxy.tmatrix.getScaleData(words, 0)
        // elif key == 'y_scale':
        //     proxy.tmatrix.getScaleData(words, 1)
        // elif key == 'z_scale':
        //     proxy.tmatrix.getScaleData(words, 2)

        // elif key == 'shear_x':
        //     proxy.tmatrix.getShearData(words, 0, None)
        // elif key == 'shear_y':
        //     proxy.tmatrix.getShearData(words, 1, None)
        // elif key == 'shear_z':
        //     proxy.tmatrix.getShearData(words, 2, None)
        // elif key == 'l_shear_x':
        //     proxy.tmatrix.getShearData(words, 0, 'Left')
        // elif key == 'l_shear_y':
        //     proxy.tmatrix.getShearData(words, 1, 'Left')
        // elif key == 'l_shear_z':
        //     proxy.tmatrix.getShearData(words, 2, 'Left')
        // elif key == 'r_shear_x':
        //     proxy.tmatrix.getShearData(words, 0, 'Right')
        // elif key == 'r_shear_y':
        //     proxy.tmatrix.getShearData(words, 1, 'Right')
        // elif key == 'r_shear_z':
        //     proxy.tmatrix.getShearData(words, 2, 'Right')

        if (key === "basemesh") {
            proxy.basemesh = words[0]
            continue
        }

        // elif key in ['shapekey', 'subsurf', 'shrinkwrap', 'solidify', 'objfile_layer', 'uvtex_layer', 'use_projection', 'mask_uv_layer', 'texture_uv_layer', 'delete', 'vertexgroup_file']:
        //     log.warning('Deprecated parameter "%s" used in proxy file. Please remove.', key)

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
