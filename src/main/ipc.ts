import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { execSync } from 'child_process'
import type { FileData } from '../shared/types'

let cachedFonts: string[] | null = null

export function registerIpcHandlers(onCloseConfirmed: () => void): void {
  ipcMain.handle('font:list', async (): Promise<string[]> => {
    if (cachedFonts) return cachedFonts

    try {
      let output: string
      if (process.platform === 'darwin') {
        output = execSync(
          'osascript -l JavaScript -e \'ObjC.import("AppKit"); let fonts = $.NSFontManager.sharedFontManager.availableFontFamilies; let r = []; for (let i = 0; i < fonts.count; i++) r.push(fonts.objectAtIndex(i).js); r.join("\\n")\'',
          { encoding: 'utf-8', timeout: 10000 }
        )
      } else {
        output = execSync(
          'powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Drawing; (New-Object System.Drawing.Text.InstalledFontCollection).Families.Name"',
          { encoding: 'utf-8', timeout: 10000 }
        )
      }
      cachedFonts = output
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .sort()
    } catch {
      cachedFonts = process.platform === 'darwin'
        ? ['Arial', 'Helvetica', 'Menlo', 'Monaco', 'Georgia', 'Times New Roman', 'Verdana']
        : ['Arial', 'Consolas', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana']
    }

    return cachedFonts
  })
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
    'file:open-path',
    async (_event, filePath: string): Promise<FileData | null> => {
      try {
        const content = await readFile(filePath, 'utf-8')
        return { content, filePath }
      } catch {
        return null
      }
    }
  )

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

  ipcMain.handle(
    'file:save-as',
    async (_event, content: string): Promise<string | null> => {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) return null

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

  ipcMain.on('app:close-confirmed', () => {
    onCloseConfirmed()
  })
}
