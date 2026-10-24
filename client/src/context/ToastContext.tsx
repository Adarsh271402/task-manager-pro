import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

const ToastContext = createContext<{ push: (message: string, type?: ToastType) => void } | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId.current++
      setToasts((t) => [...t.slice(-4), { id, message, type }])
      window.setTimeout(() => remove(id), 4500)
    },
    [remove]
  )

  const icon = (type: ToastType) =>
    type === 'success' ? (
      <CheckCircle2 size={17} className="text-emerald-400 shrink-0" />
    ) : type === 'error' ? (
      <XCircle size={17} className="text-red-400 shrink-0" />
    ) : (
      <Info size={17} className="text-brand-400 shrink-0" />
    )

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[70] flex flex-col gap-2 w-80 max-w-[calc(100vw-2.5rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card flex items-start gap-2.5 px-4 py-3 text-sm text-slate-200 animate-[toast-in_.25s_ease-out] border-white/10 bg-night-800/95 backdrop-blur"
          >
            {icon(t.type)}
            <span className="flex-1 leading-snug">{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-slate-300 shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
