import { fileURLToPath } from 'url'
import { AbstractFileSystemAdapter } from './AbstractFileSystemAdapter'

interface FileInfo {
    file: string
    isDir: boolean
    dir?: string[]
}

export class HTTPFSAdapter implements AbstractFileSystemAdapter {

    static path2info = new Map<string, FileInfo>()

    readFile(pathname: string): string {
        // console.log(`HTTPJSFSAdapter.readFile('${pathname}')`)
        const req = new XMLHttpRequest()
        req.open('GET', pathname, false)
        req.send(null)
    	if(req.status < 400)
		    return req.responseText
        throw new Error('Request failed: ' + req.statusText)
    }
    isFile(pathname: string): boolean {
        // console.log(`HTTPJSFSAdapter.isFile('${pathname}')`)
        let info = HTTPFSAdapter.path2info.get(pathname)
        if (info === undefined) {
            try {
                this.listDir(pathname)
            }
            catch(e) {
                console.log(`failed to load directory ${pathname}`)
                HTTPFSAdapter.path2info.forEach( (value, key) => console.log(key, value))
                throw Error()
            }
            info = HTTPFSAdapter.path2info.get(pathname)
        }
        if (info === undefined) {
            throw Error(`HTTPJSFSAdapter.isFile('${pathname}')`)
        }
        return !info.isDir
    }
    isDir(pathname: string): boolean {
        // console.log(`HTTPJSFSAdapter.isDir('${pathname}')`)
        const info = HTTPFSAdapter.path2info.get(pathname)
        if (info === undefined) {
            throw Error(`HTTPJSFSAdapter.isFile('${pathname}')`)
        }
        return info.isDir
    }
    listDir(pathname: string): string[] {
        // console.log(`HTTPJSFSAdapter.listDir('${pathname}')`)

        let info = HTTPFSAdapter.path2info.get(pathname)
        if (info !== undefined && info.dir !== undefined) {
            return info.dir
        }

        if (info === undefined)
            info = {file: '', isDir: true, dir: undefined}

        const d = this.readFile(`data/${pathname}/directory.json`)
        const j = JSON.parse(d)
        info.dir = []
        for(const x of j) {
            const fullfile = `${pathname}/${x.file}`
            // console.log(`${pathname}/${x.file}`)
            info.dir.push(x.file)
            if (!x.isDir)
                HTTPFSAdapter.path2info.set(fullfile, {file: x.file, isDir: false})
        }
        HTTPFSAdapter.path2info.set(pathname, info)
        return info.dir
    }
    realPath(pathname: string): string {
        // console.log(`HTTPJSFSAdapter.realPath('${pathname}')`)
        // throw Error()
        return pathname
    }
    joinPath(pathname1: string, pathname2: string): string { 
        // console.log(`HTTPJSFSAdapter.joinPath('${pathname1}', '${pathname2}')`)
        return `${pathname1}/${pathname2}`
    }
}
