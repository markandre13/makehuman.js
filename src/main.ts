import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from "electron"
import * as fs from "fs"
import * as path from "path"

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
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

  app.on("activate", () => {
    // on macOS open a new window when activated while all are closed
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow()
  });
});

app.on("window-all-closed", () => {
  // on macOS keep running when all windows are closed
  if (process.platform !== "darwin") {
    app.quit()
  }
})

ipcMain.handle('readFileSync', (event: IpcMainInvokeEvent, path: string): string => {
  return fs.readFileSync(path).toString()
})
