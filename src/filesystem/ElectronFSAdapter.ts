import { FilesystemAdapter } from "./FilesystemAdapter";

interface API {
    readFile(path: string): string
    isFile(path: string): boolean
    isDir(path: string): boolean
    listDir(path: string): string[]
    realPath(path: string): string
    joinPath(pathname0: string, pathname1: string): string
}

declare global {
    interface Window  {
        api: API
    }
}

export class ElectronFSAdapter implements FilesystemAdapter {
    readFile(pathname: string): string { return window.api.readFile(pathname) }
    isFile(pathname: string): boolean { return window.api.isFile(pathname) }
    isDir(pathname: string): boolean { return window.api.isDir(pathname) }
    listDir(pathname: string): string[] { return window.api.listDir(pathname) }
    realPath(pathname: string): string { return window.api.realPath(pathname) }
    joinPath(pathname1: string, pathname2: string): string { return window.api.joinPath(pathname1, pathname2) }
}
