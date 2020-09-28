import { AbstractFileSystemAdapter } from "./AbstractFileSystemAdapter"

export class FileSystemAdapter {
    private static instance?: AbstractFileSystemAdapter
    static setInstance(instance: AbstractFileSystemAdapter) {
        FileSystemAdapter.instance = instance
    }
    static getInstance(): AbstractFileSystemAdapter {
        if (FileSystemAdapter.instance === undefined)
            throw Error(`Missing call to FileSystemAdapter.setInstance(instance: AbstractFilesystemAdapter).`)
        return FileSystemAdapter.instance
    }
}
