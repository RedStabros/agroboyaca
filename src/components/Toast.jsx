import { AlertCircle, CheckCircle2, X } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export function Toast() {
  const { toast, dismissToast } = useApp()
  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6 max-w-sm w-[calc(100%-2rem)]"
    >
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
          isError
            ? 'border-rose-200 bg-rose-50 text-rose-950'
            : 'border-emerald-200 bg-white text-[#18221A]'
        }`}
      >
        {isError ? (
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-700 mt-0.5" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2E7D32] mt-0.5" aria-hidden="true" />
        )}
        <p className="text-sm font-medium leading-snug flex-1">{toast.message}</p>
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Cerrar notificacion"
          className="rounded-lg p-1 text-[#4A5A4E] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#2E7D32]"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
