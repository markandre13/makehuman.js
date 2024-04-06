//
// download additional assets for the data/ directory
//
//   makehuman-assets/base/
//     clothes/       new
//     expressions/   new
//     eyebrows/      fill
//     eyelashes/     new
//     eyes/          extends materials
//     hair/          fill
//     litspheres/    extends
//     poses/         extends
//     proxymeshes/   fill
//     rigs/          extend
//     skins/         extend
//     teeth/         new
//     tongue/        new
//
//   legend:
//     new    : the directory only exits in makehuman-assets
//     fill   : the directory is basically empty in makehuman
//     extends: adds additional files
//

import { platform, homedir } from "os"
import { lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs"
import { execSync } from "child_process"
import { stdout, exit } from "process"
import { sep } from "path"
import { zlibSync } from "fflate"

const repository = "https://github.com/makehumancommunity/makehuman-assets.git"
const branch = "master"

const makehumanDir = getMakehumanDirName()
const assetDirectory = `${makehumanDir}${sep}official_assets`

let sizeUncompressed = 0
let sizeCompressed = 0
const sourceDirs = [`base`, `${assetDirectory}/base`]
const directoryList = new Map<string, Map<string, boolean>>()
const animation = [" ", ".", "o", "O", "o", "."]
let animationTime = 0
let animationStep = 0

async function main() {
    if (!isDir("base/blendshapes")) {
        mkdirSync("base/blendshapes")
    }
    await downloadARKitFaceBlendshapes()
    await downloadICTFaceKitBlendshapes()

    if (isDir(assetDirectory)) {
        updateAssetDirectory(assetDirectory)
    } else {
        cloneAssetDirectory(repository, branch, makehumanDir)
    }

    if (!isDir("data")) {
        mkdirSync(`data`)
    }

    sourceDirs.forEach((sourceDir) => copyFiles(sourceDir))
    writeDirectoryList(directoryList)
    console.log(`uncompressed: ${bytes2megabytes(sizeUncompressed)}M, compressed: ${bytes2megabytes(sizeCompressed)}M`)
}

function getMakehumanDirName() {
    let makehumanDir = homedir()
    switch (platform()) {
        case "darwin":
            makehumanDir = `${makehumanDir}${sep}Documents${sep}MakeHuman`
            break
        default:
            makehumanDir = `${makehumanDir}${sep}makehuman`
            break
    }
    makehumanDir = `${makehumanDir}${sep}v1py3`
    return makehumanDir
}

function updateAssetDirectory(assetDirectory: string) {
    console.info(`updating makehuman assets in directory '${assetDirectory}'`)
    try {
        exec(`git -C ${assetDirectory} pull`)
    } catch (error) {
        console.warn(`ignoring failure to update: '${(error as any).message.trim()}'`)
    }
}

function cloneAssetDirectory(repository: string, branch: string, makehumanDir: string) {
    console.log(`downloading makehuman assets into directory '${makehumanDir}${sep}official_assets'`)
    try {
        mkdirSync(makehumanDir)
        exec(`git -C ${makehumanDir} clone -b '${branch}' '${repository}' official_assets`)
    } catch (error) {
        console.error(`\nunable to clone directory '${assetDirectory}'`)
        console.error((error as any).message.trim())
        exit(1)
    }
}

function copyFiles(sourceRoot: string, sourcePath: string = "") {
    const source = `${sourceRoot}${sep}${sourcePath}`
    let dir 
    try {
        dir = readdirSync(source)
    } catch(e) {
        if (e instanceof Error) {
            throw Error(`${source}: ${e.name} ${e.message}`)
        } else {
            throw Error(`${source}: ${e}`)
        }
    }
    for (const file of dir) {
        const now = Date.now()
        if (now - animationTime > 125) {
            animationTime = now
            stdout.write(`populating data/ ${animation[animationStep++]}\r`)
            if (animationStep === animation.length) {
                animationStep = 0
            }
        }
        const pathIn = `${source}${sep}${file}`
        const dirOut = `data${sep}${sourcePath}`
        const fileOut = `${dirOut}${sep}${file}`

        let directory = directoryList.get(dirOut)
        if (directory === undefined) {
            directory = new Map<string, boolean>()
            directoryList.set(dirOut, directory)
        }
        if (!isDir(dirOut)) {
            mkdirSync(dirOut)
        }
        if (isDir(pathIn)) {
            directory.set(file, true)
            copyFiles(sourceRoot, sourcePath.length === 0 ? file : `${sourcePath}${sep}${file}`)
            continue
        }
        if (
            file.endsWith(".modifier") ||
            file.endsWith(".target") ||
            file.endsWith(".obj") ||
            file.endsWith(".dae") ||
            file.endsWith(".bvh") ||
            file.endsWith(".json") ||
            file.endsWith(".mhskel") ||
            file.endsWith(".mhw") ||
            file.endsWith(".proxy") ||
            file.endsWith(".mhclo") ||
            file.endsWith(".mhmat") ||
            file.endsWith(".jsonw") ||
            file.endsWith(".mhuv") ||
            file.endsWith(".mhpose")
        ) {
            if (directory.has(file)) {
                console.warn(`file collision for ${fileOut}`)
            }
            directory.set(file, false)
            // console.log(`${pathIn} -> ${fileOut}.z`)
            const data = readFileSync(pathIn)
            const view = new Uint8Array(data)
            const compressed = zlibSync(view, { level: 9 })

            sizeUncompressed += data.length
            sizeCompressed += compressed.length
            writeFileSync(`${fileOut}.z`, compressed)
            continue
        }
        if (file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".tif") || file.endsWith(".bmp")) {
            if (directory.has(file)) {
                console.warn(`file collision for ${fileOut}`)
            }
            directory.set(file, false)
            const data = readFileSync(pathIn)
            sizeUncompressed += data.length
            sizeCompressed += data.length
            writeFileSync(fileOut, data)
        }
    }
}

function writeDirectoryList(directoryList: Map<string, Map<string, boolean>>) {
    directoryList.forEach((directory, path) => {
        writeFileSync(
            `${path}/directory.json`,
            JSON.stringify(Array.from(directory, ([file, isDir]) => ({ file, isDir })))
        )
    })
}

function exec(cmd: string): string {
    const r = execSync(cmd)
    const d = new TextDecoder()
    return d.decode(r)
}

function isDir(path: string) {
    try {
        return lstatSync(path).isDirectory()
    } catch (error) {
        if ((error as any).code === "ENOENT") {
            return false
        }
        throw error
    }
}

function bytes2megabytes(num: number) {
    return Math.round((num / 1024 / 1024 + Number.EPSILON) * 100) / 100
}

function isFile(path: string) {
    try {
        return lstatSync(path).isFile()
    } catch (error) {
        if ((error as any).code === "ENOENT") {
            return false
        }
        throw error
    }
}

const blendshapeNames = [
    "_neutral", // 0
    "browDownLeft", // 1
    "browDownRight", // 2
    "browInnerUp", // 3
    "browOuterUpLeft", // 4
    "browOuterUpRight", // 5
    "cheekPuff", // 6
    "cheekSquintLeft", // 7
    "cheekSquintRight", // 8
    "eyeBlinkLeft", // 9
    "eyeBlinkRight", // 10
    "eyeLookDownLeft", // 11
    "eyeLookDownRight", // 12
    "eyeLookInLeft", // 13
    "eyeLookInRight", // 14
    "eyeLookOutLeft", // 15
    "eyeLookOutRight", // 16
    "eyeLookUpLeft", // 17
    "eyeLookUpRight", // 18
    "eyeSquintLeft", // 19
    "eyeSquintRight", // 20
    "eyeWideLeft", // 21
    "eyeWideRight", // 22
    "jawForward", // 23
    "jawLeft", // 24
    "jawOpen", // 25
    "jawRight", // 26
    "mouthClose", // 27
    "mouthDimpleLeft", // 28
    "mouthDimpleRight", // 29
    "mouthFrownLeft", // 30
    "mouthFrownRight", // 31
    "mouthFunnel", // 32
    "mouthLeft", // 33
    "mouthLowerDownLeft", // 34
    "mouthLowerDownRight", // 35
    "mouthPressLeft", // 36
    "mouthPressRight", // 37
    "mouthPucker", // 38
    "mouthRight", // 39
    "mouthRollLower", // 40
    "mouthRollUpper", // 41
    "mouthShrugLower", // 42
    "mouthShrugUpper", // 43
    "mouthSmileLeft", // 44
    "mouthSmileRight", // 45
    "mouthStretchLeft", // 46
    "mouthStretchRight", // 47
    "mouthUpperUpLeft", // 48
    "mouthUpperUpRight", // 49
    "noseSneerLeft", // 50
    "noseSneerRight", // 51
]

// someone seems to have extracted the 52 blendshapes from Apple's ARKit as
// Wavefront OBJ files and someone else used them for documentation
async function downloadARKitFaceBlendshapes() {
    const url = "https://arkit-face-blendshapes.com"
    const dirOut = `base${sep}blendshapes${sep}arkit`

    let missing = false
    for (const name of blendshapeNames) {
        if (!isFile(`${dirOut}/${name}.obj`)) {
            missing = true
            break
        }
    }
    if (!missing) {
        return
    }
    mkdirSync(dirOut)

    const blendshapeUrl = `${url}/static/js/main.fdacbc90.chunk.js`
    const chunkResponse = await fetch(blendshapeUrl)
    const chunk = await chunkResponse.text()
    if (!chunkResponse.ok) {
        throw Error(`failed to fetch ${blendshapeUrl}: ${chunkResponse.status} ${chunkResponse.statusText} ${chunk}`)
    }
    const objFiles = chunk.match(/"static\/media\/[a-zA-Z]+\.[a-f0-9]+\.obj\"/g)!

    for (let filename of objFiles) {
        filename = filename.substring(1, filename.length - 1)
        let shortname = filename.match(/static\/media\/([a-zA-Z]+)\./)![1]

        if (isFile(`${dirOut}/${shortname}.obj`)) {
            continue
        }

        console.log(`download ${url}/${filename} to ${dirOut}/${shortname}.obj`)

        const objResponse = await fetch(`${url}/${filename}`)
        const obj = await objResponse.text()
        if (!objResponse.ok) {
            throw Error(`failed to fetch ${url}/${filename}: ${objResponse.status} ${objResponse.statusText} ${obj}`)
        }
        writeFileSync(`${dirOut}${sep}${shortname}.obj`, obj)
    }
}

async function downloadICTFaceKitBlendshapes() {
    const url = `https://github.com/ICT-VGL/ICT-FaceKit/raw/master/FaceXModel`
    const dirOut = `base${sep}blendshapes${sep}ict`
    if (!isDir(dirOut)) {
        mkdirSync(dirOut)
    }
    for (let dst of blendshapeNames) {
        let srcs: string[] | undefined
        if (["jawLeft", "jawRight", "mouthLeft", "mouthRight"].indexOf(dst) != -1) {
            srcs = [dst]
        }
        if (!srcs && dst === "browInnerUp") {
            srcs = ["browInnerUp_L", "browInnerUp_R"]
        }
        if (!srcs && dst === "cheekPuff") {
            srcs = ["cheekPuff_L", "cheekPuff_R"]
        }
        if (!srcs && dst === "_neutral") {
            srcs = ["generic_neutral_mesh"]
        }
        if (!srcs) {
            const m = dst.match(/(\w+)Left/)
            if (m !== null) {
                srcs = [`${m[1]}_L`]
            }
        }
        if (!srcs) {
            const m = dst.match(/(\w+)Right/)
            if (m !== null) {
                srcs = [`${m[1]}_R`]
            }
        }
        if (!srcs) {
            srcs = [dst]
        }
        for (const src of srcs) {
            if (srcs.length > 1) {
                dst = src
            }
            if (!isFile(`${dirOut}${dst!}.obj`)) {
                console.log(`download ${url}${sep}${src} to ${dirOut}/${dst}.obj`)

                const objResponse = await fetch(`${url}${sep}${src}.obj`)
                const obj = await objResponse.text()
                if (!objResponse.ok) {
                    throw Error(`failed to fetch ${url}${sep}${src}: ${objResponse.status} ${objResponse.statusText}`)
                }
                writeFileSync(`${dirOut}${sep}${dst}.obj`, obj)
            }
        }
    }
}

main()
