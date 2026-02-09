import { useState, useRef, useCallback, useEffect } from 'react'
import Markdown from 'react-markdown'

interface MarkdownViewProps {
  content: string
  onChange: (content: string) => void
  fontFamily: string
  fontSize: number
  textAlign: 'left' | 'center' | 'right'
}

export default function MarkdownView({ content, onChange, fontFamily, fontSize, textAlign }: MarkdownViewProps): React.JSX.Element {
  const [editing, setEditing] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editing])

  // Auto-resize textarea to fit content (no internal scrollbar)
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [content, editing])

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      const active = document.activeElement
      if (active && active.closest('.toolbar')) return
      setEditing(false)
    }, 150)
  }, [])

  const handlePreviewClick = useCallback(() => {
    setEditing(true)
  }, [])

  return (
    <div className="mdview-container">
      <div className="mdview-page">
        {editing ? (
          <textarea
            ref={textareaRef}
            className="mdview-editor"
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="여기에 입력하세요..."
            spellCheck={false}
            style={{ fontFamily, fontSize: `${fontSize}pt`, textAlign }}
          />
        ) : (
          <div className="mdview-preview preview" onClick={handlePreviewClick}>
            <Markdown>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  )
}
