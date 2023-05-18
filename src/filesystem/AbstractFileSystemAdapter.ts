export interface AbstractFileSystemAdapter {
    readFile(pathname: string): string
    exists(pathname: string): boolean
    isFile(pathname: string): boolean
    isDir(pathname: string): boolean
    listDir(pathname: string): string[]
    realPath(pathname: string): string
    joinPath(pathname1: string, pathname2: string): string
}
