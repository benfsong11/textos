import { useState, useEffect, useRef, useCallback } from 'react'
import type { ViewMode } from '../../../shared/types'
import { useAppContext } from '../context/AppContext'
import type { TextAlign } from '../../../shared/types'
import { GearIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, SearchIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon } from './icons'

interface ToolbarProps {
  viewMode: ViewMode
  recentFiles: string[]
  onNewFile: () => void
  onOpen: () => void
  onOpenRecent: (filePath: string) => void
  onSave: () => void
  onSaveAs: () => void
  onOpenSettings: () => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  matchInfo: { current: number; total: number } | null
  onPrevMatch: () => void
  onNextMatch: () => void
}

export default function Toolbar({
  viewMode,
  recentFiles,
  onNewFile,
  onOpen,
  onOpenRecent,
  onSave,
  onSaveAs,
  onOpenSettings,
  searchQuery,
  onSearchQueryChange,
  matchInfo,
  onPrevMatch,
  onNextMatch
}: ToolbarProps): React.JSX.Element {
  const { settings, updateSettings } = useAppContext()

  const [fileMenuOpen, setFileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<'open' | null>(null)
  const fileMenuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    if (!fileMenuOpen) setActiveSubmenu(null)
  }, [fileMenuOpen])

  // Global Ctrl+F / Cmd+F focuses search input
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onSearchQueryChange('')
      searchInputRef.current?.blur()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        onPrevMatch()
      } else {
        onNextMatch()
      }
    }
  }, [onSearchQueryChange, onPrevMatch, onNextMatch])

  const handleSearchClear = useCallback(() => {
    onSearchQueryChange('')
    searchInputRef.current?.focus()
  }, [onSearchQueryChange])

  const closeMenu = (): void => {
    setFileMenuOpen(false)
    setActiveSubmenu(null)
  }

  const isMac = navigator.platform.startsWith('Mac')
  const mod = isMac ? '⌘' : 'Ctrl+'

  return (
    <div className="toolbar">
      <div className="toolbar-left">
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
      </div>

      <div className="toolbar-center">
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
      </div>

      <div className="toolbar-right">
        <div className="toolbar-search" onKeyDown={handleSearchKeyDown}>
          <span className="toolbar-search-icon"><SearchIcon /></span>
          <input
            ref={searchInputRef}
            className="toolbar-search-input"
            type="text"
            placeholder="검색"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
          />
          {searchQuery && (
            <div className="toolbar-search-nav">
              {matchInfo && (
                <span className="toolbar-search-count">
                  {matchInfo.total > 0 ? `${matchInfo.current + 1}/${matchInfo.total}` : '결과 없음'}
                </span>
              )}
              <button className="toolbar-search-nav-btn" onClick={onPrevMatch} disabled={!matchInfo || matchInfo.total === 0}>
                <ChevronUpIcon />
              </button>
              <button className="toolbar-search-nav-btn" onClick={onNextMatch} disabled={!matchInfo || matchInfo.total === 0}>
                <ChevronDownIcon />
              </button>
              <button className="toolbar-search-close" onClick={handleSearchClear}>
                <CloseIcon />
              </button>
            </div>
          )}
        </div>
        <button className="toolbar-icon-btn" onClick={onOpenSettings} title="설정">
          <GearIcon />
        </button>
      </div>
    </div>
  )
}
