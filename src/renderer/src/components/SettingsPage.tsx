import { useState, useEffect } from 'react'
import type { Theme, DefaultView } from '../../../shared/types'
import { useAppContext } from '../context/AppContext'
import SegmentedControl from './SegmentedControl'
import { ArrowLeftIcon } from './icons'

const themeOptions = [
  { value: 'light' as const, label: '라이트' },
  { value: 'dark' as const, label: '다크' },
  { value: 'system' as const, label: '시스템' }
]

const viewOptions = [
  { value: 'edit' as const, label: '편집 모드' },
  { value: 'pageview' as const, label: '페이지 뷰' }
]

export default function SettingsPage(): React.JSX.Element {
  const { settings, updateSettings, setCurrentPage } = useAppContext()
  const [fonts, setFonts] = useState<string[]>([])

  useEffect(() => {
    window.api.getSystemFonts().then(setFonts)
  }, [])

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={() => setCurrentPage('editor')} title="뒤로">
          <ArrowLeftIcon />
        </button>
        <h1 className="settings-title">설정</h1>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">외관</div>
        <div className="settings-card">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">테마</div>
              <div className="settings-row-description">원하는 색상 모드를 선택하세요</div>
            </div>
            <SegmentedControl<Theme>
              options={themeOptions}
              value={settings.theme}
              onChange={(theme) => updateSettings({ theme })}
            />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">편집기</div>
        <div className="settings-card">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">기본 보기</div>
              <div className="settings-row-description">새 파일을 열 때 기본 보기 모드</div>
            </div>
            <SegmentedControl<DefaultView>
              options={viewOptions}
              value={settings.defaultView}
              onChange={(defaultView) => updateSettings({ defaultView })}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">글꼴</div>
              <div className="settings-row-description">편집기에서 사용할 글꼴</div>
            </div>
            <select
              className="settings-select"
              value={settings.fontFamily}
              onChange={(e) => updateSettings({ fontFamily: e.target.value })}
            >
              {fonts.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">글꼴 크기</div>
              <div className="settings-row-description">편집기 텍스트 크기 (pt)</div>
            </div>
            <input
              className="settings-number-input"
              type="number"
              min={8}
              max={72}
              step={1}
              value={settings.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
