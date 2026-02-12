import { useEffect } from 'react'

interface MenuHandlers {
  onNewFile: () => void
  onOpenFile: () => void
  onSaveFile: () => void
  onSaveFileAs: () => void
  onOpenSettings: () => void
  onViewEdit: () => void
  onViewPreview: () => void
  onViewPageview: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

export function useMenuActions(handlers: MenuHandlers): void {
  useEffect(() => {
    const cleanup = window.api.onMenuAction((action: string) => {
      switch (action) {
        case 'new-file':
          handlers.onNewFile()
          break
        case 'open-file':
          handlers.onOpenFile()
          break
        case 'save-file':
          handlers.onSaveFile()
          break
        case 'save-file-as':
          handlers.onSaveFileAs()
          break
        case 'open-settings':
          handlers.onOpenSettings()
          break
        case 'view-edit':
          handlers.onViewEdit()
          break
        case 'view-preview':
          handlers.onViewPreview()
          break
        case 'view-pageview':
          handlers.onViewPageview()
          break
        case 'zoom-in':
          handlers.onZoomIn()
          break
        case 'zoom-out':
          handlers.onZoomOut()
          break
        case 'zoom-reset':
          handlers.onZoomReset()
          break
      }
    })
    return cleanup
  })
}
