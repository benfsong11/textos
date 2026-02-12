import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const markdownComponents = {
  a: ({ href, children }: { href?: string; children?: React.ReactNode }): React.JSX.Element => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (href) window.api.openExternal(href)
      }}
    >
      {children}
    </a>
  )
}

interface PreviewProps {
  content: string
  onClick?: () => void
}

export default function Preview({ content, onClick }: PreviewProps): React.JSX.Element {
  return (
    <div className="preview" onClick={onClick}>
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</Markdown>
    </div>
  )
}
