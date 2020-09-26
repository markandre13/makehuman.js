
export interface FilesystemAdapter {
    readFile(pathname: string): string
    isFile(pathname: string): boolean;
    isDir(pathname: string): boolean;
    listDir(pathname: string): string[];
    realPath(pathname: string): string;
    joinPath(pathname1: string, pathname2: string): string;
}
