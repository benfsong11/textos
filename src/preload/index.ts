import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../shared/types'

const api: ElectronAPI = {
  openFile: () => ipcRenderer.invoke('file:open'),
  saveFile: (content, filePath) => ipcRenderer.invoke('file:save', content, filePath)
}

contextBridge.exposeInMainWorld('api', api)
