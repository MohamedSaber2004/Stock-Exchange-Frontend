import { container } from './container'
import { TokenStore } from '@/infrastructure/storage/token-store'
import { HttpClient } from '@/infrastructure/http/http-client'
import { ToastService } from '@/infrastructure/feedback/toast.service'
import { ConfirmService } from '@/infrastructure/feedback/confirm.service'

// Register Core Infrastructure Singletons
container.register(TokenStore, () => new TokenStore())
container.register(HttpClient, () => new HttpClient(container.resolve(TokenStore)))
container.register(ToastService, () => new ToastService())
container.register(ConfirmService, () => new ConfirmService())

export const coreServices = {
  get tokenStore(): TokenStore {
    return container.resolve(TokenStore)
  },
  get httpClient(): HttpClient {
    return container.resolve(HttpClient)
  },
  get toast(): ToastService {
    return container.resolve(ToastService)
  },
  get confirm(): ConfirmService {
    return container.resolve(ConfirmService)
  },
}

export { container }
