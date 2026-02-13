import { useRef, useEffect, useCallback, useMemo } from 'react'
import { usePageBreaks } from '../hooks/usePageBreaks'
import HighlightBackdrop from './HighlightBackdrop'

interface PageViewProps {
  content: string
  onChange?: (content: string) => void
  fontFamily: string
  fontSize: number
  textAlign: 'left' | 'center' | 'right'
  letterSpacing: number
  lineHeight: number
  searchQuery?: string
  activeMatchIndex?: number
}

export default function PageView({ content, onChange, fontFamily, fontSize, textAlign, letterSpacing, lineHeight, searchQuery, activeMatchIndex }: PageViewProps): React.JSX.Element {
  const pages = usePageBreaks(content, { fontSize, lineHeight })
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([])
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const cursorRef = useRef<{ absolutePos: number; pageIndex: number } | null>(null)

  // Compute the absolute offset where a given page starts
  const pageOffset = useCallback(
    (pageIndex: number): number => {
      let offset = 0
      for (let i = 0; i < pageIndex; i++) {
        offset += pages[i].length + 1 // +1 for the '\n' between pages
      }
      return offset
    },
    [pages]
  )

  // Compute matches per page and map global activeMatchIndex to (page, localIndex)
  const activeMatchMapping = useMemo(() => {
    if (activeMatchIndex === undefined || activeMatchIndex < 0 || !searchQuery) {
      return null
    }
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    let globalIdx = 0
    for (let p = 0; p < pages.length; p++) {
      const regex = new RegExp(escaped, 'gi')
      const matches = pages[p].match(regex)
      const count = matches ? matches.length : 0
      if (globalIdx + count > activeMatchIndex) {
        return { pageIndex: p, localIndex: activeMatchIndex - globalIdx }
      }
      globalIdx += count
    }
    return null
  }, [activeMatchIndex, searchQuery, pages])

  // Scroll to the page containing the active match
  useEffect(() => {
    if (!activeMatchMapping) return
    const pageEl = pageRefs.current[activeMatchMapping.pageIndex]
    if (pageEl) {
      pageEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [activeMatchMapping])

  // After content changes and re-pagination, restore cursor
  useEffect(() => {
    const cur = cursorRef.current
    if (!cur) return

    const { absolutePos } = cur

    // Find which page the cursor now falls on
    let remaining = absolutePos
    for (let i = 0; i < pages.length; i++) {
      if (remaining <= pages[i].length) {
        const ta = textareaRefs.current[i]
        if (ta) {
          ta.focus()
          ta.setSelectionRange(remaining, remaining)
        }
        cursorRef.current = null
        return
      }
      remaining -= pages[i].length + 1
    }

    // If past end, put cursor at end of last page
    const lastIdx = pages.length - 1
    const ta = textareaRefs.current[lastIdx]
    if (ta) {
      ta.focus()
      ta.setSelectionRange(pages[lastIdx].length, pages[lastIdx].length)
    }
    cursorRef.current = null
  }, [pages])

  const handleChange = (pageIndex: number, value: string): void => {
    if (!onChange) return

    const ta = textareaRefs.current[pageIndex]
    const localPos = ta?.selectionStart ?? 0

    const newPages = [...pages]
    newPages[pageIndex] = value
    const newContent = newPages.join('\n')

    const absPos = pageOffset(pageIndex) + localPos
    cursorRef.current = { absolutePos: absPos, pageIndex }

    onChange(newContent)
  }

  const handleKeyDown = (pageIndex: number, e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (!onChange) return

    const ta = e.currentTarget
    const pos = ta.selectionStart
    const end = ta.selectionEnd

    // Only handle when there's no selection
    if (pos !== end) return

    if (e.key === 'Backspace' && pos === 0 && pageIndex > 0) {
      e.preventDefault()
      const prevPage = pages[pageIndex - 1]
      const curPage = pages[pageIndex]
      const newPages = [...pages]
      newPages[pageIndex - 1] = prevPage + curPage
      newPages.splice(pageIndex, 1)
      const newContent = newPages.join('\n')

      cursorRef.current = { absolutePos: pageOffset(pageIndex) - 1, pageIndex: pageIndex - 1 }
      onChange(newContent)
      return
    }

    if (e.key === 'Delete' && pos === pages[pageIndex].length && pageIndex < pages.length - 1) {
      e.preventDefault()
      const curPage = pages[pageIndex]
      const nextPage = pages[pageIndex + 1]
      const newPages = [...pages]
      newPages[pageIndex] = curPage + nextPage
      newPages.splice(pageIndex + 1, 1)
      const newContent = newPages.join('\n')

      cursorRef.current = { absolutePos: pageOffset(pageIndex) + pos, pageIndex }
      onChange(newContent)
      return
    }

    if (e.key === 'ArrowUp' && pageIndex > 0) {
      const textBefore = pages[pageIndex].substring(0, pos)
      const firstNewline = textBefore.indexOf('\n')
      if (firstNewline === -1) {
        // Already on first line — move to previous page
        e.preventDefault()
        const prevPage = pages[pageIndex - 1]
        const lastNewline = prevPage.lastIndexOf('\n')
        const lastLineStart = lastNewline + 1
        const lastLineLen = prevPage.length - lastLineStart
        const col = pos
        const targetLocal = lastLineStart + Math.min(col, lastLineLen)

        cursorRef.current = { absolutePos: pageOffset(pageIndex - 1) + targetLocal, pageIndex: pageIndex - 1 }
        const prevTa = textareaRefs.current[pageIndex - 1]
        if (prevTa) {
          prevTa.focus()
          prevTa.setSelectionRange(targetLocal, targetLocal)
        }
      }
      return
    }

    if (e.key === 'ArrowDown' && pageIndex < pages.length - 1) {
      const textAfter = pages[pageIndex].substring(pos)
      const nextNewline = textAfter.indexOf('\n')
      if (nextNewline === -1) {
        // Already on last line — move to next page
        e.preventDefault()
        const curLineStart = pages[pageIndex].lastIndexOf('\n', pos - 1) + 1
        const col = pos - curLineStart
        const nextPage = pages[pageIndex + 1]
        const firstNewline = nextPage.indexOf('\n')
        const firstLineLen = firstNewline === -1 ? nextPage.length : firstNewline
        const targetLocal = Math.min(col, firstLineLen)

        cursorRef.current = { absolutePos: pageOffset(pageIndex + 1) + targetLocal, pageIndex: pageIndex + 1 }
        const nextTa = textareaRefs.current[pageIndex + 1]
        if (nextTa) {
          nextTa.focus()
          nextTa.setSelectionRange(targetLocal, targetLocal)
        }
      }
      return
    }
  }

  const pageTextStyle: React.CSSProperties = { fontFamily, fontSize: `${fontSize}pt`, textAlign, letterSpacing: `${letterSpacing}px`, lineHeight }

  return (
    <div className="pageview-container">
      {pages.map((page, i) => (
        <div key={i} className="pageview-page" ref={(el) => { pageRefs.current[i] = el }}>
          <div className="pageview-editable-wrapper">
            {searchQuery && (
              <HighlightBackdrop
                content={page}
                searchQuery={searchQuery}
                activeMatchIndex={activeMatchMapping?.pageIndex === i ? activeMatchMapping.localIndex : -1}
                style={pageTextStyle}
              />
            )}
            <textarea
              ref={(el) => {
                textareaRefs.current[i] = el
              }}
              className={`pageview-content pageview-editable${searchQuery ? ' editor-transparent' : ''}`}
              value={page}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              spellCheck={false}
              style={pageTextStyle}
            />
          </div>
          <span className="pageview-page-number">{i + 1}</span>
        </div>
      ))}
    </div>
  )
}
