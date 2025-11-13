import { useState, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const typeStyles = {
    success: 'bg-green-500 dark:bg-green-600',
    error: 'bg-red-500 dark:bg-red-600',
    info: 'bg-indigo-500 dark:bg-indigo-600',
    warning: 'bg-yellow-500 dark:bg-yellow-600',
  }

  const typeIcons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div
        className={`${typeStyles[type]} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-sm animate-slide-in`}
      >
        <span className="text-xl font-bold">{typeIcons[type]}</span>
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-auto text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([])

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )

  return { showToast, ToastContainer }
}
