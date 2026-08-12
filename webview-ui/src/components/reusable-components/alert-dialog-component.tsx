import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { VsButton } from "../../styles/reusablecomponentsstyles/button-component-styles"

interface AlertDialogComponentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm?: () => void
  /** If true, only shows OK button (no cancel) */
  closeOnly?: boolean
}

const AlertDialogComponent = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "OK",
  onConfirm,
  closeOnly,
}: AlertDialogComponentProps) => {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
        />
        <AlertDialog.Content
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "var(--vscode-editor-background, #1e1e1e)",
            border: "1px solid var(--vscode-editorWidget-border, #454545)",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "400px",
            width: "90%",
            zIndex: 10000,
            color: "var(--vscode-editor-foreground, #cccccc)",
          }}
        >
          <AlertDialog.Title
            style={{
              fontSize: "16px",
              fontWeight: 600,
              margin: "0 0 8px 0",
              color: "var(--vscode-editor-foreground, #cccccc)",
            }}
          >
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description
            style={{
              fontSize: "14px",
              margin: "0 0 20px 0",
              color: "var(--vscode-descriptionForeground, #999)",
              lineHeight: 1.5,
            }}
          >
            {description}
          </AlertDialog.Description>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            {!closeOnly && (
              <AlertDialog.Cancel asChild>
                <VsButton>Cancel</VsButton>
              </AlertDialog.Cancel>
            )}
            <AlertDialog.Action asChild onClick={onConfirm}>
              <VsButton className="action">{confirmLabel}</VsButton>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

export default AlertDialogComponent