import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron"
import { IpcMainEvent } from "electron/main"
import * as fs from "fs"
import * as path from "path"

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      worldSafeExecuteJavaScript: true,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  })
  mainWindow.loadFile(path.join(__dirname, "../index.html"))
  mainWindow.webContents.openDevTools()
}

app.on("ready", () => {
  createWindow()

  // app.on("activate", () => {
  //   // on macOS open a new window when activated while all are closed
  //   if (BrowserWindow.getAllWindows().length === 0)
  //     createWindow()
  // })
})

app.on("window-all-closed", () => {
  // on macOS keep running when all windows are closed
  // if (process.platform !== "darwin") {
    app.quit()
  // }
})

ipcMain.on('readFile', (event: IpcMainEvent, pathname: string) => {
  event.returnValue = fs.readFileSync(pathname).toString()
})

ipcMain.on('isFile', (event: IpcMainEvent, pathname: string) => {
  event.returnValue =  fs.lstatSync(pathname).isFile()
})

ipcMain.on('isDir', (event: IpcMainEvent, pathname: string) => {
  event.returnValue =  fs.lstatSync(pathname).isDirectory()
})

ipcMain.on('listDir', (event: IpcMainEvent, pathname: string) => {
  event.returnValue =  fs.readdirSync(pathname)
})

ipcMain.on('listDir', (event: IpcMainEvent, pathname: string) => {
  // console.log(`main: listDir('${pathname}')`)
  event.returnValue = fs.readdirSync(pathname)
});

ipcMain.on('realPath', (event: IpcMainEvent, pathname: string) => {
  event.returnValue =  path.join(__dirname, "../data/"+pathname)
})

ipcMain.on('joinPath', (event: IpcMainEvent, pathname1: string, pathname2) => {
  event.returnValue =  path.join(pathname1, pathname2)
})
