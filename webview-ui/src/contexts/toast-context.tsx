import { createContext, useContext, useState, type ReactNode } from "react"
import ToastComponent from "../components/reusable-components/toast-component"

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("")
  const [open, setOpen] = useState(false)

  const showToast = (msg: string) => {
    setMessage(msg)
    setOpen(true)
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastComponent open={open} onOpenChange={setOpen} message={message} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}