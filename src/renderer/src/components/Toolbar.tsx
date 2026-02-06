import type { ViewMode } from '../../../shared/types'

interface ToolbarProps {
  filePath: string | null
  viewMode: ViewMode
  onOpen: () => void
  onSave: () => void
  onSetViewMode: (mode: ViewMode) => void
}

export default function Toolbar({
  filePath,
  viewMode,
  onOpen,
  onSave,
  onSetViewMode
}: ToolbarProps): React.JSX.Element {
  const fileName = filePath ? filePath.split(/[/\\]/).pop() ?? 'Untitled' : 'Untitled'

  return (
    <div className="toolbar">
      <button onClick={onOpen}>Open</button>
      <button onClick={onSave}>Save</button>
      <button
        className={viewMode === 'preview' ? 'active' : ''}
        onClick={() => onSetViewMode(viewMode === 'preview' ? 'edit' : 'preview')}
      >
        Preview
      </button>
      <button
        className={viewMode === 'pageview' ? 'active' : ''}
        onClick={() => onSetViewMode(viewMode === 'pageview' ? 'edit' : 'pageview')}
      >
        Page
      </button>
      <span className="title">{fileName}</span>
    </div>
  )
}
