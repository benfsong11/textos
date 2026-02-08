import { useState, useEffect } from 'react'
import { useAppContext } from '../context/AppContext'

interface StatusBarProps {
  content: string
}

export default function StatusBar({ content }: StatusBarProps): React.JSX.Element {
  const { settings } = useAppContext()
  const [zoomPercent, setZoomPercent] = useState(100)

  useEffect(() => {
    const update = (): void => {
      setZoomPercent(Math.round(window.api.getZoomFactor() * 100))
    }
    update()
    const id = setInterval(update, 500)
    return () => clearInterval(id)
  }, [])

  const charCount =
    settings.charCountRule === 'without-spaces'
      ? content.replace(/\s/g, '').length
      : content.length

  return (
    <div className="status-bar">
      <span className="status-bar-item">줌: {zoomPercent}%</span>
      <span className="status-bar-item">글자 수: {charCount}자</span>
    </div>
  )
}
