import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('api', {
    readFile: (path: string): string => { return ipcRenderer.sendSync('readFile', path) },
    isFile: (path: string): boolean => { return ipcRenderer.sendSync('isFile', path) },
    isDir: (path: string): boolean => { return ipcRenderer.sendSync('isFile', path) },
    listDir: (path: string): string[] => { return ipcRenderer.sendSync('listDir', path) },
    realPath: (path: string): string => { return ipcRenderer.sendSync('realPath', path) },
    joinPath: (pathname0: string, pathname1: string): string => { return ipcRenderer.sendSync('joinPath', pathname0, pathname1) }
})
