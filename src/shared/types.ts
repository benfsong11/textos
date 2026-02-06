export interface FileData {
  content: string
  filePath: string | null
}

export interface ElectronAPI {
  openFile: () => Promise<FileData | null>
  saveFile: (content: string, filePath: string | null) => Promise<string | null>
}
