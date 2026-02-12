import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PreviewProps {
  content: string
  onClick?: () => void
}

export default function Preview({ content, onClick }: PreviewProps): React.JSX.Element {
  return (
    <div className="preview" onClick={onClick}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  )
}
