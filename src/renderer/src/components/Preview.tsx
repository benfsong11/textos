import Markdown from 'react-markdown'

interface PreviewProps {
  content: string
}

export default function Preview({ content }: PreviewProps): React.JSX.Element {
  return (
    <div className="preview">
      <Markdown>{content}</Markdown>
    </div>
  )
}
