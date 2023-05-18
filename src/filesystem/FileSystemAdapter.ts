import { AbstractFileSystemAdapter } from './AbstractFileSystemAdapter'

export class FileSystemAdapter {
    private static instance?: AbstractFileSystemAdapter

    static setInstance(instance: AbstractFileSystemAdapter) {
        FileSystemAdapter.instance = instance
    }
    // static getInstance(): AbstractFileSystemAdapter {
    //     if (FileSystemAdapter.instance === undefined)
    //         throw Error('Missing call to FileSystemAdapter.setInstance(instance: AbstractFilesystemAdapter).')
    //     return FileSystemAdapter.instance 
    // }

    static readFile(pathname: string): string { return FileSystemAdapter.instance!.readFile(pathname)}
    static exists(pathname: string): boolean { return FileSystemAdapter.instance!.exists(pathname)}
    static isFile(pathname: string): boolean { return FileSystemAdapter.instance!.isFile(pathname)}
    static isDir(pathname: string): boolean { return FileSystemAdapter.instance!.isDir(pathname)}
    static listDir(pathname: string): string[] { return FileSystemAdapter.instance!.listDir(pathname)}
    static realPath(pathname: string): string { return FileSystemAdapter.instance!.realPath(pathname)}
    static joinPath(pathname1: string, pathname2: string): string { return FileSystemAdapter.instance!.joinPath(pathname1, pathname2)}
}
