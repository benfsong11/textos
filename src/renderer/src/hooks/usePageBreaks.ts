import { useMemo } from 'react'

interface PageBreakOptions {
  fontSize: number
  lineHeight: number
}

// A4: 297mm height - 20mm*2 padding = 257mm content area
const CONTENT_HEIGHT_MM = 257
// 1pt = 25.4/72 mm ≈ 0.3528mm
const PT_TO_MM = 25.4 / 72

export function usePageBreaks(content: string, options: PageBreakOptions): string[] {
  return useMemo(() => {
    const lineHeightMm = options.fontSize * PT_TO_MM * options.lineHeight
    const linesPerPage = Math.max(1, Math.floor(CONTENT_HEIGHT_MM / lineHeightMm))

    const lines = content.split('\n')
    const pages: string[] = []
    for (let i = 0; i < lines.length; i += linesPerPage) {
      pages.push(lines.slice(i, i + linesPerPage).join('\n'))
    }
    if (pages.length === 0) pages.push('')
    return pages
  }, [content, options.fontSize, options.lineHeight])
}
