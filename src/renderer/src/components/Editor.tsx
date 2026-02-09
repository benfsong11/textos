import { useEffect, useRef } from 'react'

interface EditorProps {
  content: string
  onChange: (content: string) => void
  fontFamily: string
  fontSize: number
  textAlign: 'left' | 'center' | 'right'
  onBlur?: () => void
  autoFocus?: boolean
}

export default function Editor({ content, onChange, fontFamily, fontSize, textAlign, onBlur, autoFocus }: EditorProps): React.JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  return (
    <textarea
      ref={textareaRef}
      className="editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder="여기에 입력하세요..."
      spellCheck={false}
      style={{ fontFamily, fontSize: `${fontSize}pt`, textAlign }}
    />
  )
}
