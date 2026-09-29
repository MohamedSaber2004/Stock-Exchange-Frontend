# Enterprise Frontend Architecture & Scaffold Specification

**Date:** 2026-09-29  
**Status:** Approved  
**Target:** Stock Exchange Enterprise Frontend (Vue 3 + TypeScript + Tailwind CSS)

---

## 1. Executive Summary

This specification outlines the technical design and concrete file organization for the **Stock Exchange Enterprise Frontend**. The system employs **Clean Architecture**, **Hexagonal Architecture (Ports & Adapters)**, **Dependency Injection (DI)**, and strict **Separation of Concerns (SoC)**.

---

## 2. Technology Stack & Packages

| Category | Package / Tool | Version / Purpose |
| :--- | :--- | :--- |
| **Core Framework** | `vue` | Vue 3.5+ (Composition API & `<script setup lang="ts">`) |
| **Language** | `typescript` | Strict type checking with path aliases (`@/*`) |
| **Routing** | `vue-router` | Client routing with role-based navigation guards |
| **Styling** | `tailwindcss`, `@tailwindcss/vite` | Modern utility-first CSS with CSS variables & dark/RTL support |
| **Utility Styling** | `clsx`, `tailwind-merge` | Class combination helpers |
| **Icons** | `lucide-vue-next` | Enterprise icons |
| **Internationalization** | `vue-i18n` | Typed translations (Arabic RTL & English LTR) |
| **Build & Dev Tooling** | `vite`, `oxlint`, `eslint` | Fast HMR and code quality checks |

---

## 3. Architecture & Layers

### 3.1 Domain Layer (`src/domain/`)
- **Zero External Dependencies**: Pure TypeScript interfaces and types.
- **Models (`src/domain/models/`)**:
  - `user.model.ts`: `User`, `UserRole` ('ADMIN' | 'PROVIDER' | 'USER'), `AuthToken`, `Credentials`.
  - `marketplace.model.ts`: `MarketItem`, `MarketFilter`, `MarketStats`, `PaginationMeta`.
  - `common.model.ts`: `ApiResponse<T>`, `PaginatedResponse<T>`, `AppError`.
- **Ports (`src/domain/ports/`)**:
  - `auth-repository.port.ts`: `IAuthRepository` contract (`login`, `logout`, `refreshToken`, `getProfile`).
  - `marketplace-repository.port.ts`: `IMarketplaceRepository` contract (`getItems`, `getItemById`, `createItem`).

### 3.2 Infrastructure Layer (`src/infrastructure/`)
- **HTTP Client (`src/infrastructure/http/`)**:
  - `http-client.ts`: Custom fetch wrapper featuring:
    - Base URL configuration.
    - Automatic `Authorization: Bearer <token>` attachment.
    - 401 Auto-refresh queue (prevents concurrent refresh storms).
    - `AbortController` cancellation map.
    - Normalized error structure (`AppError`).
  - `token-store.ts`: Secure cookie / `localStorage` interface for JWT access and refresh tokens.
- **Feedback Subsystem (`src/infrastructure/feedback/`)**:
  - `toast.service.ts`: Reactive toast notifications queue (success, info, warning, error).
  - `confirm.service.ts`: Programmatic modal confirmation promise handler.

### 3.3 Data Layer (`src/data/`)
- **Repositories (`src/data/repositories/`)**:
  - `api-auth.repository.ts`: Implements `IAuthRepository` via `HttpClient`.
  - `api-marketplace.repository.ts`: Implements `IMarketplaceRepository` via `HttpClient` (with mock fallback for offline/development mode).

### 3.4 Application Layer (`src/application/`)
- **Services (`src/application/`)**:
  - `auth.service.ts`: Reactive authentication management (`currentUser`, `isAuthenticated`, `userRole`, `login()`, `logout()`, `checkAuth()`).
  - `marketplace.service.ts`: Reactive state management for marketplace (`items`, `activeItem`, `filters`, `loading`, `error`, `fetchItems()`).

### 3.5 Dependency Injection Container (`src/di/`)
- `container.ts`: Lightweight typed DI container with singleton lifecycle management.
- `index.ts`: Central registry wiring infrastructure, repositories, and application services, exporting typed `services` accessor.

### 3.6 UI Composables (`src/composables/`)
- `useAuth.ts`: Bridge to `AuthService` state and actions.
- `useMarketplace.ts`: Bridge to `MarketplaceService` with reactive filter debouncing.
- `useFeedback.ts`: Bridge to `ToastService` and `ConfirmService`.
- `useTheme.ts`: Dark/Light theme and multi-role theming.
- `useLocale.ts`: Arabic/English RTL/LTR dynamic switching.

### 3.7 Presentation Components (`src/components/` & `src/views/`)
- **UI Design System (`src/components/ui/`)**:
  - `AppButton.vue`: Polymorphic button with loading spinner, variants (`primary`, `secondary`, `danger`, `outline`, `ghost`).
  - `AppInput.vue`: Accessible form input with validation state and icon slots.
  - `DataState.vue`: State visualizer supporting `loading` (skeleton), `empty`, `error` (retry button), and default slot.
  - `ToastContainer.vue`: Animated notification toast view port.
  - `ConfirmDialog.vue`: Modal dialog bound to `ConfirmService`.
- **Layouts (`src/components/layout/`)**:
  - `AppShell.vue`: Top-level application frame.
  - `AppHeader.vue`: Branding, search bar, language switcher, user menu.
  - `AppSidebar.vue`: Role-aware navigation links with active state.
- **Views (`src/views/`)**:
  - `auth/LoginView.vue`: Authentication screen with demo credentials.
  - `marketplace/MarketplaceView.vue`: Full demonstration of Clean Architecture pipeline (Search, Filters, DataState, Grid, Detail Modal).
  - `admin/AdminDashboardView.vue`: Role-protected admin view.

### 3.8 Router & Security Guards (`src/router/`)
- `index.ts`: Vue Router configuration.
- `guards.ts`:
  - `authGuard`: Redirects unauthenticated users to `/auth/login`.
  - `roleGuard`: Ensures users possess matching roles for protected routes.
  - `titleGuard`: Sets browser document title with dynamic i18n keys.

---

## 4. Verification and Acceptance Criteria
1. `npm install` executes without errors.
2. `npm run type-check` (TypeScript verification) passes with 0 errors.
3. `npm run build` generates production bundle successfully.
4. Clean Architecture test: Modifying or mocking data layer requires 0 changes in presentation components.
