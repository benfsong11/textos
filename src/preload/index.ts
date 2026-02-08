import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/types'

const api: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content, filePath) => ipcRenderer.invoke('file:save', content, filePath),
  saveFileAs: (content) => ipcRenderer.invoke('file:save-as', content),
  getSystemFonts: () => ipcRenderer.invoke('font:list'),
  confirmClose: () => ipcRenderer.send('app:close-confirmed'),
  onBeforeClose: (callback) => {
    const handler = (): void => callback()
    ipcRenderer.on('before-close', handler)
    return () => {
      ipcRenderer.removeListener('before-close', handler)
    }
  },
  onMenuAction: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string): void => callback(action)
    ipcRenderer.on('menu:action', handler)
    return () => {
      ipcRenderer.removeListener('menu:action', handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
