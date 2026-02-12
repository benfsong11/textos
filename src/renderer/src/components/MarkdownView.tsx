import { useState, useRef, useCallback, useEffect } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }): React.JSX.Element => (
    <a
      href={href}
      onClick={(e) => {
        if (!href) {
          return
        }

        const isHashLink = href.startsWith('#')
        const isExternalLink = /^https?:\/\//i.test(href) || href.startsWith('mailto:')

        if (isExternalLink) {
          e.preventDefault()
          e.stopPropagation()
          window.api.openExternal(href)
        } else if (isHashLink) {
          // Allow default browser behavior for in-page anchors (scroll to target),
          // but stop propagation so the click doesn't toggle edit mode.
          e.stopPropagation()
        } else {
          // Prevent Electron window from navigating away on relative/internal links.
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      {children}
    </a>
  )
}

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

  // Auto-resize: fill viewport at minimum, grow when content exceeds it
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const page = el.closest('.mdview-page') as HTMLElement
    if (!page) return

    // Collapse textarea so page height is determined by flex layout (viewport fill)
    el.style.height = '0'

    // Page fills viewport via flex:1; read its actual rendered height
    const pageStyle = getComputedStyle(page)
    const paddingTop = parseFloat(pageStyle.paddingTop) || 0
    const paddingBottom = parseFloat(pageStyle.paddingBottom) || 0
    const availableHeight = page.clientHeight - paddingTop - paddingBottom

    const contentHeight = el.scrollHeight

    // Fill viewport at minimum, grow with content
    el.style.height = Math.max(contentHeight, availableHeight) + 'px'
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
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  )
}
