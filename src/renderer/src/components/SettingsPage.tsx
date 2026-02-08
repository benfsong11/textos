import type { Theme, DefaultView } from '../../../shared/types'
import { useAppContext } from '../context/AppContext'
import SegmentedControl from './SegmentedControl'
import { ArrowLeftIcon } from './icons'

const themeOptions = [
  { value: 'light' as const, label: 'Light' },
  { value: 'dark' as const, label: 'Dark' },
  { value: 'system' as const, label: 'System' }
]

const viewOptions = [
  { value: 'edit' as const, label: 'Edit Mode' },
  { value: 'pageview' as const, label: 'Page View' }
]

export default function SettingsPage(): React.JSX.Element {
  const { settings, updateSettings, setCurrentPage } = useAppContext()

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={() => setCurrentPage('editor')} title="Back">
          <ArrowLeftIcon />
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">Appearance</div>
        <div className="settings-card">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Theme</div>
              <div className="settings-row-description">Choose your preferred color scheme</div>
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
        <div className="settings-section-title">Editor</div>
        <div className="settings-card">
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Default View</div>
              <div className="settings-row-description">View mode when opening a new file</div>
            </div>
            <SegmentedControl<DefaultView>
              options={viewOptions}
              value={settings.defaultView}
              onChange={(defaultView) => updateSettings({ defaultView })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
