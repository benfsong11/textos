import { Menu, BrowserWindow } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'

function send(action: string): void {
  const win = BrowserWindow.getFocusedWindow()
  if (win) win.webContents.send('menu:action', action)
}

export function buildMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => send('new-file') },
        { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => send('open-file') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => send('save-file') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('save-file-as') },
        { type: 'separator' },
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => send('open-settings') },
        { type: 'separator' },
        { role: 'close' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Edit Mode', accelerator: 'CmdOrCtrl+1', click: () => send('view-edit') },
        { label: 'Preview', accelerator: 'CmdOrCtrl+2', click: () => send('view-preview') },
        { label: 'Page View', accelerator: 'CmdOrCtrl+3', click: () => send('view-pageview') },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { role: 'togglefullscreen' }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}
