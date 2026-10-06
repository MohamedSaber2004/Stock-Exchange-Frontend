# Expert Details View Design Specification

**Date:** 2026-10-06  
**Status:** Approved  
**Author:** Pair Programming Agent  

---

## 1. Overview & Objectives
Provide an administrative view for inspecting and managing details of a single market expert in the Stock Exchange Admin portal. This matches the standard Clean Architecture patterns and visual conventions established in `ServiceDetailsView.vue` and `ArticleDetailsView.vue`.

---

## 2. Backend Readiness Verification
- **Solution:** `E:\Stock Exchange\Stock Exchange\Stock Exchange.slnx`
- **Controller:** `ExpertsController.cs` in `Stock_Exchange.Controllers.V1`
  - `GET /api/v1/experts/{id}` (queries `GetExpertByIdQuery`, returns `ApiResponse<ExpertDto>`).
  - `PUT /api/v1/experts/{id}` (executes `UpdateExpertCommand`).
  - `DELETE /api/v1/experts/{id}` (executes `DeleteExpertCommand`).
- **Data Model:** `ExpertDto` containing:
  - `id`: UUID string
  - `fullNameEn`: string
  - `fullNameAr`: string
  - `titleEn`: string
  - `titleAr`: string
  - `avatarUrl`: optional string/null
  - `displayOrder`: number
  - `isFeaturedOnHome`: boolean
  - `isActive`: boolean
  - `createdAt`: ISO 8601 string
- **Verification Status:** Solution builds cleanly with 0 Errors and 0 Warnings.

---

## 3. Frontend Architecture & Components

### 3.1 Repository & Models
- `src/domain/models/expert.model.ts` already defines `ExpertDto`, `CreateExpertPayload`, and `UpdateExpertPayload`.
- `src/data/repositories/expert.repository.ts` already implements `getById(id: string)`, `update(id, payload)`, and `delete(id)`.
- `src/di/index.ts` exposes `coreServices.experts`.

### 3.2 View: `ExpertDetailsView.vue`
- **Path:** `src/views/experts/ExpertDetailsView.vue`
- **Layout & Structure:**
  - Standard `AppShell` with back navigation arrow and breadcrumbs.
  - Page header with expert display name, status badges (`Active` / `Inactive`, `Featured on Home`).
  - Action buttons in header: **Edit Expert** (opens modal) and **Delete Expert** (triggers confirmation dialog).
  - Main grid (2 columns on large screens):
    - **Left Column (Details & Metadata):**
      - Hero Profile Card with high-resolution avatar display, full names, job titles, and quick-toggle switches for `isActive` and `isFeaturedOnHome`.
      - Bilingual Details Card with tabs (`العربية` / `English`) for `fullName` and `title`.
      - Metadata Card showing `Display Order`, `Created At` (formatted according to locale), and `Expert ID` with a copy-to-clipboard action.
    - **Right Column (Interactive Mobile Preview):**
      - Embedding `MobileDeviceFrame.vue`.
      - Presenting the live card of the expert as seen by end-users in the mobile app.
- **Edit Modal:**
  - Built-in edit modal supporting avatar uploading via `ImageUploader.vue`, bilingual names and titles, display order, and featured/active toggles.
  - Upon successful edit, refetches details and notifies via feedback toast.
- **State Handling:**
  - `DataState.vue` handles `isLoading`, error states with retry, and empty/not-found states.

### 3.3 List View Integration: `ExpertsListView.vue`
- Update table rows to allow navigation to `/experts/${expert.id}` by clicking on the expert avatar/name.
- Update `ActionMenu` to include `viewDetails` action linking to `/experts/${expert.id}`.

### 3.4 Routing: `src/router/index.ts`
- Add route:
  ```ts
  {
    path: '/experts/:id',
    name: 'expert-details',
    component: () => import('@/views/experts/ExpertDetailsView.vue'),
    meta: { title: 'Expert Details', requiresAuth: true },
  }
  ```

### 3.5 Localization: `src/i18n/locales/ar.ts` & `en.ts`
- Add `viewDetails`, `expertDetails`, and related labels under `experts` namespace in both English and Arabic translations.

---

## 4. Error Handling & Edge Cases
- **Expert Not Found:** If the ID does not exist or was deleted, `DataState` renders a clear not-found state with a button to return to `/experts`.
- **Image Fallback:** Uses `resolveAttachmentUrl` with fallback to `handleImageError` and generic user icon placeholder.
- **Network Failures:** Caught in `try/catch`, surfaces user-friendly localized error messages via `useFeedback` toast.
