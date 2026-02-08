interface EditorProps {
  content: string
  onChange: (content: string) => void
  fontFamily: string
  fontSize: number
}

export default function Editor({ content, onChange, fontFamily, fontSize }: EditorProps): React.JSX.Element {
  return (
    <textarea
      className="editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder="여기에 입력하세요..."
      spellCheck={false}
      style={{ fontFamily, fontSize: `${fontSize}px` }}
    />
  )
}
