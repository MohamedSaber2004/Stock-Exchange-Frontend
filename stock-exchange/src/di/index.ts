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

import { AboutUsRepository } from '@/data/repositories/about-us.repository'
import { LegalRepository } from '@/data/repositories/legal.repository'
import { HelpCenterRepository } from '@/data/repositories/help-center.repository'
import { ArticleRepository } from '@/data/repositories/article.repository'
import { VideoRepository } from '@/data/repositories/video.repository'
import { ServiceRepository } from '@/data/repositories/service.repository'
import { ExpertRepository } from '@/data/repositories/expert.repository'
import { NewsRepository } from '@/data/repositories/news.repository'
import { OverviewRepository } from '@/data/repositories/overview.repository'
import { SearchRepository } from '@/data/repositories/search.repository'

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
container.register(
  AboutUsRepository,
  () => new AboutUsRepository(container.resolve(HttpClient))
)
container.register(
  LegalRepository,
  () => new LegalRepository(container.resolve(HttpClient))
)
container.register(
  HelpCenterRepository,
  () => new HelpCenterRepository(container.resolve(HttpClient))
)
container.register(
  ArticleRepository,
  () => new ArticleRepository(container.resolve(HttpClient))
)
container.register(
  VideoRepository,
  () => new VideoRepository(container.resolve(HttpClient))
)
container.register(
  ServiceRepository,
  () => new ServiceRepository(container.resolve(HttpClient))
)
container.register(
  ExpertRepository,
  () => new ExpertRepository(container.resolve(HttpClient))
)
container.register(
  NewsRepository,
  () => new NewsRepository(container.resolve(HttpClient))
)
container.register(
  OverviewRepository,
  () => new OverviewRepository(container.resolve(HttpClient))
)
container.register(
  SearchRepository,
  () => new SearchRepository(container.resolve(HttpClient))
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
  get aboutUs(): AboutUsRepository {
    return container.resolve(AboutUsRepository)
  },
  get legal(): LegalRepository {
    return container.resolve(LegalRepository)
  },
  get helpCenter(): HelpCenterRepository {
    return container.resolve(HelpCenterRepository)
  },
  get articles(): ArticleRepository {
    return container.resolve(ArticleRepository)
  },
  get videos(): VideoRepository {
    return container.resolve(VideoRepository)
  },
  get services(): ServiceRepository {
    return container.resolve(ServiceRepository)
  },
  get experts(): ExpertRepository {
    return container.resolve(ExpertRepository)
  },
  get news(): NewsRepository {
    return container.resolve(NewsRepository)
  },
  get overview(): OverviewRepository {
    return container.resolve(OverviewRepository)
  },
  get search(): SearchRepository {
    return container.resolve(SearchRepository)
  },
}

export { container }


