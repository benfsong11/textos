interface ToolbarProps {
  filePath: string | null
  isPreview: boolean
  onOpen: () => void
  onSave: () => void
  onTogglePreview: () => void
}

export default function Toolbar({
  filePath,
  isPreview,
  onOpen,
  onSave,
  onTogglePreview
}: ToolbarProps): React.JSX.Element {
  const fileName = filePath ? filePath.split(/[/\\]/).pop() ?? 'Untitled' : 'Untitled'

  return (
    <div className="toolbar">
      <button onClick={onOpen}>Open</button>
      <button onClick={onSave}>Save</button>
      <button className={isPreview ? 'active' : ''} onClick={onTogglePreview}>
        {isPreview ? 'Edit' : 'Preview'}
      </button>
      <span className="title">{fileName}</span>
    </div>
  )
}
