import * as Toast from "@radix-ui/react-toast"
import {
  ToastViewport,
  ToastRoot,
  ToastIcon,
  ToastTitle,
  ToastDescription,
  type ToastType,
} from "../../styles/toastcomponentstyles/toast-component-styles"

interface ToastComponentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
  type: ToastType
}

const typeConfig: Record<ToastType, { icon: string; label: string }> = {
  error: { icon: "codicon codicon-error", label: "Error" },
  warning: { icon: "codicon codicon-warning", label: "Warning" },
  notification: { icon: "codicon codicon-info", label: "Notification" },
}

const ToastComponent = ({ open, onOpenChange, message, type }: ToastComponentProps) => {
  const { icon, label } = typeConfig[type]

  return (
    <Toast.Provider>
      <Toast.Root
        asChild
        open={open}
        onOpenChange={onOpenChange}
        duration={3000}
      >
        <ToastRoot $type={type}>
          <div className="header">
            <Toast.Title asChild>
              <ToastTitle>{label}</ToastTitle>
            </Toast.Title>
            <ToastIcon $type={type}>
              <i className={icon} />
            </ToastIcon>
          </div>
          
          <Toast.Description asChild>
            <ToastDescription $type={type} >{message}</ToastDescription>
          </Toast.Description>
        </ToastRoot>
      </Toast.Root>
      <Toast.Viewport asChild>
        <ToastViewport />
      </Toast.Viewport>
    </Toast.Provider>
  )
}

export default ToastComponent
