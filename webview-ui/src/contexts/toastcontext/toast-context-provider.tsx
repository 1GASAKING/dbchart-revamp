import { useState, type ReactNode } from "react"
import type { ToastType } from "../../styles/toastcomponentstyles/toast-component-styles"
import { ToastContext } from "./toast-context"
import ToastComponent from "../../components/reusable-components/toast-component"


export function ToastProvider({ children }: { children: ReactNode}) {
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