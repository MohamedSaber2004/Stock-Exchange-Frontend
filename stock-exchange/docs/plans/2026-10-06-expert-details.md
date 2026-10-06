# Expert Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Expert Details view (`/experts/:id`), integrate it with the router, update `ExpertsListView.vue` with view details navigation, and verify complete backend compatibility.

**Architecture:** Standard Vue 3 (Composition API) view using existing Clean Architecture abstractions (`coreServices.experts`, `MobileDeviceFrame.vue`, `ImageUploader.vue`, `PageHeader.vue`, `DataState.vue`), supporting full bilingual display and mobile card preview.

**Tech Stack:** Vue 3.5, TypeScript, Tailwind CSS v4, Vue Router 4, Vue I18n 9, Lucide Vue Next.

---

### File Structure Map
- Modify: `src/i18n/locales/ar.ts` (Add localization keys for expert details and actions)
- Modify: `src/i18n/locales/en.ts` (Add localization keys for expert details and actions)
- Modify: `src/router/index.ts` (Register `/experts/:id` route)
- Create: `src/views/experts/ExpertDetailsView.vue` (Complete expert details view with bilingual info, status toggles, edit modal, and mobile card preview)
- Modify: `src/views/experts/ExpertsListView.vue` (Add View Details action in ActionMenu and make row avatar/name clickable)

---

### Task 1: Add Localization Strings

**Files:**
- Modify: `src/i18n/locales/ar.ts`
- Modify: `src/i18n/locales/en.ts`

- [ ] **Step 1: Update `src/i18n/locales/ar.ts`**
Add missing translation keys under the `experts` object:
```ts
viewDetails: 'عرض التفاصيل',
expertDetails: 'تفاصيل الخبير',
expertDetailsSubtitle: 'عرض وإدارة ملف الخبير والمعلومات المهنية وحالة الظهور',
profileCard: 'الملف التعريفي',
bilingualInfo: 'المعلومات باللغتين',
metadataCard: 'معلومات النظام',
mobilePreviewTitle: 'معاينة في تطبيق الموبايل',
mobilePreviewSubtitle: 'مظهر بطاقة الخبير كما تظهر للمستخدمين في التطبيق',
copyId: 'نسخ المعرف',
copiedId: 'تم نسخ المعرف بنجاح',
toggleFeaturedSuccess: 'تم تحديث حالة التمييز بنجاح',
toggleActiveSuccess: 'تم تحديث حالة التفعيل بنجاح',
notFoundTitle: 'الخبير غير موجود',
notFoundDesc: 'تعذر العثور على بيانات الخبير المطلوب، ربما تم حذفه.',
backToExperts: 'العودة لقائمة الخبراء',
```

- [ ] **Step 2: Update `src/i18n/locales/en.ts`**
Add matching keys under `experts` in `src/i18n/locales/en.ts`:
```ts
viewDetails: 'View Details',
expertDetails: 'Expert Details',
expertDetailsSubtitle: 'View and manage expert profile, professional title, and display status',
profileCard: 'Profile Overview',
bilingualInfo: 'Bilingual Information',
metadataCard: 'System Metadata',
mobilePreviewTitle: 'Mobile App Preview',
mobilePreviewSubtitle: 'Live preview of the expert card as seen by users in the mobile app',
copyId: 'Copy ID',
copiedId: 'ID copied to clipboard',
toggleFeaturedSuccess: 'Featured status updated successfully',
toggleActiveSuccess: 'Active status updated successfully',
notFoundTitle: 'Expert Not Found',
notFoundDesc: 'Could not find the requested expert, it may have been removed.',
backToExperts: 'Back to Experts',
```

- [ ] **Step 3: Verify TypeScript syntax**
Run `npm run type-check` to ensure no syntax errors in locales.

---

### Task 2: Register Expert Details Route

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1: Add route to `src/router/index.ts`**
Directly under the `/experts` route, register:
```ts
  // Expert Details
  {
    path: '/experts/:id',
    name: 'expert-details',
    component: () => import('@/views/experts/ExpertDetailsView.vue'),
    meta: { title: 'Expert Details', requiresAuth: true },
  },
```

- [ ] **Step 2: Verify type check**
Run `npm run type-check`.

---

### Task 3: Create `src/views/experts/ExpertDetailsView.vue`

**Files:**
- Create: `src/views/experts/ExpertDetailsView.vue`

- [ ] **Step 1: Write `ExpertDetailsView.vue` component**
The component must include:
1. Script setup with:
   - Route param extraction (`id`).
   - Loading `expert` via `coreServices.experts.getById(expertId)`.
   - Toggle methods for `isActive` and `isFeaturedOnHome` using `coreServices.experts.update`.
   - Delete handler using `confirm` dialog and redirect to `/experts`.
   - Edit modal state, form validation, and submit handler calling `coreServices.experts.update`.
   - Copy ID to clipboard utility.
2. Template with:
   - `AppShell` and back button to `/experts`.
   - `DataState` for loading, error, empty/not-found.
   - Header with status badges and Edit/Delete buttons.
   - 2-Column responsive grid:
     - Left column: Profile card (avatar, names, quick toggles), bilingual tabs (Ar / En), System metadata (ID with copy button, display order, creation date).
     - Right column: `MobileDeviceFrame` rendering the live mobile card (avatar, full name, professional title, "Featured" badge).
   - Edit Modal with `ImageUploader`, bilingual inputs, display order, toggles, and submit/cancel buttons.

- [ ] **Step 2: Verify type check**
Run `npm run type-check`.

---

### Task 4: Integrate Details Navigation into `ExpertsListView.vue`

**Files:**
- Modify: `src/views/experts/ExpertsListView.vue`

- [ ] **Step 1: Add Router Navigation & Update ActionMenu**
1. Import `useRouter` from `vue-router`.
2. Add `goToDetails(id: string)` method: `router.push(/experts/${id})`.
3. In `handleAction`, add case for `'view'`: `goToDetails(item.id)`.
4. Update `ActionMenu` items array:
```ts
[
  { id: 'view', label: t('experts.viewDetails') },
  { id: 'edit', label: t('common.edit') },
  { id: 'delete', label: t('common.delete'), danger: true }
]
```
5. Wrap expert avatar and name in a clickable row that navigates to details.

- [ ] **Step 2: Verify type check**
Run `npm run type-check`.

---

### Task 5: Full Project Verification & Build Check

**Files:**
- All touched files.

- [ ] **Step 1: Run type check and lint**
Run: `npm run type-check`
Expected: 0 errors.

- [ ] **Step 2: Run production build**
Run: `npm run build`
Expected: Build succeeds cleanly.
