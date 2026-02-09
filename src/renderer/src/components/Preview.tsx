import Markdown from 'react-markdown'

interface PreviewProps {
  content: string
  onClick?: () => void
}

export default function Preview({ content, onClick }: PreviewProps): React.JSX.Element {
  return (
    <div className="preview" onClick={onClick}>
      <Markdown>{content}</Markdown>
    </div>
  )
}
