import * as Toast from "@radix-ui/react-toast"
import { ToastViewport, ToastRoot, ToastTitle } from "../../styles/toastcomponentstyles/toast-component-styles"

interface ToastComponentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

const ToastComponent = ({ open, onOpenChange, message }: ToastComponentProps) => {
  return (
    <Toast.Provider>
      <Toast.Root
        asChild
        open={open}
        onOpenChange={onOpenChange}
        duration={3000}
      >
        <ToastRoot>
          <Toast.Title asChild>
            <ToastTitle>Error</ToastTitle>
          </Toast.Title>
          <Toast.Description>{message}</Toast.Description>
        </ToastRoot>
      </Toast.Root>
      <Toast.Viewport asChild>
        <ToastViewport />
      </Toast.Viewport>
    </Toast.Provider>
  )
}

export default ToastComponent
