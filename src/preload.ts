import { ipcRenderer, contextBridge } from "electron"

contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer) // security leak
contextBridge.exposeInMainWorld('readFileSync', (path: string): Promise<string> => {
  return ipcRenderer.invoke('readFileSync', path)
})
