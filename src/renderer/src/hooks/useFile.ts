import { useState, useCallback, useRef } from 'react'

interface UseFileReturn {
  content: string
  filePath: string | null
  isDirty: boolean
  setContent: (content: string) => void
  openFile: () => Promise<void>
  saveFile: () => Promise<void>
  saveFileAs: () => Promise<void>
  newFile: () => void
}

export function useFile(): UseFileReturn {
  const [content, setContent] = useState('')
  const [filePath, setFilePath] = useState<string | null>(null)
  const lastSavedContent = useRef('')

  const isDirty = content !== lastSavedContent.current

  const openFile = useCallback(async () => {
    const result = await window.api.openFile()
    if (result) {
      setContent(result.content)
      setFilePath(result.filePath)
      lastSavedContent.current = result.content
    }
  }, [])

  const saveFile = useCallback(async () => {
    const savedPath = await window.api.saveFile(content, filePath)
    if (savedPath) {
      setFilePath(savedPath)
      lastSavedContent.current = content
    }
  }, [content, filePath])

  const saveFileAs = useCallback(async () => {
    const savedPath = await window.api.saveFileAs(content)
    if (savedPath) {
      setFilePath(savedPath)
      lastSavedContent.current = content
    }
  }, [content])

  const newFile = useCallback(() => {
    setContent('')
    setFilePath(null)
    lastSavedContent.current = ''
  }, [])

  return { content, filePath, isDirty, setContent, openFile, saveFile, saveFileAs, newFile }
}
