import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title?: string
  message: string
  durationMs?: number
}

export class ToastService {
  private _toasts = ref<ToastMessage[]>([])
  readonly toasts = readonly(this._toasts)

  show(toast: Omit<ToastMessage, 'id'>): string {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastMessage = {
      ...toast,
      id,
      durationMs: toast.durationMs ?? 4000,
    }

    this._toasts.value.push(newToast)

    if (newToast.durationMs && newToast.durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id)
      }, newToast.durationMs)
    }

    return id
  }

  success(message: string, title?: string): string {
    return this.show({ type: 'success', message, title })
  }

  error(message: string, title?: string): string {
    return this.show({ type: 'error', message, title, durationMs: 6000 })
  }

  warning(message: string, title?: string): string {
    return this.show({ type: 'warning', message, title })
  }

  info(message: string, title?: string): string {
    return this.show({ type: 'info', message, title })
  }

  dismiss(id: string): void {
    this._toasts.value = this._toasts.value.filter((t) => t.id !== id)
  }

  clear(): void {
    this._toasts.value = []
  }
}
