# Article, Video, Service, and News Details Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full details support for Articles, Videos, Services, and Latest News across backend .NET Clean Architecture API and Vue 3 Admin Frontend, ensuring complete mobile API integration for Flutter and interactive Flutter Mobile Device Preview in the Admin dashboard.

**Architecture:**
- **Backend (.NET 8 Clean Architecture):** Extend Domain entities (`Article`, `News`, `Video`, `Service`), persistence configurations, DTOs, CQRS commands/queries to support full rich content (`ContentEn`/`ContentAr` and `DescriptionEn`/`DescriptionAr`), enable public/guest mobile access where appropriate, and create EF Core migrations.
- **Frontend (Vue 3 + TypeScript + Tailwind):** Create interactive `MobileDeviceFrame.vue` simulating native Flutter mobile application details screens, build dedicated Details views (`ArticleDetailsView.vue`, `VideoDetailsView.vue`, `ServiceDetailsView.vue`, `NewsDetailsView.vue`), integrate rich text editing in forms, update routers, and provide bilingual localization.

**Tech Stack:**
- Backend: ASP.NET Core 8, EF Core 8, MediatR, FluentValidation, SQL Server, OpenAPI / Swagger
- Frontend: Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS v4, Vue Router, Vue-i18n, Lucide Icons

---

## File Structure Map

### Backend (`E:\Stock Exchange\Stock Exchange`)
- `Stock-Exchange.Domain/Entities/Article.cs` — add `ContentEn`, `ContentAr`
- `Stock-Exchange.Domain/Entities/News.cs` — add `ContentEn`, `ContentAr`
- `Stock-Exchange.Domain/Entities/Video.cs` — add `DescriptionEn`, `DescriptionAr`
- `Stock-Exchange.Domain/Entities/Service.cs` — add `ContentEn`, `ContentAr`
- `Stock-Exchange.Persistance/Configurations/ArticleConfiguration.cs` — column configurations for content
- `Stock-Exchange.Persistance/Configurations/NewsConfiguration.cs` — column configurations for content
- `Stock-Exchange.Persistance/Configurations/VideoConfiguration.cs` — column configurations for description
- `Stock-Exchange.Persistance/Configurations/ServiceConfiguration.cs` — column configurations for content
- `Stock-Exchange.Application/Features/Articles/DTOs/ArticleDto.cs` — add content fields & language filtering
- `Stock-Exchange.Application/Features/Articles/Commands/AddArticle/AddArticleCommand.cs` & `Handler` & `Validator`
- `Stock-Exchange.Application/Features/Articles/Commands/UpdateArticle/UpdateArticleCommand.cs` & `Handler` & `Validator`
- `Stock-Exchange.Application/Features/Articles/Queries/GetArticleById/GetArticleByIdQueryHandler.cs`
- `Stock-Exchange.Application/Features/Articles/Queries/GetAllArticles/GetAllArticlesQueryHandler.cs`
- `Stock-Exchange.Application/Features/News/DTOs/NewsDto.cs` — add content fields & language filtering
- `Stock-Exchange.Application/Features/News/Commands/AddNews/AddNewsCommand.cs` & `Handler` & `Validator`
- `Stock-Exchange.Application/Features/News/Commands/UpdateNews/UpdateNewsCommand.cs` & `Handler` & `Validator`
- `Stock-Exchange.Application/Features/News/Queries/GetNewsById/GetNewsByIdQueryHandler.cs`
- `Stock-Exchange.Application/Features/Videos/DTOs/VideoDto.cs` — add description fields
- `Stock-Exchange.Application/Features/Videos/Commands/AddVideo/AddVideoCommand.cs` & `Handler` & `Validator`
- `Stock-Exchange.Application/Features/Videos/Commands/UpdateVideo/UpdateVideoCommand.cs` & `Handler` & `Validator`
- `Stock-Exchange.Application/Features/Videos/Queries/GetVideoById/GetVideoByIdQueryHandler.cs`
- `Stock-Exchange.Application/Features/Services/DTOs/ServiceDto.cs` — add content fields
- `Stock-Exchange.Application/Features/Services/Commands/AddService/AddServiceCommand.cs` & `Handler`
- `Stock-Exchange.Application/Features/Services/Commands/UpdateService/UpdateServiceCommand.cs` & `Handler`
- `Stock-Exchange.Application/Features/Services/Queries/GetServiceById/GetServiceByIdQueryHandler.cs`
- `Stock Exchange/Controllers/V1/ArticlesController.cs` — add AllowAnonymous to GetById/GetAll
- `Stock Exchange/Controllers/V1/NewsController.cs` — add AllowAnonymous to GetById/GetAll
- `Stock Exchange/Controllers/V1/VideosController.cs` — add AllowAnonymous to GetById/GetAll
- `Stock Exchange/Controllers/V1/ServicesController.cs` — add AllowAnonymous to GetById/GetAll

### Frontend (`e:\Stock Exchange Admin Frontend\Stock-Exchange\stock-exchange`)
- `src/domain/models/article.model.ts` — add `contentEn`, `contentAr`, `content`
- `src/domain/models/news.model.ts` — add `contentEn`, `contentAr`, `content`
- `src/domain/models/video.model.ts` — add `descriptionEn`, `descriptionAr`
- `src/domain/models/service.model.ts` — add `contentEn`, `contentAr`
- `src/components/mobile-preview/MobileDeviceFrame.vue` — interactive Flutter phone mockup frame
- `src/views/articles/ArticleDetailsView.vue` — article details with metadata, rich content & mobile preview
- `src/views/videos/VideoDetailsView.vue` — video details with player preview & mobile preview
- `src/views/services/ServiceDetailsView.vue` — service details with features & mobile preview
- `src/views/news/NewsDetailsView.vue` — news details with full content & mobile preview
- `src/views/articles/CreateArticleView.vue` & `EditArticleView.vue` — wire RichTextEditor for content
- `src/views/news/CreateNewsView.vue` & `EditNewsView.vue` — wire content fields
- `src/views/videos/CreateVideoView.vue` & `EditVideoView.vue` — wire description fields
- `src/views/articles/ArticlesListView.vue` — add "View Details" route action
- `src/views/videos/VideosListView.vue` — add "View Details" route action
- `src/views/news/NewsListView.vue` — add "View Details" route action
- `src/views/services/ServicesListView.vue` — add "View Details" route action
- `src/router/index.ts` — register `/articles/:id`, `/videos/:id`, `/services/:id`, `/news/:id`
- `src/i18n/locales/en.ts` & `ar.ts` — add localization strings

---

## Tasks

### Task 1: Backend Domain & Persistence Updates
- [ ] Add `ContentEn` and `ContentAr` to `Article.cs` and `News.cs`
- [ ] Add `DescriptionEn` and `DescriptionAr` to `Video.cs`
- [ ] Add `ContentEn` and `ContentAr` to `Service.cs`
- [ ] Update EF Core configurations in `Stock-Exchange.Persistance/Configurations/`
- [ ] Create and apply EF Core migration `AddDetailsContentFields`
- [ ] Verify `dotnet build` succeeds

### Task 2: Backend Application Layer (DTOs, CQRS Commands/Queries)
- [ ] Update `ArticleDto`, `AddArticleCommand`, `UpdateArticleCommand`, and query handlers
- [ ] Update `NewsDto`, `AddNewsCommand`, `UpdateNewsCommand`, and query handlers
- [ ] Update `VideoDto`, `AddVideoCommand`, `UpdateVideoCommand`, and query handlers
- [ ] Update `ServiceDto`, `AddServiceCommand`, `UpdateServiceCommand`, and query handlers
- [ ] Adjust Validators for added fields
- [ ] Verify `dotnet build` succeeds

### Task 3: Backend Controllers & Flutter Mobile Integration Endpoints
- [ ] Update `ArticlesController.cs` to allow public/guest queries (`[AllowAnonymous]`)
- [ ] Update `NewsController.cs` to allow public/guest queries (`[AllowAnonymous]`)
- [ ] Update `VideosController.cs` to allow public/guest queries (`[AllowAnonymous]`)
- [ ] Update `ServicesController.cs` to allow public/guest queries (`[AllowAnonymous]`)
- [ ] Verify build and endpoint contracts

### Task 4: Frontend Models and Mobile Device Frame Component
- [ ] Update TypeScript domain models (`article.model.ts`, `news.model.ts`, `video.model.ts`, `service.model.ts`)
- [ ] Implement `src/components/mobile-preview/MobileDeviceFrame.vue` with realistic Flutter app styling, device bezel, status bar, language switch, and preview renders for Article, Video, Service, News

### Task 5: Frontend Details Views Implementation
- [ ] Implement `src/views/articles/ArticleDetailsView.vue`
- [ ] Implement `src/views/videos/VideoDetailsView.vue`
- [ ] Implement `src/views/services/ServiceDetailsView.vue`
- [ ] Implement `src/views/news/NewsDetailsView.vue`

### Task 6: Routing, List Navigation & Form Editors Integration
- [ ] Add detail routes in `src/router/index.ts`
- [ ] Add "View Details" to action menus in `ArticlesListView.vue`, `VideosListView.vue`, `NewsListView.vue`, `ServicesListView.vue`
- [ ] Wire `RichTextEditor` in `CreateArticleView.vue` and `EditArticleView.vue` for `contentEn`/`contentAr`
- [ ] Wire content inputs in `CreateNewsView.vue` and `EditNewsView.vue`
- [ ] Wire description inputs in `CreateVideoView.vue` and `EditVideoView.vue`
- [ ] Add bilingual translation strings in `en.ts` and `ar.ts`

### Task 7: Verification and End-to-End Build Check
- [ ] Run backend `dotnet build`
- [ ] Run frontend `npm run build`
- [ ] Verify all routes and type-checks pass cleanly
