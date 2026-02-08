import type { ViewMode } from '../../../shared/types'
import { useAppContext } from '../context/AppContext'
import SegmentedControl from './SegmentedControl'
import { SunIcon, MoonIcon, GearIcon } from './icons'

const viewOptions = [
  { value: 'edit' as const, label: 'Edit' },
  { value: 'preview' as const, label: 'Preview' },
  { value: 'pageview' as const, label: 'Page' }
]

interface ToolbarProps {
  filePath: string | null
  viewMode: ViewMode
  isDirty: boolean
  onNewFile: () => void
  onOpen: () => void
  onSave: () => void
  onSaveAs: () => void
  onSetViewMode: (mode: ViewMode) => void
  onOpenSettings: () => void
}

export default function Toolbar({
  filePath,
  viewMode,
  isDirty,
  onNewFile,
  onOpen,
  onSave,
  onSaveAs,
  onSetViewMode,
  onOpenSettings
}: ToolbarProps): React.JSX.Element {
  const { resolvedTheme, updateSettings } = useAppContext()
  const fileName = filePath ? filePath.split(/[/\\]/).pop() ?? 'Untitled' : 'Untitled'

  const toggleTheme = (): void => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    updateSettings({ theme: next })
  }

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button onClick={onNewFile}>New</button>
        <button onClick={onOpen}>Open</button>
        <button onClick={onSave}>Save</button>
        <button onClick={onSaveAs}>Save As</button>
      </div>

      <SegmentedControl<ViewMode>
        options={viewOptions}
        value={viewMode}
        onChange={onSetViewMode}
      />

      <div className="toolbar-spacer" />

      <span className="toolbar-title">
        {fileName}
        {isDirty && <span className="toolbar-dirty">&nbsp;●</span>}
      </span>

      <div className="toolbar-group">
        <button className="toolbar-icon-btn" onClick={toggleTheme} title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className="toolbar-icon-btn" onClick={onOpenSettings} title="Settings">
          <GearIcon />
        </button>
      </div>
    </div>
  )
}
