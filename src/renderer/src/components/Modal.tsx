import { useEffect } from 'react'

export interface ModalAction {
  label: string
  variant: 'primary' | 'secondary' | 'danger'
  onClick: () => void
}

interface ModalProps {
  title: string
  message: string
  actions: ModalAction[]
  onClose: () => void
}

export default function Modal({ title, message, actions, onClose }: ModalProps): React.JSX.Element {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <div className="modal-message">{message}</div>
        <div className="modal-actions">
          {actions.map((action) => (
            <button
              key={action.label}
              className={`modal-btn modal-btn-${action.variant}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
