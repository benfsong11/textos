import { useState, useEffect } from 'react'
import type { ViewMode } from '../../shared/types'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import PageView from './components/PageView'
import { useFile } from './hooks/useFile'

export default function App(): React.JSX.Element {
  const { content, filePath, setContent, openFile, saveFile } = useFile()
  const [viewMode, setViewMode] = useState<ViewMode>('edit')

  useEffect(() => {
    if (filePath && filePath.toLowerCase().endsWith('.txt')) {
      setViewMode('pageview')
    }
  }, [filePath])

  return (
    <div className="app">
      <Toolbar
        filePath={filePath}
        viewMode={viewMode}
        onOpen={openFile}
        onSave={saveFile}
        onSetViewMode={setViewMode}
      />
      <div className="editor-container">
        {viewMode === 'edit' && <Editor content={content} onChange={setContent} />}
        {viewMode === 'preview' && <Preview content={content} />}
        {viewMode === 'pageview' && <PageView content={content} onChange={setContent} />}
      </div>
    </div>
  )
}
