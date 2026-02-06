import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import type { FileData } from '../shared/types'

export function registerIpcHandlers(): void {
  ipcMain.handle('file:open', async (): Promise<FileData | null> => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md', 'markdown'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    return { content, filePath }
  })

  ipcMain.handle(
    'file:save',
    async (_event, content: string, filePath: string | null): Promise<string | null> => {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return null

      if (filePath) {
        await writeFile(filePath, content, 'utf-8')
        return filePath
      }

      const result = await dialog.showSaveDialog(win, {
        filters: [
          { name: 'Text Files', extensions: ['txt', 'md', 'markdown'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })

      if (result.canceled || !result.filePath) return null

      await writeFile(result.filePath, content, 'utf-8')
      return result.filePath
    }
  )
}
