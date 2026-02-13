import { useRef, useEffect, useCallback } from 'react'
import { SearchIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon } from './icons'

interface TitleBarProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  matchInfo: { current: number; total: number } | null
  onPrevMatch: () => void
  onNextMatch: () => void
}

export default function TitleBar({ searchQuery, onSearchQueryChange, matchInfo, onPrevMatch, onNextMatch }: TitleBarProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)

  // Global Ctrl+F / Cmd+F focuses input
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onSearchQueryChange('')
      inputRef.current?.blur()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        onPrevMatch()
      } else {
        onNextMatch()
      }
    }
  }, [onSearchQueryChange, onPrevMatch, onNextMatch])

  const handleClear = useCallback(() => {
    onSearchQueryChange('')
    inputRef.current?.focus()
  }, [onSearchQueryChange])

  return (
    <div className="titlebar">
      <div className="titlebar-search" onKeyDown={handleKeyDown}>
        <span className="titlebar-search-icon"><SearchIcon /></span>
        <input
          ref={inputRef}
          className="titlebar-search-input"
          type="text"
          placeholder="검색"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
        {searchQuery && (
          <div className="titlebar-search-nav">
            {matchInfo && (
              <span className="titlebar-search-count">
                {matchInfo.total > 0 ? `${matchInfo.current + 1}/${matchInfo.total}` : '결과 없음'}
              </span>
            )}
            <button className="titlebar-search-nav-btn" onClick={onPrevMatch} disabled={!matchInfo || matchInfo.total === 0}>
              <ChevronUpIcon />
            </button>
            <button className="titlebar-search-nav-btn" onClick={onNextMatch} disabled={!matchInfo || matchInfo.total === 0}>
              <ChevronDownIcon />
            </button>
            <button className="titlebar-search-close" onClick={handleClear}>
              <CloseIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
