import { useState, useCallback } from 'react'

interface UseFileReturn {
  content: string
  filePath: string | null
  setContent: (content: string) => void
  openFile: () => Promise<void>
  saveFile: () => Promise<void>
}

export function useFile(): UseFileReturn {
  const [content, setContent] = useState('')
  const [filePath, setFilePath] = useState<string | null>(null)

  const openFile = useCallback(async () => {
    const result = await window.api.openFile()
    if (result) {
      setContent(result.content)
      setFilePath(result.filePath)
    }
  }, [])

  const saveFile = useCallback(async () => {
    const savedPath = await window.api.saveFile(content, filePath)
    if (savedPath) {
      setFilePath(savedPath)
    }
  }, [content, filePath])

  return { content, filePath, setContent, openFile, saveFile }
}
