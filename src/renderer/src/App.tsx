import { useState, useEffect, useCallback, useRef } from 'react'
import type { ViewMode } from '../../shared/types'
import { useAppContext } from './context/AppContext'
import { useFile } from './hooks/useFile'
import { useMenuActions } from './hooks/useMenuActions'
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
type NewFilePrompt = boolean

export default function App(): React.JSX.Element {
  const { settings, currentPage, setCurrentPage } = useAppContext()
  const { content, filePath, isDirty, recentFiles, setContent, openFile, openFilePath, saveFile, saveFileAs, newFile } =
    useFile()
  const [viewMode, setViewModeRaw] = useState<ViewMode>(() => {
    if (settings.defaultView === 'last') {
      return (localStorage.getItem('textos-last-view') as ViewMode) || 'edit'
    }
    return settings.defaultView
  })
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeRaw(mode)
    localStorage.setItem('textos-last-view', mode)
  }, [])
  const [fileType, setFileType] = useState<'txt' | 'md'>('md')
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [pendingOpenRecent, setPendingOpenRecent] = useState<PendingOpenRecent>(null)
  const [showNewFilePrompt, setShowNewFilePrompt] = useState<NewFilePrompt>(true)
  const [fileReady, setFileReady] = useState(false)
  const [contentZoom, setContentZoom] = useState(1.0)

  // Keep refs for latest values accessible in callbacks
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty
  const fileTypeRef = useRef(fileType)
  fileTypeRef.current = fileType
  const contentZoomRef = useRef(contentZoom)
  contentZoomRef.current = contentZoom

  useEffect(() => {
    if (filePath) {
      const ext = filePath.toLowerCase().endsWith('.txt') ? 'txt' as const : 'md' as const
      if (ext !== fileTypeRef.current) {
        setFileType(ext)
        setViewMode(ext === 'txt' ? 'pageview' : 'edit')
      }
      setFileReady(true)
      setShowNewFilePrompt(false)
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

  const handleNewFile = useCallback(() => {
    guardDirty('new-file', () => {
      setShowNewFilePrompt(true)
    })
  }, [guardDirty])

  const handleNewFileSelect = useCallback((ext: 'txt' | 'md') => {
    setShowNewFilePrompt(false)
    setFileReady(true)
    newFile()
    setFileType(ext)
    setViewMode(ext === 'txt' ? 'pageview' : 'edit')
  }, [newFile])

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
      setShowNewFilePrompt(true)
    } else if (action === 'open-file') {
      if (recentPath) {
        await openFilePath(recentPath)
      } else {
        await openFile()
      }
    } else if (action === 'close-app') {
      window.api.confirmClose()
    }
  }, [pendingAction, pendingOpenRecent, newFile, openFile, openFilePath])

  const handleSaveAndContinue = useCallback(async () => {
    await saveFile()
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
    onSaveFile: saveFile,
    onSaveFileAs: saveFileAs,
    onOpenSettings: handleOpenSettings,
    onViewEdit: () => setViewMode('edit'),
    onViewPreview: () => { if (fileTypeRef.current === 'md') setViewMode('preview') },
    onViewPageview: () => { if (fileTypeRef.current === 'txt') setViewMode('pageview') },
    onZoomIn: () => applyZoom(0.1),
    onZoomOut: () => applyZoom(-0.1),
    onZoomReset: () => setContentZoom(1.0)
  })

  const modalActions: ModalAction[] = [
    { label: '저장', variant: 'primary', onClick: handleSaveAndContinue },
    { label: '저장 안 함', variant: 'danger', onClick: handleDiscardAndContinue },
    { label: '취소', variant: 'secondary', onClick: handleCancelModal }
  ]

  const handleCloseSettings = useCallback(() => {
    setCurrentPage('editor')
  }, [setCurrentPage])

  return (
    <div className="app">
      <Toolbar
        filePath={filePath}
        viewMode={viewMode}
        isDirty={isDirty}
        recentFiles={recentFiles}
        fileType={fileType}
        onNewFile={handleNewFile}
        onOpen={handleOpenFile}
        onOpenRecent={handleOpenRecent}
        onSave={saveFile}
        onSaveAs={saveFileAs}
        onSetViewMode={setViewMode}
        onOpenSettings={handleOpenSettings}
      />
      <div className="editor-container" style={{ zoom: contentZoom }}>
        {fileReady && (
          fileType === 'md' ? (
            <MarkdownView content={content} onChange={setContent} fontFamily={settings.fontFamily} fontSize={settings.fontSize} textAlign={settings.textAlign} />
          ) : (
            <>
              {viewMode === 'edit' && <Editor content={content} onChange={setContent} fontFamily={settings.fontFamily} fontSize={settings.fontSize} textAlign={settings.textAlign} />}
              {viewMode === 'pageview' && <PageView content={content} onChange={setContent} fontFamily={settings.fontFamily} fontSize={settings.fontSize} textAlign={settings.textAlign} letterSpacing={settings.letterSpacing} lineHeight={settings.lineHeight} />}
            </>
          )
        )}
      </div>
      <StatusBar content={content} zoom={contentZoom} />

      {currentPage === 'settings' && <SettingsPage onClose={handleCloseSettings} />}

      {showNewFilePrompt && (
        <Modal
          title="새로 만들기"
          message="어떤 형식의 문서를 만드시겠습니까?"
          actions={[
            { label: '빈 문서 (.txt)', variant: 'primary', onClick: () => handleNewFileSelect('txt') },
            { label: '빈 서식 문서 (.md)', variant: 'primary', onClick: () => handleNewFileSelect('md') },
            { label: '취소', variant: 'secondary', onClick: () => {
              if (!fileReady) {
                window.api.confirmClose()
              } else {
                setShowNewFilePrompt(false)
              }
            }}
          ]}
          onClose={() => {
            if (!fileReady) {
              window.api.confirmClose()
            } else {
              setShowNewFilePrompt(false)
            }
          }}
        />
      )}

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
