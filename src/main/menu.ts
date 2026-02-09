import { Menu, BrowserWindow, app } from 'electron'
import type { MenuItemConstructorOptions } from 'electron'

function send(action: string): void {
  const win = BrowserWindow.getFocusedWindow()
  if (win) win.webContents.send('menu:action', action)
}

export function buildMenu(): Menu {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { label: '설정', accelerator: 'CmdOrCtrl+,' as const, click: () => send('open-settings') },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: '파일',
      submenu: [
        { label: '새 파일', accelerator: 'CmdOrCtrl+N', click: () => send('new-file') },
        { label: '열기', accelerator: 'CmdOrCtrl+O', click: () => send('open-file') },
        { type: 'separator' },
        { label: '저장', accelerator: 'CmdOrCtrl+S', click: () => send('save-file') },
        { label: '다른 이름으로 저장...', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('save-file-as') },
        ...(!isMac
          ? [
              { type: 'separator' as const },
              { label: '설정', accelerator: 'CmdOrCtrl+,' as const, click: () => send('open-settings') },
              { type: 'separator' as const },
              { role: 'close' as const }
            ]
          : [{ type: 'separator' as const }, { role: 'close' as const }])
      ]
    },
    {
      label: '편집',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [{ role: 'pasteAndMatchStyle' as const }] : []),
        { role: 'selectAll' }
      ]
    },
    {
      label: '보기',
      submenu: [
        { label: '편집 모드', accelerator: 'CmdOrCtrl+1', click: () => send('view-edit') },
        { label: '미리보기', accelerator: 'CmdOrCtrl+2', click: () => send('view-preview') },
        { label: '페이지 뷰', accelerator: 'CmdOrCtrl+3', click: () => send('view-pageview') },
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
