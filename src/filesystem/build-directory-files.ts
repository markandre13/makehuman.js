//
// create directory.json files for the webclient
//

import * as fs from 'fs'
import { zlibSync } from 'fflate'

const directoryFile = 'directory.json'

let sizeUncompressed = 0
let sizeCompressed = 0

function build(path: string) {
    let out = '[\n'
    for (const file of fs.readdirSync(path)) {
        if (file === directoryFile)
            continue
        const isDir = fs.lstatSync(`${path}/${file}`).isDirectory()
        if (out.length > 2)
            out += ',\n'
        out += `  {"file": "${file}", "isDir": ${isDir ? 'true' : 'false'}}`

        if (isDir) {
            build(`${path}/${file}`)
        } else
            if (
                file.endsWith(".modifier") ||
                file.endsWith(".target") ||
                file.endsWith(".obj") ||
                file.endsWith(".json") ||
                file.endsWith(".mhskel") ||
                file.endsWith(".mhw")
            ) {
                const data = fs.readFileSync(`${path}/${file}`)
                const view = new Uint8Array(data)
                const compressed = zlibSync(view, { level: 9 })

                sizeUncompressed += data.length
                sizeCompressed += compressed.length
                fs.writeFileSync(`${path}/${file}.z`, compressed)
            }
    }
    out += '\n]\n'
    fs.writeFileSync(`${path}/${directoryFile}`, out)
}

build('data')

console.log(`uncompressed: ${sizeUncompressed / 1024 / 1024}M, compressed: ${sizeCompressed / 1024 / 1024}M`)
