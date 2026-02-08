import { useState, useEffect, useRef } from 'react'
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
  const rawName = filePath ? filePath.split(/[/\\]/).pop() ?? null : null
  const displayName = rawName ? rawName.replace(/\.[^.]+$/, '') : '빈 문서'
  const [fonts, setFonts] = useState<string[]>([])
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const fileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.api.getSystemFonts().then(setFonts)
  }, [])

  useEffect(() => {
    if (!fileMenuOpen) return
    const handleClick = (e: MouseEvent): void => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setFileMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [fileMenuOpen])

  const toggleTheme = (): void => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    updateSettings({ theme: next })
  }

  return (
    <div className="toolbar">
      <div className="toolbar-dropdown" ref={fileMenuRef}>
        <button onClick={() => setFileMenuOpen((v) => !v)}>파일</button>
        {fileMenuOpen && (
          <div className="toolbar-dropdown-menu">
            <button className="toolbar-dropdown-item" onClick={() => { onNewFile(); setFileMenuOpen(false) }}>새로 만들기</button>
            <button className="toolbar-dropdown-item" onClick={() => { onOpen(); setFileMenuOpen(false) }}>열기</button>
            <button className="toolbar-dropdown-item" onClick={() => { onSave(); setFileMenuOpen(false) }}>저장</button>
            <button className="toolbar-dropdown-item" onClick={() => { onSaveAs(); setFileMenuOpen(false) }}>다른 이름으로 저장</button>
          </div>
        )}
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
        <select
          className="toolbar-fontsize-select"
          value={settings.fontSize}
          onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
          title="글꼴 크기"
        >
          {(() => {
            const presets = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72]
            const sizes = presets.includes(settings.fontSize)
              ? presets
              : [...presets, settings.fontSize].sort((a, b) => a - b)
            return sizes.map((s) => (
              <option key={s} value={s}>{s}pt</option>
            ))
          })()}
        </select>
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

      <span className="toolbar-title" {...(filePath ? { title: filePath } : {})}>
        {displayName}
        {isDirty && <span className="toolbar-dirty">&nbsp;●</span>}
      </span>

      <div className="toolbar-spacer" />

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
