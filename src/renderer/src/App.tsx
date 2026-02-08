import { useState, useEffect, useCallback, useRef } from 'react'
import type { ViewMode } from '../../shared/types'
import { useAppContext } from './context/AppContext'
import { useFile } from './hooks/useFile'
import { useMenuActions } from './hooks/useMenuActions'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import PageView from './components/PageView'
import StatusBar from './components/StatusBar'
import SettingsPage from './components/SettingsPage'
import Modal from './components/Modal'
import type { ModalAction } from './components/Modal'

type PendingAction = 'new-file' | 'open-file' | 'close-app' | null

export default function App(): React.JSX.Element {
  const { settings, currentPage, setCurrentPage } = useAppContext()
  const { content, filePath, isDirty, setContent, openFile, saveFile, saveFileAs, newFile } =
    useFile()
  const [viewMode, setViewMode] = useState<ViewMode>(settings.defaultView)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  // Keep refs for latest values accessible in callbacks
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  useEffect(() => {
    if (filePath && filePath.toLowerCase().endsWith('.txt')) {
      setViewMode('pageview')
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
    guardDirty('new-file', newFile)
  }, [guardDirty, newFile])

  const handleOpenFile = useCallback(() => {
    guardDirty('open-file', openFile)
  }, [guardDirty, openFile])

  const handleOpenSettings = useCallback(() => {
    setCurrentPage('settings')
  }, [setCurrentPage])

  // Modal: execute the pending action
  const executePendingAction = useCallback(async () => {
    const action = pendingAction
    setPendingAction(null)
    if (action === 'new-file') {
      newFile()
    } else if (action === 'open-file') {
      await openFile()
    } else if (action === 'close-app') {
      window.api.confirmClose()
    }
  }, [pendingAction, newFile, openFile])

  const handleSaveAndContinue = useCallback(async () => {
    await saveFile()
    await executePendingAction()
  }, [saveFile, executePendingAction])

  const handleDiscardAndContinue = useCallback(async () => {
    await executePendingAction()
  }, [executePendingAction])

  const handleCancelModal = useCallback(() => {
    setPendingAction(null)
  }, [])

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
    onViewPreview: () => setViewMode('preview'),
    onViewPageview: () => setViewMode('pageview')
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
        onNewFile={handleNewFile}
        onOpen={handleOpenFile}
        onSave={saveFile}
        onSaveAs={saveFileAs}
        onSetViewMode={setViewMode}
        onOpenSettings={handleOpenSettings}
      />
      <div className="editor-container">
        {viewMode === 'edit' && <Editor content={content} onChange={setContent} fontFamily={settings.fontFamily} fontSize={settings.fontSize} textAlign={settings.textAlign} />}
        {viewMode === 'preview' && <Preview content={content} />}
        {viewMode === 'pageview' && <PageView content={content} onChange={setContent} fontFamily={settings.fontFamily} fontSize={settings.fontSize} textAlign={settings.textAlign} letterSpacing={settings.letterSpacing} lineHeight={settings.lineHeight} />}
      </div>
      <StatusBar content={content} />

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
