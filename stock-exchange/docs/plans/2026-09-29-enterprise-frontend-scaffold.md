# Enterprise Frontend Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install all required npm packages and implement the full Enterprise Frontend Architecture (Clean Architecture, DI, SoC, DataState, Router with Guards, and Bilingual Support) as defined in the spec.

**Architecture:** Hexagonal Ports & Adapters architecture with strict separation between Domain, Infrastructure, Data, Application, and Presentation layers, wired together through a type-safe Dependency Injection (DI) Container.

**Tech Stack:** Vue 3.5+, TypeScript, Vite, Tailwind CSS, Lucide Icons, Vue Router 4, Vue i18n.

---

### Task 1: Install Dependencies & Setup Build Config

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`
- Create: `src/assets/main.css`

- [ ] **Step 1: Install packages via npm**
Run: `npm install vue-router@4 lucide-vue-next vue-i18n@9 tailwindcss @tailwindcss/vite clsx tailwind-merge`

- [ ] **Step 2: Update `vite.config.ts` to include Tailwind Vite plugin and path aliases**
Configure `@tailwindcss/vite` and alias `@` -> `./src`.

- [ ] **Step 3: Update `src/assets/main.css` to import Tailwind and define CSS design variables**
Configure typography, CSS tokens, RTL font fallbacks, and theme tokens.

---

### Task 2: Domain Layer (Pure Types & Port Contracts)

**Files:**
- Create: `src/domain/models/common.model.ts`
- Create: `src/domain/models/user.model.ts`
- Create: `src/domain/models/marketplace.model.ts`
- Create: `src/domain/ports/auth-repository.port.ts`
- Create: `src/domain/ports/marketplace-repository.port.ts`
- Create: `src/domain/index.ts`

- [ ] **Step 1: Create Common & Auth Domain Models**
Define `ApiResponse<T>`, `PaginatedResponse<T>`, `AppError`, `User`, `UserRole`, `AuthTokens`, and `LoginCredentials`.

- [ ] **Step 2: Create Marketplace Domain Models**
Define `MarketItem`, `MarketFilter`, `MarketStats`, `MarketCategory`.

- [ ] **Step 3: Create Repository Interfaces (Ports)**
Define `IAuthRepository` and `IMarketplaceRepository`.

---

### Task 3: Infrastructure Layer (HTTP Client, Token Store, Feedback Services)

**Files:**
- Create: `src/infrastructure/storage/token-store.ts`
- Create: `src/infrastructure/http/http-client.ts`
- Create: `src/infrastructure/feedback/toast.service.ts`
- Create: `src/infrastructure/feedback/confirm.service.ts`
- Create: `src/infrastructure/index.ts`

- [ ] **Step 1: Implement TokenStore**
Manage access and refresh tokens with memory and localStorage persistence.

- [ ] **Step 2: Implement HttpClient**
Build resilient HTTP Client with auth header injection, 401 refresh mechanism, AbortController tracking, and error mapping.

- [ ] **Step 3: Implement ToastService and ConfirmService**
Reactive state queues for toast messages and promise-based confirmation modals.

---

### Task 4: Data Layer (Repositories)

**Files:**
- Create: `src/data/repositories/api-auth.repository.ts`
- Create: `src/data/repositories/api-marketplace.repository.ts`
- Create: `src/data/index.ts`

- [ ] **Step 1: Implement ApiAuthRepository**
Implements `IAuthRepository` using `HttpClient` with offline fallback demo capability.

- [ ] **Step 2: Implement ApiMarketplaceRepository**
Implements `IMarketplaceRepository` using `HttpClient` with built-in mock fallback for offline development.

---

### Task 5: Dependency Injection Container

**Files:**
- Create: `src/di/container.ts`
- Create: `src/di/index.ts`

- [ ] **Step 1: Build DI Container**
Type-safe registry for singletons and factory instantiation.

- [ ] **Step 2: Wire DI Dependencies**
Register `TokenStore`, `HttpClient`, `ApiAuthRepository`, `ApiMarketplaceRepository`, `AuthService`, `MarketplaceService`, and export `services` registry.

---

### Task 6: Application Layer (Stateful Services)

**Files:**
- Create: `src/application/auth/auth.service.ts`
- Create: `src/application/marketplace/marketplace.service.ts`
- Create: `src/application/index.ts`

- [ ] **Step 1: Implement AuthService**
Reactive user state (`currentUser`, `isAuthenticated`, `userRole`), `login`, `logout`, `checkAuth`.

- [ ] **Step 2: Implement MarketplaceService**
Reactive state (`items`, `activeItem`, `stats`, `loading`, `error`, `filters`), `fetchItems`, `selectItem`, `updateFilters`.

---

### Task 7: UI Composables Layer

**Files:**
- Create: `src/composables/useAuth.ts`
- Create: `src/composables/useMarketplace.ts`
- Create: `src/composables/useFeedback.ts`
- Create: `src/composables/useLocale.ts`
- Create: `src/composables/index.ts`

- [ ] **Step 1: Implement useAuth and useFeedback composables**
- [ ] **Step 2: Implement useMarketplace with debounced search and filter reactivity**
- [ ] **Step 3: Implement useLocale for RTL/LTR and language switching**

---

### Task 8: Internationalization & Localization (i18n)

**Files:**
- Create: `src/i18n/locales/ar.ts`
- Create: `src/i18n/locales/en.ts`
- Create: `src/i18n/index.ts`

- [ ] **Step 1: Create Arabic (ar) and English (en) translation catalogs**
- [ ] **Step 2: Configure Vue i18n instance and document direction sync (RTL/LTR)**

---

### Task 9: Design System Components

**Files:**
- Create: `src/components/ui/AppButton.vue`
- Create: `src/components/ui/AppInput.vue`
- Create: `src/components/ui/DataState.vue`
- Create: `src/components/ui/ToastContainer.vue`
- Create: `src/components/ui/ConfirmModal.vue`
- Create: `src/components/layout/AppHeader.vue`
- Create: `src/components/layout/AppSidebar.vue`
- Create: `src/components/layout/AppShell.vue`

- [ ] **Step 1: Implement UI atomic primitives (Button, Input, DataState, ToastContainer, ConfirmModal)**
- [ ] **Step 2: Implement Layout components (AppShell, AppHeader, AppSidebar)**

---

### Task 10: Router Configuration & Security Guards

**Files:**
- Create: `src/router/routes.ts`
- Create: `src/router/guards.ts`
- Create: `src/router/index.ts`

- [ ] **Step 1: Define application routes with metadata (`requiresAuth`, `requiresAdmin`, `guestOnly`, `titleKey`)**
- [ ] **Step 2: Implement Navigation Guards for auth protection and role enforcement**

---

### Task 11: Views & Application Bootstrap

**Files:**
- Create: `src/views/auth/LoginView.vue`
- Create: `src/views/marketplace/MarketplaceView.vue`
- Create: `src/views/admin/AdminDashboardView.vue`
- Modify: `src/App.vue`
- Modify: `src/main.ts`

- [ ] **Step 1: Implement LoginView with demo credentials**
- [ ] **Step 2: Implement MarketplaceView demonstrating Clean Architecture Data Flow**
- [ ] **Step 3: Implement AdminDashboardView with role protection demonstration**
- [ ] **Step 4: Update App.vue and main.ts to initialize DI, Router, and i18n**

---

### Task 12: Verification and Build Validation

- [ ] **Step 1: Run TypeScript type-check (`npm run type-check`)**
- [ ] **Step 2: Run Production Build (`npm run build`)**
- [ ] **Step 3: Verify clean runtime execution without errors**
