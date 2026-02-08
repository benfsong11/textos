import { useState, useEffect } from 'react'
import type { ViewMode } from '../../../shared/types'
import { useAppContext } from '../context/AppContext'
import SegmentedControl from './SegmentedControl'
import type { TextAlign } from '../../../shared/types'
import { SunIcon, MoonIcon, GearIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from './icons'

const viewOptions = [
  { value: 'edit' as const, label: '편집' },
  { value: 'preview' as const, label: '미리보기' },
  { value: 'pageview' as const, label: '페이지' }
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
  const { resolvedTheme, settings, updateSettings } = useAppContext()
  const fileName = filePath ? filePath.split(/[/\\]/).pop() ?? 'Untitled' : 'Untitled'
  const [fonts, setFonts] = useState<string[]>([])

  useEffect(() => {
    window.api.getSystemFonts().then(setFonts)
  }, [])

  const toggleTheme = (): void => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    updateSettings({ theme: next })
  }

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button onClick={onNewFile}>새 파일</button>
        <button onClick={onOpen}>열기</button>
        <button onClick={onSave}>저장</button>
        <button onClick={onSaveAs}>다른 이름으로 저장</button>
      </div>

      <div className="toolbar-group">
        <select
          value={settings.fontFamily}
          onChange={(e) => updateSettings({ fontFamily: e.target.value })}
          title="글꼴"
        >
          {fonts.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={8}
          max={72}
          step={1}
          value={settings.fontSize}
          onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
          title="글꼴 크기"
        />
      </div>

      <div className="toolbar-group">
        {(['left', 'center', 'right'] as TextAlign[]).map((align) => (
          <button
            key={align}
            className={`toolbar-icon-btn${settings.textAlign === align ? ' active' : ''}`}
            onClick={() => updateSettings({ textAlign: align })}
            title={align === 'left' ? '왼쪽 정렬' : align === 'center' ? '가운데 정렬' : '오른쪽 정렬'}
          >
            {align === 'left' && <AlignLeftIcon />}
            {align === 'center' && <AlignCenterIcon />}
            {align === 'right' && <AlignRightIcon />}
          </button>
        ))}
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
        <button className="toolbar-icon-btn" onClick={toggleTheme} title={resolvedTheme === 'dark' ? '라이트 모드' : '다크 모드'}>
          {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
        <button className="toolbar-icon-btn" onClick={onOpenSettings} title="설정">
          <GearIcon />
        </button>
      </div>
    </div>
  )
}
