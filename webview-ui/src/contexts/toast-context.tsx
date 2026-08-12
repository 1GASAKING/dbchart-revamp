import { createContext, useContext, useState, type ReactNode } from "react"
import ToastComponent from "../components/reusable-components/toast-component"
import type { ToastType } from "../styles/toastcomponentstyles/toast-component-styles"

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("")
  const [type, setType] = useState<ToastType>("error")
  const [open, setOpen] = useState(false)

  const showToast = (msg: string, t?: ToastType) => {
    setMessage(msg)
    setType(t ?? "error")
    setOpen(true)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastComponent open={open} onOpenChange={setOpen} message={message} type={type} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}
