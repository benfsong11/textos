export type ViewMode = 'edit' | 'preview' | 'pageview'

export type Theme = 'light' | 'dark' | 'system'

export type DefaultView = 'edit' | 'pageview'

export type AppPage = 'editor' | 'settings'

export interface AppSettings {
  theme: Theme
  defaultView: DefaultView
}

export interface FileData {
  content: string
  filePath: string | null
}

export interface ElectronAPI {
  openFile: () => Promise<FileData | null>
  saveFile: (content: string, filePath: string | null) => Promise<string | null>
  saveFileAs: (content: string) => Promise<string | null>
  confirmClose: () => void
  onBeforeClose: (callback: () => void) => () => void
  onMenuAction: (callback: (action: string) => void) => () => void
}
