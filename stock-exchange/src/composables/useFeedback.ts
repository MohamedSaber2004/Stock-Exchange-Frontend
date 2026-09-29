import { coreServices } from '@/di'
import type { ConfirmOptions } from '@/infrastructure/feedback/confirm.service'

export function useFeedback() {
  const toast = coreServices.toast
  const confirm = coreServices.confirm

  return {
    toast: {
      success: (msg: string, title?: string) => toast.success(msg, title),
      error: (msg: string, title?: string) => toast.error(msg, title),
      warning: (msg: string, title?: string) => toast.warning(msg, title),
      info: (msg: string, title?: string) => toast.info(msg, title),
      dismiss: (id: string) => toast.dismiss(id),
    },
    confirm: (options: ConfirmOptions) => confirm.ask(options),
  }
}
