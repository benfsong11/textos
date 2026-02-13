import { useEffect, useRef, useCallback } from 'react'
import HighlightBackdrop from './HighlightBackdrop'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  fontFamily: string
  fontSize: number
  textAlign: 'left' | 'center' | 'right'
  searchQuery?: string
  activeMatchIndex?: number
  onBlur?: () => void
  autoFocus?: boolean
}

export default function Editor({ content, onChange, fontFamily, fontSize, textAlign, searchQuery, activeMatchIndex, onBlur, autoFocus }: EditorProps): React.JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }, [])

  // Scroll to active match
  useEffect(() => {
    if (activeMatchIndex === undefined || activeMatchIndex < 0) return
    if (!backdropRef.current || !textareaRef.current) return
    requestAnimationFrame(() => {
      const activeMark = backdropRef.current?.querySelector('[data-match-active]') as HTMLElement
      if (!activeMark || !textareaRef.current) return
      const textarea = textareaRef.current
      const markTop = activeMark.offsetTop
      const markHeight = activeMark.offsetHeight
      textarea.scrollTop = Math.max(0, markTop - textarea.clientHeight / 2 + markHeight / 2)
      if (backdropRef.current) {
        backdropRef.current.scrollTop = textarea.scrollTop
      }
    })
  }, [activeMatchIndex])

  const textStyle: React.CSSProperties = { fontFamily, fontSize: `${fontSize}pt`, textAlign }

  return (
    <div className="editor-wrapper">
      {searchQuery && (
        <div ref={backdropRef} className="highlight-backdrop-scroll">
          <HighlightBackdrop content={content} searchQuery={searchQuery} activeMatchIndex={activeMatchIndex} style={textStyle} />
        </div>
      )}
      <textarea
        ref={textareaRef}
        className={`editor${searchQuery ? ' editor-transparent' : ''}`}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        onBlur={onBlur}
        placeholder="여기에 입력하세요..."
        spellCheck={false}
        style={textStyle}
      />
    </div>
  )
}
