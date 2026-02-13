import { useState, useCallback, useRef } from 'react'

const RECENT_FILES_KEY = 'textos-recent-files'
const MAX_RECENT_FILES = 10

function loadRecentFiles(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_FILES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRecentFiles(files: string[]): void {
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files))
}

interface UseFileReturn {
  content: string
  filePath: string | null
  isDirty: boolean
  recentFiles: string[]
  setContent: (content: string) => void
  openFile: () => Promise<void>
  openFilePath: (path: string) => Promise<void>
  saveFile: (fileType?: 'txt' | 'md') => Promise<void>
  saveFileAs: (fileType?: 'txt' | 'md') => Promise<void>
  newFile: () => void
}

export function useFile(): UseFileReturn {
  const [content, setContent] = useState('')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [recentFiles, setRecentFiles] = useState<string[]>(loadRecentFiles)
  const lastSavedContent = useRef('')

  const isDirty = content !== lastSavedContent.current

  const addRecentFile = useCallback((path: string) => {
    setRecentFiles((prev) => {
      const filtered = prev.filter((p) => p !== path)
      const next = [path, ...filtered].slice(0, MAX_RECENT_FILES)
      saveRecentFiles(next)
      return next
    })
  }, [])

  const openFile = useCallback(async () => {
    const result = await window.api.openFile()
    if (result) {
      setContent(result.content)
      setFilePath(result.filePath)
      lastSavedContent.current = result.content
      if (result.filePath) addRecentFile(result.filePath)
    }
  }, [addRecentFile])

  const openFilePath = useCallback(async (path: string) => {
    const result = await window.api.openFilePath(path)
    if (result) {
      setContent(result.content)
      setFilePath(result.filePath)
      lastSavedContent.current = result.content
      addRecentFile(path)
    }
  }, [addRecentFile])

  const saveFile = useCallback(async (fileType?: 'txt' | 'md') => {
    const savedPath = await window.api.saveFile(content, filePath, fileType)
    if (savedPath) {
      setFilePath(savedPath)
      lastSavedContent.current = content
      addRecentFile(savedPath)
    }
  }, [content, filePath, addRecentFile])

  const saveFileAs = useCallback(async (fileType?: 'txt' | 'md') => {
    const savedPath = await window.api.saveFileAs(content, fileType)
    if (savedPath) {
      setFilePath(savedPath)
      lastSavedContent.current = content
      addRecentFile(savedPath)
    }
  }, [content, addRecentFile])

  const newFile = useCallback(() => {
    setContent('')
    setFilePath(null)
    lastSavedContent.current = ''
  }, [])

  return {
    content, filePath, isDirty, recentFiles,
    setContent, openFile, openFilePath, saveFile, saveFileAs, newFile
  }
}
