import * as fs from 'fs'
import * as path from 'path'

// export class NodeJSFSAdapter implements AbstractFileSystemAdapter {
//     readFile(pathname: string): string { 
//         try {
//         return fs.readFileSync(pathname).toString("utf8")
//         }
//         catch(e) {
//             console.log(`### FAILED TO READ ${pathname}`)
//             throw e
//         }
//     }
//     isFile(pathname: string): boolean { return fs.lstatSync(pathname).isFile() }
//     isDir(pathname: string): boolean { return fs.lstatSync(pathname).isDirectory() }
//     listDir(pathname: string): string[] {
//         // console.log(`listDir('${pathname}')`)
//         return fs.readdirSync(pathname)
//     }
//     realPath(pathname: string): string {
//         const result = path.join(__dirname, "../../data/" + pathname)
//         // console.log(`realPath('${pathname}') -> '${result}' (__dirname='${__dirname}, __filename='${__filename}')`)
//         return result
//     }
//     joinPath(pathname1: string, pathname2: string): string { return path.join(pathname1, pathname2) }
// }

const directorFile = "directory.json"

function build(path: string) {
    let out = "[\n"
    for (let file of fs.readdirSync(path)) {
        if (file === directorFile)
            continue
        const isDir = fs.lstatSync(`${path}/${file}`).isDirectory()
        if (out.length > 2)
            out += ",\n"
        out += `  {"file": "${file}", "isDir": ${isDir ? "true" : "false"}}`

        if (isDir)
            build(`${path}/${file}`)
    }
    out += "\n]\n"
    fs.writeFileSync(`${path}/${directorFile}`, out)
}

build("data")

