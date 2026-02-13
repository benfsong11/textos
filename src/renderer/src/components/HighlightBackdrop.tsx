import { useMemo } from 'react'

interface HighlightBackdropProps {
  content: string
  searchQuery: string
  activeMatchIndex?: number
  style?: React.CSSProperties
}

export default function HighlightBackdrop({ content, searchQuery, activeMatchIndex = -1, style }: HighlightBackdropProps): React.JSX.Element | null {
  const parts = useMemo(() => {
    if (!searchQuery) return null

    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'gi')
    const result: { text: string; highlight: boolean; matchIndex: number }[] = []
    let lastIndex = 0
    let matchCount = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({ text: content.slice(lastIndex, match.index), highlight: false, matchIndex: -1 })
      }
      result.push({ text: match[0], highlight: true, matchIndex: matchCount })
      matchCount++
      lastIndex = regex.lastIndex
      if (match[0].length === 0) {
        regex.lastIndex++
      }
    }
    if (lastIndex < content.length) {
      result.push({ text: content.slice(lastIndex), highlight: false, matchIndex: -1 })
    }
    return result.length > 0 ? result : null
  }, [content, searchQuery])

  if (!parts) return null

  return (
    <div className="highlight-backdrop" aria-hidden="true" style={style}>
      {parts.map((part, i) =>
        part.highlight
          ? <mark
              key={i}
              className={`search-highlight${part.matchIndex === activeMatchIndex ? ' search-highlight-active' : ''}`}
              {...(part.matchIndex === activeMatchIndex ? { 'data-match-active': '' } : {})}
            >{part.text}</mark>
          : <span key={i}>{part.text}</span>
      )}
    </div>
  )
}
