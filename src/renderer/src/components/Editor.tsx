interface EditorProps {
  content: string
  onChange: (content: string) => void
}

export default function Editor({ content, onChange }: EditorProps): React.JSX.Element {
  return (
    <textarea
      className="editor"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Start typing..."
      spellCheck={false}
    />
  )
}
