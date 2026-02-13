import { app, BrowserWindow, Menu, shell } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'
import { registerIpcHandlers } from './ipc'
import { buildMenu } from './menu'

let mainWindow: BrowserWindow | null = null
let forceClose = false
let pendingFilePath: string | null = null

function getFilePathFromArgs(argv: string[]): string | null {
  const args = argv.slice(app.isPackaged ? 1 : 2)
  const filePath = args.find(arg => !arg.startsWith('-') && existsSync(arg))
  return filePath || null
}

pendingFilePath = getFilePathFromArgs(process.argv)

function sendPendingFile(): void {
  if (pendingFilePath && mainWindow) {
    mainWindow.webContents.send('file:open-from-argv', pendingFilePath)
    pendingFilePath = null
  }
}

function createWindow(): void {
  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    show: false,
    title: 'Textos',
    autoHideMenuBar: !isMac,
    icon: join(app.getAppPath(), 'resources', isMac ? 'app.png' : 'app.ico'),
    ...(isMac ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 16, y: 12 } } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.on('did-finish-load', () => {
    sendPendingFile()
  })

  mainWindow.on('close', (e) => {
    if (!forceClose) {
      e.preventDefault()
      mainWindow!.webContents.send('before-close')
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Single instance lock (Windows: second double-click sends argv here)
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    if (mainWindow) {
      const filePath = getFilePathFromArgs(argv)
      if (filePath) {
        mainWindow.webContents.send('file:open-from-argv', filePath)
      }
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // macOS: file opened via Finder
  app.on('open-file', (event, path) => {
    event.preventDefault()
    if (mainWindow) {
      mainWindow.webContents.send('file:open-from-argv', path)
    } else {
      pendingFilePath = path
    }
  })

  app.whenReady().then(() => {
    registerIpcHandlers(() => {
      forceClose = true
      mainWindow?.close()
    })

    Menu.setApplicationMenu(buildMenu())
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
