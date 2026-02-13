import { useState, useEffect, useRef, useMemo } from 'react'
import type { ViewMode } from '../../../shared/types'
import { useAppContext } from '../context/AppContext'
import SegmentedControl from './SegmentedControl'
import type { TextAlign } from '../../../shared/types'
import { SunIcon, MoonIcon, GearIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon } from './icons'

interface ToolbarProps {
  filePath: string | null
  viewMode: ViewMode
  isDirty: boolean
  recentFiles: string[]
  fileType: 'txt' | 'md'
  onNewFile: () => void
  onOpen: () => void
  onOpenRecent: (filePath: string) => void
  onSave: () => void
  onSaveAs: () => void
  onSetViewMode: (mode: ViewMode) => void
  onOpenSettings: () => void
}

export default function Toolbar({
  filePath,
  viewMode,
  isDirty,
  recentFiles,
  fileType,
  onNewFile,
  onOpen,
  onOpenRecent,
  onSave,
  onSaveAs,
  onSetViewMode,
  onOpenSettings
}: ToolbarProps): React.JSX.Element {
  const { resolvedTheme, settings, updateSettings } = useAppContext()

  const viewOptions = useMemo(() => {
    if (fileType === 'txt') {
      return [
        { value: 'edit' as const, label: '일반' },
        { value: 'pageview' as const, label: '페이지' }
      ]
    }
    return [{ value: 'edit' as const, label: '서식' }]
  }, [fileType])
  const rawName = filePath ? filePath.split(/[/\\]/).pop() ?? null : null
  const displayName = rawName ? rawName.replace(/\.[^.]+$/, '') : '빈 문서'
  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<'open' | null>(null)
  const fileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!fileMenuOpen) return
    const handleClick = (e: MouseEvent): void => {
      if (fileMenuRef.current && !fileMenuRef.current.contains(e.target as Node)) {
        setFileMenuOpen(false)
        setActiveSubmenu(null)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [fileMenuOpen])

  // Close submenu when file menu closes
  useEffect(() => {
    if (!fileMenuOpen) setActiveSubmenu(null)
  }, [fileMenuOpen])

  const toggleTheme = (): void => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    updateSettings({ theme: next })
  }

  const closeMenu = (): void => {
    setFileMenuOpen(false)
    setActiveSubmenu(null)
  }

  const isMac = navigator.platform.startsWith('Mac')
  const mod = isMac ? '⌘' : 'Ctrl+'

  return (
    <div className="toolbar">
      <div className="toolbar-dropdown" ref={fileMenuRef}>
        <button onClick={() => setFileMenuOpen((v) => !v)}>파일</button>
        {fileMenuOpen && (
          <div className="toolbar-dropdown-menu">
            <button className="toolbar-dropdown-item" onClick={() => { onNewFile(); closeMenu() }}>새로 만들기<span className="toolbar-dropdown-shortcut">{mod}N</span></button>
            <div
              className="toolbar-dropdown-submenu-trigger"
              onMouseEnter={() => setActiveSubmenu('open')}
              onMouseLeave={() => setActiveSubmenu((v) => v === 'open' ? null : v)}
            >
              <button className="toolbar-dropdown-item toolbar-dropdown-item-arrow">열기</button>
              {activeSubmenu === 'open' && (
                <div className="toolbar-dropdown-submenu">
                  {recentFiles.length > 0 && (
                    <>
                      {recentFiles.map((path) => {
                        const name = path.split(/[/\\]/).pop() ?? path
                        return (
                          <button
                            key={path}
                            className="toolbar-dropdown-item"
                            title={path}
                            onClick={() => { onOpenRecent(path); closeMenu() }}
                          >
                            {name}
                          </button>
                        )
                      })}
                      <div className="toolbar-dropdown-divider" />
                    </>
                  )}
                  <button className="toolbar-dropdown-item" onClick={() => { onOpen(); closeMenu() }}>
                    모든 파일 보기<span className="toolbar-dropdown-shortcut">{mod}O</span>
                  </button>
                </div>
              )}
            </div>
            <button className="toolbar-dropdown-item" onClick={() => { onSave(); closeMenu() }}>저장<span className="toolbar-dropdown-shortcut">{mod}S</span></button>
            <button className="toolbar-dropdown-item" onClick={() => { onSaveAs(); closeMenu() }}>다른 이름으로 저장<span className="toolbar-dropdown-shortcut">{isMac ? '⇧⌘S' : 'Ctrl+Shift+S'}</span></button>
          </div>
        )}
      </div>

      <SegmentedControl<ViewMode>
        options={viewOptions}
        value={viewMode}
        onChange={onSetViewMode}
      />

      {viewMode === 'pageview' && (
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
      )}

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
