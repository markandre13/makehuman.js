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
    await downloadFaceBlendshapes()

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
    for (const file of readdirSync(source)) {
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

// someone seems to have extracted the 52 blendshapes from Apple's ARKit
// as Wavefront OBJ files.
async function downloadFaceBlendshapes() {
    const url = "https://arkit-face-blendshapes.com"
    const blendshapeUrl = `${url}/static/js/main.fdacbc90.chunk.js`

    const dirOut = "base/blendshapes"
    if (isDir(dirOut)) {
        return
    }

    mkdirSync(dirOut)
    const chunkResponse = await fetch(blendshapeUrl)
    const chunk = await chunkResponse.text()
    if (!chunkResponse.ok) {
        console.log(`failed to fetch ${blendshapeUrl}: ${chunkResponse.status} ${chunkResponse.statusText} ${chunk}`)
        return
    }
    const objFiles = chunk.match(/"static\/media\/[a-zA-Z]+\.[a-f0-9]+\.obj\"/g)!

    for (let filename of objFiles) {
        filename = filename.substring(1, filename.length - 1)
        let shortname = filename.match(/static\/media\/([a-zA-Z]+)\./)![1]
        console.log(`download ${url}/${filename} to ${dirOut}/${shortname}.obj`)

        const objResponse = await fetch(`${url}/${filename}`)
        const obj = await objResponse.text()
        if (!objResponse.ok) {
            console.log(`failed to fetch ${url}/${filename}: ${objResponse.status} ${objResponse.statusText} ${obj}`)
            return
        }
        writeFileSync(`${dirOut}/${shortname}.obj`, obj)
    }
}

main()
