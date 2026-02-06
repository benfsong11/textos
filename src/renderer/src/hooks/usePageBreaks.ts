import { useMemo } from 'react'

const LINES_PER_PAGE = 41

export function usePageBreaks(content: string): string[] {
  return useMemo(() => {
    const lines = content.split('\n')
    const pages: string[] = []
    for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
      pages.push(lines.slice(i, i + LINES_PER_PAGE).join('\n'))
    }
    if (pages.length === 0) pages.push('')
    return pages
  }, [content])
}
