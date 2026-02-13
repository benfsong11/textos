import { useAppContext } from '../context/AppContext'

interface StatusBarProps {
  content: string
  zoom: number
}

export default function StatusBar({ content, zoom }: StatusBarProps): React.JSX.Element {
  const { settings } = useAppContext()

  const charCount =
    settings.charCountRule === 'without-spaces'
      ? content.replace(/\s/g, '').length
      : content.length

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-bar-item">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="status-bar-center">
        <span className="status-bar-item">{charCount}자</span>
      </div>
      <div className="status-bar-right">
        <span className="status-bar-item">UTF-8</span>
      </div>
    </div>
  )
}
