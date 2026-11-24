import { toast, ToastOptions } from 'react-toastify'
import { extractMessage } from '@/utils/helper/Toast.helper'

type ToastType = 'info' | 'success' | 'error' | 'warn'

export const useToast = () => {
  const show = (messageOrError: unknown, type: ToastType = 'info', options?: ToastOptions) => {
    const message = extractMessage(messageOrError)
    const opts = { ...options }
    switch (type) {
      case 'success':
        toast.success(message, opts)
        break
      case 'error':
        toast.error(message, opts)
        break
      case 'warn':
        toast.warn(message, opts)
        break
      default:
        toast.info(message, opts)
        break
    }
  }

  return {
    show,
    info: (m: unknown, o?: ToastOptions) => show(m, 'info', o),
    success: (m: unknown, o?: ToastOptions) => show(m, 'success', o),
    error: (m: unknown, o?: ToastOptions) => show(m, 'error', o),
    warn: (m: unknown, o?: ToastOptions) => show(m, 'warn', o),
  }
}

export default useToast
