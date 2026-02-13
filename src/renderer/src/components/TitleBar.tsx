interface TitleBarProps {
  filePath: string | null
  isDirty: boolean
}

export default function TitleBar({ filePath, isDirty }: TitleBarProps): React.JSX.Element {
  const rawName = filePath ? filePath.split(/[/\\]/).pop() ?? null : null
  const displayName = rawName ?? '빈 문서'

  return (
    <div className="titlebar">
      <span className="titlebar-title" {...(filePath ? { title: filePath } : {})}>
        {displayName}
        {isDirty && <span className="titlebar-dirty">&nbsp;●</span>}
      </span>
    </div>
  )
}
