import * as Toast from "@radix-ui/react-toast"

interface ToastComponentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

const toastViewportStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "24px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 10001,
}

const toastRootStyle: React.CSSProperties = {
  background: "var(--vscode-inputValidation-errorBackground, #5a1d1d)",
  color: "var(--vscode-inputValidation-errorForeground, #f48771)",
  border: "1px solid var(--vscode-inputValidation-errorBorder, #be1100)",
  borderRadius: "6px",
  padding: "10px 20px",
  fontSize: "13px",
  fontWeight: 500,
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  maxWidth: "400px",
  textAlign: "center",
  lineHeight: 1.4,
  listStyle: "none",
}

const ToastComponent = ({ open, onOpenChange, message }: ToastComponentProps) => {
  return (
    <Toast.Provider>
      <Toast.Root
        open={open}
        onOpenChange={onOpenChange}
        duration={3000}
        style={toastRootStyle}
      >
        <Toast.Title>
          Error
        </Toast.Title>
        <Toast.Description>{message}</Toast.Description>
      </Toast.Root>
      <Toast.Viewport style={toastViewportStyle} />
    </Toast.Provider>
  )
}

export default ToastComponent