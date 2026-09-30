import { ref, readonly } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export interface ConfirmDialogState extends ConfirmOptions {
  isOpen: boolean
  resolve: (value: boolean) => void
}

export class ConfirmService {
  private _state = ref<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    type: 'warning',
    resolve: () => {},
  })

  readonly state = readonly(this._state)

  ask = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      this._state.value = {
        ...options,
        confirmText: options.confirmText || '',
        cancelText: options.cancelText || '',
        type: options.type || 'warning',
        isOpen: true,
        resolve,
      }
    })
  }

  handleConfirm = (): void => {
    const resolver = this._state.value.resolve
    this._state.value.isOpen = false
    if (resolver) {
      resolver(true)
    }
  }

  handleCancel = (): void => {
    const resolver = this._state.value.resolve
    this._state.value.isOpen = false
    if (resolver) {
      resolver(false)
    }
  }
}
