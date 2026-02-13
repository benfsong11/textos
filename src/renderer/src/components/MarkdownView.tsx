import { useState, useRef, useCallback, useEffect } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import HighlightBackdrop from './HighlightBackdrop'

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
          e.stopPropagation()
        } else {
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
  searchQuery?: string
  activeMatchIndex?: number
}

export default function MarkdownView({ content, onChange, fontFamily, fontSize, textAlign, searchQuery, activeMatchIndex }: MarkdownViewProps): React.JSX.Element {
  const [editing, setEditing] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

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

    el.style.height = '0'

    const pageStyle = getComputedStyle(page)
    const paddingTop = parseFloat(pageStyle.paddingTop) || 0
    const paddingBottom = parseFloat(pageStyle.paddingBottom) || 0
    const availableHeight = page.clientHeight - paddingTop - paddingBottom

    const contentHeight = el.scrollHeight

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

  // Highlight search matches in preview DOM
  useEffect(() => {
    if (editing || !previewRef.current || !searchQuery) return
    const el = previewRef.current
    // Remove existing marks
    el.querySelectorAll('mark.search-highlight').forEach((mark) => {
      const parent = mark.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark)
        parent.normalize()
      }
    })
    // Walk text nodes and wrap matches
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'gi')
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const textNodes: Text[] = []
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text)
    }
    let globalMatchIdx = 0
    for (const node of textNodes) {
      const text = node.textContent || ''
      if (!regex.test(text)) continue
      regex.lastIndex = 0
      const frag = document.createDocumentFragment()
      let lastIdx = 0
      let m: RegExpExecArray | null
      while ((m = regex.exec(text)) !== null) {
        if (m.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)))
        }
        const mark = document.createElement('mark')
        mark.className = globalMatchIdx === activeMatchIndex
          ? 'search-highlight search-highlight-active'
          : 'search-highlight'
        if (globalMatchIdx === activeMatchIndex) {
          mark.dataset.matchActive = ''
        }
        mark.textContent = m[0]
        frag.appendChild(mark)
        globalMatchIdx++
        lastIdx = regex.lastIndex
        if (m[0].length === 0) regex.lastIndex++
      }
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)))
      }
      node.parentNode?.replaceChild(frag, node)
    }
  }, [editing, searchQuery, content, activeMatchIndex])

  // Scroll to active match
  useEffect(() => {
    if (activeMatchIndex === undefined || activeMatchIndex < 0) return

    requestAnimationFrame(() => {
      if (editing) {
        // Edit mode: find mark in backdrop, scroll editor-container
        const wrapper = wrapperRef.current
        if (!wrapper) return
        const mark = wrapper.querySelector('[data-match-active]') as HTMLElement
        if (!mark) return
        const scrollContainer = wrapper.closest('.editor-container') as HTMLElement
        if (!scrollContainer) return
        const markRect = mark.getBoundingClientRect()
        const containerRect = scrollContainer.getBoundingClientRect()
        scrollContainer.scrollTop += markRect.top - containerRect.top - containerRect.height / 2 + mark.offsetHeight / 2
      } else {
        // Preview mode: find mark in preview DOM
        const preview = previewRef.current
        if (!preview) return
        const mark = preview.querySelector('[data-match-active]') as HTMLElement
        if (mark) {
          mark.scrollIntoView({ block: 'center' })
        }
      }
    })
  }, [activeMatchIndex, editing])

  const textStyle: React.CSSProperties = { fontFamily, fontSize: `${fontSize}pt`, textAlign }

  return (
    <div className="mdview-container">
      <div className="mdview-page">
        {editing ? (
          <div className="mdview-editor-wrapper" ref={wrapperRef}>
            {searchQuery && (
              <HighlightBackdrop content={content} searchQuery={searchQuery} activeMatchIndex={activeMatchIndex} style={textStyle} />
            )}
            <textarea
              ref={textareaRef}
              className={`mdview-editor${searchQuery ? ' editor-transparent' : ''}`}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onBlur={handleBlur}
              placeholder="여기에 입력하세요..."
              spellCheck={false}
              style={textStyle}
            />
          </div>
        ) : (
          <div ref={previewRef} className="mdview-preview preview" onClick={handlePreviewClick}>
            <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</Markdown>
          </div>
        )}
      </div>
    </div>
  )
}
