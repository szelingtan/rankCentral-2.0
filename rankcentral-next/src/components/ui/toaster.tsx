import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertCircle, CheckCircle, InfoIcon } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Set icon based on variant
        let Icon = InfoIcon
        if (variant === 'destructive') {
          Icon = AlertCircle
        } else if (variant === 'success') {
          Icon = CheckCircle
        }
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-2 items-start">
              <Icon className="h-3.5 w-3.5 mt-0.5" />
              <div className="grid gap-0.5">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
