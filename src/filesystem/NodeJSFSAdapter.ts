import * as fs from 'fs'
import * as path from 'path'
import { FilesystemAdapter } from "./FilesystemAdapter";

class NodeJSFSAdapter implements FilesystemAdapter {
    readFile(pathname: string): string { return fs.readFileSync(pathname).toString("utf8") }
    isFile(pathname: string): boolean { return fs.lstatSync(pathname).isFile(); }
    isDir(pathname: string): boolean { return fs.lstatSync(pathname).isDirectory(); }
    listDir(pathname: string): string[] { return fs.readdirSync(pathname); }
    realPath(pathname: string): string { return path.join(__dirname, "../data/" + pathname); }
    joinPath(pathname1: string, pathname2: string): string { return path.join(pathname1, pathname2); }
}
