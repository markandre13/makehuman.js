import { FileSystemAdapter } from "filesystem/FileSystemAdapter"
import { StringToLine } from "lib/StringToLine"

export class ShaderParam {
    AdditiveShading?: number
    displacementmapIntensity?: number
    litsphereTexture?: string
}

export class ShaderConfig {
    ambientOcclusion?: boolean
    bump?: boolean
    diffuse?: boolean
    displacement?: boolean
    normal?: boolean
    spec?: boolean
    transparency?: boolean
    vertexColors?: boolean
}

export class Material {
    name?: string
    tags: string[] = []
    ambientColor?: number[]
    diffuseColor?: number[]
    specularColor?: number[]
    emissiveColor?: number[]

    aomapIntensity?: number
    displacementmapIntensity?: number
    normalmapIntensity?: number
    opacity?: number
    shininess?: number
    translucency?: number

    alphaToCoverage?: boolean
    autoBlendSkin?: boolean
    backfaceCull?: boolean
    castShadows?: boolean
    receiveShadows?: boolean
    depthless?: boolean
    shadeless?: boolean
    transparent?: boolean
    wireframe?: boolean

    aomapTexture?: string
    bumpTexture?: string
    diffuseTexture?: string
    normalmapTexture?: string
    displacementmapTexture?: string

    sssEnabled?: boolean
    sssBScale?: number
    sssGScale?: number
    sssRScale?: number

    shader?: string
    shaderParam?: ShaderParam
    shaderConfig?: ShaderConfig
}

function parseVec3(words: string[]) {
    return [parseFloat(words[0]), parseFloat(words[0]), parseFloat(words[0])]
}

function parseBool(word: string) {
    if (word.toLowerCase() === "false") {
        return false
    }
    if (word.toLowerCase() === "true") {
        return true
    }
    return undefined
}

export function loadMaterial(filepath: string, data: string | undefined = undefined) {
    let lineNumber = 0
    if (data === undefined) {
        data = FileSystemAdapter.readFile(filepath)
    }
    // console.log(data)
    const reader = new StringToLine(data)
    const folder = filepath.substring(0, filepath.lastIndexOf("/"))
    const material = new Material()

    let status = 0
    let vnum = 0
    for (let line of reader) {
        ++lineNumber
        // console.log(line)
        line = line.trim()
        if (line.length === 0)
            continue
        if (line.startsWith("#") || line.startsWith("//"))
            continue

        const words = line.split(/\s+/)
        if (words.length === 0) {
            continue
        }

        const key = words.shift()
        switch (key) {
            case "alphaToCoverage":
                material.alphaToCoverage = parseBool(words[0])
                break
            case "ambientColor":
                material.ambientColor = parseVec3(words)
                break
            case "aomapIntensity":
                material.aomapIntensity = parseFloat(words[0])
                break
            case "aomapTexture":
                material.aomapTexture = words[0]
                break
            case "autoBlendSkin":
                material.autoBlendSkin = parseBool(words[0])
                break
            case "backfaceCull":
                material.backfaceCull = parseBool(words[0])
                break
            case "bumpTexture":
                material.bumpTexture = words[0]
                break
            case "castShadows":
                material.castShadows = parseBool(words[0])
                break
            case "depthless":
                material.depthless = parseBool(words[0])
                break
            case "diffuseColor":
                material.diffuseColor = parseVec3(words)
                break
            case "diffuseTexture":
                material.diffuseTexture = words[0]
                break
            case "displacementmapIntensity":
                material.displacementmapIntensity = parseFloat(words[0])
                break
            case "displacementmapTexture":
                material.displacementmapTexture = words[0]
                break
            case "emissiveColor":
                material.emissiveColor = parseVec3(words)
                break
            case "name":
                material.name = words.join(" ")
                break
            case "normalmapIntensity":
                material.normalmapIntensity = parseFloat(words[0])
                break
            case "normalmapTexture":
                material.normalmapTexture = words[0]
                break
            case "opacity":
                material.opacity = parseFloat(words[0])
                break
            case "receiveShadows":
                material.receiveShadows = parseBool(words[0])
                break
            case "shadeless":
                material.shadeless = parseBool(words[0])
                break
            case "shader":
                material.shader = words[0]
                break
            case "shaderConfig":
                if (material.shaderConfig === undefined) {
                    material.shaderConfig = {}
                }
                switch (words.shift()) {
                    case "ambientOcclusion":
                        material.shaderConfig.ambientOcclusion = parseBool(words[0])
                        break
                    case "bump":
                        material.shaderConfig.bump = parseBool(words[0])
                        break
                    case "diffuse":
                        material.shaderConfig.diffuse = parseBool(words[0])
                        break
                    case "displacement":
                        material.shaderConfig.displacement = parseBool(words[0])
                        break
                    case "normal":
                        material.shaderConfig.normal = parseBool(words[0])
                        break
                    case "spec":
                        material.shaderConfig.spec = parseBool(words[0])
                        break
                    case "transparency":
                        material.shaderConfig.transparency = parseBool(words[0])
                        break
                    case "vertexColors":
                        material.shaderConfig.vertexColors = parseBool(words[0])
                        break
                }
                break
            case "shaderParam":
                if (material.shaderParam === undefined) {
                    material.shaderParam = {}
                }
                switch (words.shift()) {
                    case "AdditiveShading":
                        material.shaderParam.AdditiveShading = parseFloat(words[0])
                        break
                    case "displacementmapIntensity":
                        material.shaderParam.displacementmapIntensity = parseFloat(words[0])
                        break
                    case "litsphereTexture":
                        material.shaderParam.litsphereTexture = words[0]
                        break
                }
                break
            case "shininess":
                material.shininess = parseFloat(words[0])
                break
            case "specularColor":
                material.specularColor = parseVec3(words)
                break
            case "sssEnabled":
                material.sssEnabled = parseBool(words[0])
                break
            case "sssBScale":
                material.sssBScale = parseFloat(words[0])
                break
            case "sssGScale":
                material.sssGScale = parseFloat(words[0])
                break
            case "sssRScale":
                material.sssRScale = parseFloat(words[0])
                break
            case "tag":
                if (words.length !== 1) {
                    throw Error(`expected tag to have only one word but got ${words}`)
                }
                material.tags.push(words[0])
                break
            case "translucency":
                material.translucency = parseFloat(words[0])
                break
            case "transparent":
                material.transparent = parseBool(words[0])
                break
            case "wireframe":
                material.wireframe = parseBool(words[0])
                break
            default:
                throw Error(`unsupported keyword '${key}' with value ${words.join(" ")}`)
        }
    }
    return material
}
