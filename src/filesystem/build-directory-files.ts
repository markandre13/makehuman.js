//
// create directory.json files for the webclient
//

import * as fs from 'fs'

const directoryFile = 'directory.json'

function build(path: string) {
    let out = '[\n'
    for (const file of fs.readdirSync(path)) {
        if (file === directoryFile)
            continue
        const isDir = fs.lstatSync(`${path}/${file}`).isDirectory()
        if (out.length > 2)
            out += ',\n'
        out += `  {"file": "${file}", "isDir": ${isDir ? 'true' : 'false'}}`

        if (isDir)
            build(`${path}/${file}`)
    }
    out += '\n]\n'
    fs.writeFileSync(`${path}/${directoryFile}`, out)
}

build('data')
