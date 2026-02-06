import { useState } from 'react'
import Toolbar from './components/Toolbar'
import Editor from './components/Editor'
import Preview from './components/Preview'
import { useFile } from './hooks/useFile'

export default function App(): React.JSX.Element {
  const { content, filePath, setContent, openFile, saveFile } = useFile()
  const [isPreview, setIsPreview] = useState(false)

  return (
    <div className="app">
      <Toolbar
        filePath={filePath}
        isPreview={isPreview}
        onOpen={openFile}
        onSave={saveFile}
        onTogglePreview={() => setIsPreview((prev) => !prev)}
      />
      <div className="editor-container">
        {isPreview ? <Preview content={content} /> : <Editor content={content} onChange={setContent} />}
      </div>
    </div>
  )
}
