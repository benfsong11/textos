import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import type { ViewMode } from '../../shared/types'
import { useAppContext } from './context/AppContext'
import { useFile } from './hooks/useFile'
import { useMenuActions } from './hooks/useMenuActions'
import TitleBar from './components/TitleBar'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import PageView from './components/PageView'
import MarkdownView from './components/MarkdownView'
import StatusBar from './components/StatusBar'
import SettingsPage from './components/SettingsPage'
import Modal from './components/Modal'
import type { ModalAction } from './components/Modal'

type PendingAction = 'new-file' | 'open-file' | 'close-app' | null
type PendingOpenRecent = string | null

const LAST_FILE_TYPE_KEY = 'textos-last-file-type'

export default function App(): React.JSX.Element {
  const { settings, currentPage, setCurrentPage } = useAppContext()
  const { content, filePath, isDirty, recentFiles, setContent, openFile, openFilePath, saveFile, saveFileAs, newFile } =
    useFile()
  const [viewMode, setViewMode] = useState<ViewMode>(settings.defaultView)
  const [fileType, setFileTypeRaw] = useState<'txt' | 'md'>(() => {
    if (settings.defaultFileType === 'last') {
      return (localStorage.getItem(LAST_FILE_TYPE_KEY) as 'txt' | 'md') || 'txt'
    }
    return settings.defaultFileType
  })
  const setFileType = useCallback((ext: 'txt' | 'md') => {
    setFileTypeRaw(ext)
    localStorage.setItem(LAST_FILE_TYPE_KEY, ext)
  }, [])
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [pendingOpenRecent, setPendingOpenRecent] = useState<PendingOpenRecent>(null)
  const [fileReady, setFileReady] = useState(true)
  const [contentZoom, setContentZoom] = useState(1.0)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)

  // Keep refs for latest values accessible in callbacks
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty
  const fileTypeRef = useRef(fileType)
  fileTypeRef.current = fileType
  const contentZoomRef = useRef(contentZoom)
  contentZoomRef.current = contentZoom

  const resolveViewMode = useCallback((ext: 'txt' | 'md'): ViewMode => {
    if (ext === 'md') return 'edit'
    return settings.defaultView
  }, [settings.defaultView])

  // Sync viewMode when settings.defaultView changes
  useEffect(() => {
    if (fileType !== 'md') {
      setViewMode(settings.defaultView)
    }
  }, [settings.defaultView])

  useEffect(() => {
    if (filePath) {
      const ext = filePath.toLowerCase().endsWith('.txt') ? 'txt' as const : 'md' as const
      if (ext !== fileTypeRef.current) {
        setFileType(ext)
        setViewMode(resolveViewMode(ext))
      }
      setFileReady(true)
    }
  }, [filePath])

  // Guard: if dirty, show modal; otherwise run action directly
  const guardDirty = useCallback(
    (action: PendingAction, directAction: () => void) => {
      if (isDirtyRef.current) {
        setPendingAction(action)
      } else {
        directAction()
      }
    },
    []
  )

  const createNewFile = useCallback(() => {
    const ext = settings.defaultFileType === 'last'
      ? (localStorage.getItem(LAST_FILE_TYPE_KEY) as 'txt' | 'md') || 'txt'
      : settings.defaultFileType
    setFileReady(true)
    newFile()
    setFileType(ext)
    setViewMode(resolveViewMode(ext))
  }, [newFile, settings.defaultFileType, setFileType, setViewMode, resolveViewMode])

  const handleNewFile = useCallback(() => {
    guardDirty('new-file', createNewFile)
  }, [guardDirty, createNewFile])

  const handleOpenFile = useCallback(() => {
    guardDirty('open-file', openFile)
  }, [guardDirty, openFile])

  const handleOpenRecent = useCallback((path: string) => {
    if (isDirtyRef.current) {
      setPendingOpenRecent(path)
      setPendingAction('open-file')
    } else {
      openFilePath(path)
    }
  }, [openFilePath])

  const handleOpenSettings = useCallback(() => {
    setCurrentPage('settings')
  }, [setCurrentPage])

  // Modal: execute the pending action
  const executePendingAction = useCallback(async () => {
    const action = pendingAction
    const recentPath = pendingOpenRecent
    setPendingAction(null)
    setPendingOpenRecent(null)
    if (action === 'new-file') {
      createNewFile()
    } else if (action === 'open-file') {
      if (recentPath) {
        await openFilePath(recentPath)
      } else {
        await openFile()
      }
    } else if (action === 'close-app') {
      window.api.confirmClose()
    }
  }, [pendingAction, pendingOpenRecent, createNewFile, openFile, openFilePath])

  const handleSaveAndContinue = useCallback(async () => {
    await saveFile(fileTypeRef.current)
    await executePendingAction()
  }, [saveFile, executePendingAction])

  const handleDiscardAndContinue = useCallback(async () => {
    await executePendingAction()
  }, [executePendingAction])

  const handleCancelModal = useCallback(() => {
    setPendingAction(null)
    setPendingOpenRecent(null)
  }, [])

  // Set platform attribute for CSS
  useEffect(() => {
    if (navigator.platform.includes('Mac')) {
      document.body.dataset.platform = 'darwin'
    }
  }, [])

  // Search: compute match count
  const matchCount = useMemo(() => {
    if (!searchQuery) return 0
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matches = content.match(new RegExp(escaped, 'gi'))
    return matches ? matches.length : 0
  }, [content, searchQuery])

  // Reset match index when query changes
  useEffect(() => {
    if (!searchQuery || matchCount === 0) {
      setCurrentMatchIndex(-1)
    } else {
      setCurrentMatchIndex(0)
    }
  }, [searchQuery])

  // Clamp match index when content changes while searching
  useEffect(() => {
    setCurrentMatchIndex(prev => {
      if (matchCount === 0) return -1
      if (prev >= matchCount) return matchCount - 1
      if (prev < 0) return 0
      return prev
    })
  }, [matchCount])

  const handleNextMatch = useCallback(() => {
    if (matchCount === 0) return
    setCurrentMatchIndex(prev => (prev + 1) % matchCount)
  }, [matchCount])

  const handlePrevMatch = useCallback(() => {
    if (matchCount === 0) return
    setCurrentMatchIndex(prev => (prev - 1 + matchCount) % matchCount)
  }, [matchCount])

  const handleSearchFocus = useCallback(() => {
    // Triggered by menu 'find' action — just focus the input (handled by TitleBar's Ctrl+F)
  }, [])

  const applyZoom = useCallback((delta: number) => {
    const current = contentZoomRef.current
    const next = Math.min(3.0, Math.max(0.5, Math.round((current + delta) * 10) / 10))
    setContentZoom(next)
  }, [])

  // Ctrl + mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent): void => {
      if (!e.ctrlKey) return
      e.preventDefault()
      applyZoom(e.deltaY > 0 ? -0.1 : 0.1)
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [applyZoom])

  // Listen for file open from argv (double-click / file association)
  useEffect(() => {
    const cleanup = window.api.onOpenFileFromArgv((path) => {
      openFilePath(path)
    })
    return cleanup
  }, [openFilePath])

  // Listen for before-close from main process
  useEffect(() => {
    const cleanup = window.api.onBeforeClose(() => {
      if (isDirtyRef.current) {
        setPendingAction('close-app')
      } else {
        window.api.confirmClose()
      }
    })
    return cleanup
  }, [])

  // Menu actions
  useMenuActions({
    onNewFile: handleNewFile,
    onOpenFile: handleOpenFile,
    onSaveFile: () => saveFile(fileTypeRef.current),
    onSaveFileAs: () => saveFileAs(fileTypeRef.current),
    onOpenSettings: handleOpenSettings,
    onZoomIn: () => applyZoom(0.1),
    onZoomOut: () => applyZoom(-0.1),
    onZoomReset: () => setContentZoom(1.0),
    onFind: handleSearchFocus
  })

  const modalActions: ModalAction[] = [
    { label: '저장', variant: 'primary', onClick: handleSaveAndContinue },
    { label: '저장 안 함', variant: 'danger', onClick: handleDiscardAndContinue },
    { label: '취소', variant: 'secondary', onClick: handleCancelModal }
  ]

  const handleCloseSettings = useCallback(() => {
    setCurrentPage('editor')
  }, [setCurrentPage])

  const activeSearchQuery = searchQuery || undefined
  const activeMatchIdx = searchQuery && currentMatchIndex >= 0 ? currentMatchIndex : undefined

  return (
    <div className="app">
      <TitleBar
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        matchInfo={searchQuery ? { current: currentMatchIndex, total: matchCount } : null}
        onPrevMatch={handlePrevMatch}
        onNextMatch={handleNextMatch}
      />
      <Toolbar
        filePath={filePath}
        viewMode={viewMode}
        isDirty={isDirty}
        recentFiles={recentFiles}
        onNewFile={handleNewFile}
        onOpen={handleOpenFile}
        onOpenRecent={handleOpenRecent}
        onSave={() => saveFile(fileTypeRef.current)}
        onSaveAs={() => saveFileAs(fileTypeRef.current)}
        onOpenSettings={handleOpenSettings}
      />
      <div className="editor-container" style={{ zoom: contentZoom }}>
        {fileReady && (
          fileType === 'md' ? (
            <MarkdownView content={content} onChange={setContent} fontFamily={settings.fontFamily} fontSize={settings.fontSize} textAlign={settings.textAlign} searchQuery={activeSearchQuery} activeMatchIndex={activeMatchIdx} />
          ) : (
            <>
              {viewMode === 'edit' && <Editor content={content} onChange={setContent} fontFamily={settings.fontFamily} fontSize={settings.fontSize} textAlign={settings.textAlign} searchQuery={activeSearchQuery} activeMatchIndex={activeMatchIdx} />}
              {viewMode === 'pageview' && <PageView content={content} onChange={setContent} fontFamily={settings.fontFamily} fontSize={settings.fontSize} textAlign={settings.textAlign} letterSpacing={settings.letterSpacing} lineHeight={settings.lineHeight} searchQuery={activeSearchQuery} activeMatchIndex={activeMatchIdx} />}
            </>
          )
        )}
      </div>
      <StatusBar content={content} zoom={contentZoom} searchMatchCount={searchQuery ? matchCount : undefined} />

      {currentPage === 'settings' && <SettingsPage onClose={handleCloseSettings} />}

      {pendingAction && (
        <Modal
          title="저장되지 않은 변경 사항"
          message="저장되지 않은 변경 사항이 있습니다. 계속하기 전에 저장하시겠습니까?"
          actions={modalActions}
          onClose={handleCancelModal}
        />
      )}
    </div>
  )
}
