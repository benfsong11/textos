import { useState, useEffect } from 'react'
import type { Theme, DefaultView, CharCountRule } from '../../../shared/types'
import { useAppContext } from '../context/AppContext'
import SegmentedControl from './SegmentedControl'
import { CloseIcon } from './icons'

const themeOptions = [
  { value: 'light' as const, label: '라이트' },
  { value: 'dark' as const, label: '다크' },
  { value: 'system' as const, label: '시스템' }
]

const viewOptions = [
  { value: 'edit' as const, label: '일반' },
  { value: 'pageview' as const, label: '페이지' }
]

const charCountOptions = [
  { value: 'with-spaces' as const, label: '공백 포함' },
  { value: 'without-spaces' as const, label: '공백 미포함' }
]

interface SettingsPageProps {
  onClose: () => void
}

export default function SettingsPage({ onClose }: SettingsPageProps): React.JSX.Element {
  const { settings, updateSettings } = useAppContext()
  const [fonts, setFonts] = useState<string[]>([])

  useEffect(() => {
    window.api.getSystemFonts().then(setFonts)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="settings-modal">
        <div className="settings-header">
          <h1 className="settings-title">설정</h1>
          <button className="settings-close-btn" onClick={onClose} title="닫기">
            <CloseIcon />
          </button>
        </div>

        <div className="settings-body">
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
                <select
                  className="settings-select"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                >
                  {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72].map((s) => (
                    <option key={s} value={s}>{s}pt</option>
                  ))}
                </select>
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">글자 수 표시</div>
                  <div className="settings-row-description">상태 바에 표시할 글자 수 계산 방식</div>
                </div>
                <SegmentedControl<CharCountRule>
                  options={charCountOptions}
                  value={settings.charCountRule}
                  onChange={(charCountRule) => updateSettings({ charCountRule })}
                />
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">페이지 뷰</div>
            <div className="settings-card">
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">자간</div>
                  <div className="settings-row-description">글자 사이 간격 (px)</div>
                </div>
                <input
                  className="settings-number-input"
                  type="number"
                  min={-2}
                  max={10}
                  step={0.5}
                  value={settings.letterSpacing}
                  onChange={(e) => updateSettings({ letterSpacing: Number(e.target.value) })}
                />
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">줄 간격</div>
                  <div className="settings-row-description">줄 사이 간격 (배)</div>
                </div>
                <input
                  className="settings-number-input"
                  type="number"
                  min={1.0}
                  max={3.0}
                  step={0.1}
                  value={settings.lineHeight}
                  onChange={(e) => updateSettings({ lineHeight: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
