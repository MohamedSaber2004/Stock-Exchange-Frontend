import { container } from './container'
import { TokenStore } from '@/infrastructure/storage/token-store'
import { HttpClient } from '@/infrastructure/http/http-client'
import { ToastService } from '@/infrastructure/feedback/toast.service'
import { ConfirmService } from '@/infrastructure/feedback/confirm.service'
import { AuthRepository } from '@/data/repositories/auth.repository'
import { AttachmentRepository } from '@/data/repositories/attachment.repository'
import { CountryRepository } from '@/data/repositories/country.repository'
import { UserRepository } from '@/data/repositories/user.repository'
import { ActivityLogRepository } from '@/data/repositories/activity-log.repository'

// Register Core Infrastructure Singletons
container.register(TokenStore, () => new TokenStore())
container.register(HttpClient, () => new HttpClient(container.resolve(TokenStore)))
container.register(ToastService, () => new ToastService())
container.register(ConfirmService, () => new ConfirmService())
container.register(
  AuthRepository,
  () => new AuthRepository(container.resolve(HttpClient), container.resolve(TokenStore))
)
container.register(
  AttachmentRepository,
  () => new AttachmentRepository(container.resolve(HttpClient), container.resolve(TokenStore))
)
container.register(
  CountryRepository,
  () => new CountryRepository(container.resolve(HttpClient))
)
container.register(
  UserRepository,
  () => new UserRepository(container.resolve(HttpClient))
)
container.register(
  ActivityLogRepository,
  () => new ActivityLogRepository(container.resolve(HttpClient))
)

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
  get auth(): AuthRepository {
    return container.resolve(AuthRepository)
  },
  get attachments(): AttachmentRepository {
    return container.resolve(AttachmentRepository)
  },
  get countries(): CountryRepository {
    return container.resolve(CountryRepository)
  },
  get users(): UserRepository {
    return container.resolve(UserRepository)
  },
  get activityLogs(): ActivityLogRepository {
    return container.resolve(ActivityLogRepository)
  },
}

export { container }


