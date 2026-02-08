import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import type { Theme, AppSettings, AppPage } from '../../../shared/types'

interface AppContextValue {
  resolvedTheme: 'light' | 'dark'
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
  currentPage: AppPage
  setCurrentPage: (page: AppPage) => void
}

const STORAGE_KEY = 'textos-settings'

const defaultSettings: AppSettings = {
  theme: 'system',
  defaultView: 'pageview',
  fontFamily: 'Consolas',
  fontSize: 14
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    // ignore
  }
  return defaultSettings
}

function resolveTheme(theme: Theme, systemDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return systemDark ? 'dark' : 'light'
  return theme
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [currentPage, setCurrentPage] = useState<AppPage>('editor')

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent): void => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const resolvedTheme = resolveTheme(settings.theme, systemDark)

  // Apply data-theme attribute to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme)
  }, [resolvedTheme])

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const value = useMemo(
    () => ({ resolvedTheme, settings, updateSettings, currentPage, setCurrentPage }),
    [resolvedTheme, settings, updateSettings, currentPage, setCurrentPage]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}
