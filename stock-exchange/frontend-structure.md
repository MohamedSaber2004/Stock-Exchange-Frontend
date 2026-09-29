# 🏗️ Enterprise Frontend Architecture & Project Blueprint

> **معمارية هندسية احترافية لتطبيقات الويب الحديثة (Vue 3 / TypeScript / Clean Architecture)**  
> هذا الملف هو الدليل الشامل لهيكل المشروع وطبقته المعمارية، ومصمم ليكون **مرجعاً وقالب عمل (Reusable Blueprint)** يمكن تطبيقه على أي مشروع واجهات أمامية واسع النطاق (Enterprise-grade Frontend).

---

## 📑 جدول المحتويات (Table of Contents)
1. [النمط المعماري الأساسي (Architecture Style)](#-النمط-المعماري-الأساسي-architecture-style)
2. [الهيكل العام وشجرة المجلدات (Directory Tree)](#-الهيكل-العام-وشجرة-المجلدات-directory-tree)
3. [الشرح التفصيلي للطبقات والمسؤوليات (Layer-by-Layer Guide)](#-الشرح-التفصيلي-للطبقات-والمسؤوليات-layer-by-layer-guide)
4. [دورة حياة تدفق البيانات (Data Flow Lifecycle)](#-دورة-حياة-تدفق-البيانات-data-flow-lifecycle)
5. [حقن التبعيات (Dependency Injection - DI Container)](#-حقن-التبعيات-dependency-injection---di-container)
6. [إدارة الحالات وتجربة المستخدم (UI State & Feedback System)](#-إدارة-الحالات-وتجربة-المستخدم-ui-state--feedback-system)
7. [نظام التوجيه وحماية المسارات (Routing & Security Guards)](#-نظام-التوجيه-وحماية-المسارات-routing--security-guards)
8. [التدويل واللغات والسمات (i18n, RTL & Multi-Role Theming)](#-التدويل-واللغات-والسمات-i18n-rtl--multi-role-theming)
9. [دليل تطبيق هذا القالب في مشروع جديد (Starter Blueprint Guide)](#-دليل-تطبيق-هذا-القالب-في-مشروع-جديد-starter-blueprint-guide)
10. [أوامر التشغيل والاختبار (Scripts & Tooling)](#-أوامر-التشغيل-والاختبار-scripts--tooling)

---

## 🏛️ النمط المعماري الأساسي (Architecture Style)

يعتمد التطبيق على دمج متقدم بين:
- **Clean Architecture & Hexagonal Architecture (Ports & Adapters):** فصل كامل بين منطق العمل (Domain) وطبقات التنفيذ الخارجية (HTTP / UI).
- **Domain-Driven Design (DDD) Principles:** تقسيم النظام إلى نماذج بيانات (Models) ومستودعات (Repositories) وخدمات (Application Services) محددة السياق.
- **Dependency Injection (DI):** حاوية مركزية لتوليد وحقن الخدمات، مما يسهل كتابة اختبارات الوحدة (Unit Testing) وعزل التبعيات (Decoupling).

```
┌─────────────────────────────────────────────────────────────┐
│                   🖥️ Presentation Layer                     │
│              Views / Components / Composables               │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Calls Services)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   ⚙️ Application Layer                      │
│            Application Services & Reactive State            │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Implements/Uses)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     💎 Domain Layer                         │
│            Models, Entities, DTOs & Ports (Contracts)       │
└──────────────────────────────▲──────────────────────────────┘
                               │ (Implemented By)
┌──────────────────────────────┴──────────────────────────────┐
│             🔌 Data & Infrastructure Layer                  │
│       Repositories, HttpClient, TokenStore, Feedback        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 الهيكل العام وشجرة المجلدات (Directory Tree)

```text
├── .agents/                      # مهارات وقواعد الذكاء الاصطناعي (Agent skills & instructions)
├── .vscode/                       # إعدادات المحرر والإضافات المقترحة
├── docs/                          # وثائق المشروع والمواصفات الفنية
│   ├── plans/                     # خطط تنفيذ الميزات (Implementation Plans)
│   └── specs/                     # المواصفات الفنية والمتطلبات (Functional Specs)
├── public/                        # الملفات الثابتة والأيقونات (Static assets, logos, favicon)
├── src/                           # السورس كود البرمجي للتطبيق
│   ├── application/               # طبقة منطق التطبيق (Application Services & Business Logic)
│   ├── assets/                    # ملفات التصميم (Design Tokens, Global CSS, SVGs)
│   ├── components/                # مكونات الواجهة القابلة لإعادة الاستخدام
│   │   ├── account/               # مكونات خاصة بإدارة الحسابات
│   │   ├── auth/                  # مكونات التحقق والمصادقة (Login, Register, OTP)
│   │   ├── layout/                # هياكل الصفحات العامة (Header, Footer, Nav, Shells)
│   │   └── ui/                    # عناصر التصميم الذرية (Button, Input, Modal, DataState)
│   ├── composables/               # دوال ربط الواجهة بمنطق التطبيق (Vue Composables)
│   ├── config/                    # إعدادات الروابط والمتغيرات والبيئات (API Configs)
│   ├── data/                      # طبقة الوصول للبيانات (Data Layer)
│   │   └── repositories/          # التنفيذ الفعلي لـ Ports باستخدام الـ HTTP Client
│   ├── di/                        # حاوية حقن التبعيات (DI Container)
│   ├── domain/                    # طبقة الدومين الأساسية (Domain Core)
│   │   ├── models/                # نماذج البيانات والأنواع (TypeScript Types, Entities, DTOs)
│   │   └── ports/                 # واجهات وعقود المستودعات (Repository Interfaces)
│   ├── i18n/                      # محرك اللغات والترجمة (AR / EN) ودعم RTL/LTR
│   ├── infrastructure/            # البنية التحتية والاتصالات الخارجية
│   │   ├── feedback/              # خدمات تفاعل المستخدم (Toast, Modal, Confirm)
│   │   └── http/                  # عميل HTTP، إدارة التوكنات، واعتراض الأخطاء (HttpClient)
│   ├── motion/                    # مكتبة الحركات والانتقالات البصرية (Reveal & Micro-interactions)
│   ├── router/                    # نظام التوجيه وحماية المسارات (Vue Router + Guards)
│   ├── utils/                     # دوال مساعدة نقية (Formatting, Phone, Currencies, Roles)
│   ├── views/                     # صفحات التطبيق المصنفة حسب السياق الوظيفي
│   │   ├── account/               # شاشات الحساب والملف الشخصي
│   │   ├── admin/                 # لوحة تحكم المسؤول
│   │   ├── auth/                  # شاشات تسجيل الدخول واستعادة الحساب
│   │   ├── catalog/               # شاشات الكتالوج والمنتجات
│   │   ├── marketplace/           # شاشات المتجر والبحث والعروض
│   │   ├── provider/              # لوحة تحكم المزوّد والشركات
│   │   ├── quality/               # شاشات الجودة والشهادات
│   │   └── trade/                 # شاشات طلبات عروض الأسعار (RFQ) والمفاوضات
│   ├── App.vue                    # المكون الجذري للتطبيق
│   ├── main.ts                    # نقطة الانطلاق وتهيئة التطبيق (Bootstrap)
│   └── env.d.ts                   # تعريفات الأنواع لبيئة التطوير
├── tailwind.config.js             # إعدادات Tailwind CSS ونظام السمات
├── vite.config.ts                 # إعدادات Vite ومسارات الـ Proxy والـ Aliases
├── tsconfig.json                  # إعدادات مترجم TypeScript
└── package.json                   # الحزم والمكتبات والسكربتات
```

---

## 🔍 الشرح التفصيلي للطبقات والمسؤوليات (Layer-by-Layer Guide)

### 1️⃣ `src/domain/` (نواة العمل - Domain Core)
**المسؤولية:** قلب النظام الخالي تماماً من أي تبعية خارجية (لا يعتمد على Vue، Axios، أو أي إطار عمل).
- **`models/`**: يحتوي على كائنات الدومين، الـ DTOs، والـ Payloads (مثل `user.ts`, `marketplace.ts`, `company.ts`).
- **`ports/`**: يحتوي على الـ Interfaces (العقود) التي تعرّف الدوال المطلوبة دون كتابة سطر كود تنفيذي واحد (مثل `MarketplaceRepository`, `AuthRepository`).

---

### 2️⃣ `src/data/` (طبقة البيانات - Data Adapters)
**المسؤولية:** تنفيذ العقود (Ports) المحددة في طبقة الدومين من خلال الاتصال بالـ Backend.
- **`repositories/`**: فئات تطبيقية مثل `ApiMarketplaceRepository` التي تُطبق `MarketplaceRepository` وتستخدم `HttpClient` لإرسال الـ API Requests ومعالجة الاستجابات.

---

### 3️⃣ `src/infrastructure/` (البنية التحتية - Infrastructure)
**المسؤولية:** التعامل مع الأنظمة الخارجية والأجهزة وتفاصيل الشبكة.
- **`http/`**:
  - `http-client.ts`: عميل HTTP متقدم يدعم معالجة الـ Headers، التوكنات، تجديد الـ JWT تلقائياً عند انتهاء الصلاحية (401 Refresh Token flow)، وإلغاء الطلبات المتكررة (AbortController).
  - `token-store.ts` & `cookie-utils.ts`: إدارة حفظ واسترجاع رموز الدخول بأمان.
- **`feedback/`**:
  - `toast.service.ts`: إرسال إشعارات سريعة للمستخدم.
  - `confirm.service.ts`: فتح مربعات حوار للتأكيد قبل العمليات الحساسة (مثل الحذف).
  - `modal.service.ts`: التحكم في النوافذ المنبثقة برمجياً.

---

### 4️⃣ `src/application/` (منطق التطبيق - Application Services)
**المسؤولية:** تنسيق سير العمليات وإدارة الحالات التفاعلية (Reactive State) على مستوى التطبيق.
- كل خدمة (مثل `MarketplaceService`, `AuthService`) تحتوي على حالات تفاعلية (`ref`, `computed`) مثل `loading`, `error`, `data`, `pagination`.
- تستقبل الـ Repositories عبر الـ Constructor وتوفر دوالاً واضحة للواجهة.

---

### 5️⃣ `src/di/` (حاوية حقن التبعيات - Dependency Injection)
**المسؤولية:** إنشاء وربط جميع الخدمات والـ Repositories في مكان واحد (`container.ts`) بنمط Singleton.
- يمنع إنشاء نسخ مكررة من الكائنات ويسهل استبدال أي مستودع بنسخة Mock في الاختبارات.

---

### 6️⃣ `src/composables/` (جسر الواجهة - UI Composables)
**المسؤولية:** تزويد مكونات Vue بدوال تفاعلية تدمج بين الـ Application Services واحتياجات الـ UI.
- معالجة الـ Debounce أثناء البحث، ترتيب الفلاتر، وتسهيل التعامل مع النماذج.

---

### 7️⃣ `src/components/` & `src/views/` (طبقة العرض - Presentation Layer)
- **`components/ui/`:** مكتبة المكونات المشتركة للـ Design System:
  - `DataState.vue`: مكون شامل لإدارة حالات (Loading / Skeleton / Empty / Error / Ready).
  - `AppButton.vue`, `AppInput.vue`, `PhoneInput.vue`, `CurrencySelect.vue`, `ConfirmDialog.vue`, `ToastContainer.vue`.
- **`components/layout/`:** هياكل الواجهة الرئيسية (`AdminLayout`, `ProviderLayout`, `AppHeader`, `AppFooter`, `DashboardShell`).
- **`views/`:** صفحات التطبيق الكاملة المربوطة بالـ Routes، مقسمة حسب النطاق (Auth, Admin, Marketplace, Profile, etc.).

---

## 🔄 دورة حياة تدفق البيانات (Data Flow Lifecycle)

```
[User Action in View]
        │
        ▼
[Composable: useMarketplace()] ──> (Debounce / Input Sanitization)
        │
        ▼
[Application Service: MarketplaceService] ──> (Sets loading=true)
        │
        ▼
[Domain Port: MarketplaceRepository]
        │
        ▼
[Data Repo: ApiMarketplaceRepository]
        │
        ▼
[Infrastructure: HttpClient] ──> (Attaches Auth Bearer Token)
        │
        ▼
[Backend REST API / Gateway]
        │
        ▼
[Returns DTOs] ──> [Repo Maps Response] ──> [Service Updates Reactive State] ──> [DataState renders UI]
```

---

## 🧩 حقن التبعيات (Dependency Injection - DI Container)

يتم بناء وتسجيل جميع الطبقات داخل `src/di/container.ts`:

```typescript
// 1. تسجيل البنية التحتية
container.register(TokenStore, () => new TokenStore())
container.register(AuthBridge, () => new AuthBridge())
container.register(HttpClient, () => new HttpClient(container.resolve(TokenStore), container.resolve(AuthBridge)))

// 2. تسجيل المستودعات (Data Repositories)
container.register(ApiMarketplaceRepository, () => new ApiMarketplaceRepository(container.resolve(HttpClient)))

// 3. تسجيل خدمات التطبيق (Application Services)
container.register(MarketplaceService, () => new MarketplaceService(container.resolve(ApiMarketplaceRepository)))

// 4. تصدير الخدمات الجاهزة للاستخدام
export const services = {
  get marketplaceService() { return container.resolve(MarketplaceService) },
  get authService() { return container.resolve(AuthService) },
}
```

---

## 🛡️ نظام التوجيه وحماية المسارات (Routing & Security Guards)

يستخدم `src/router/index.ts` خاصية الـ `meta` للتحقق التلقائي من الصلاحيات وتغيير عناوين الصفحات:

- `requiresAuth: true`: يتطلب تسجيل الدخول للوصول.
- `guestOnly: true`: يمنع المستخدم المسجل من دخول صفحات الـ (Login / Register).
- `requiresAdmin: true`: مخصص فقط للمشرفين والمسؤولين.
- `requiresProvider: true`: مخصص فقط للشركات ومزودي الخدمات.
- `titleKey`: مفتاح الترجمة المستخدم لتحديث عنوان الصفحة (`document.title`) تلقائياً.

---

## 🌐 التدويل واللغات والسمات (i18n, RTL & Multi-Role Theming)

- **اللغات:** دعم ثنائي كامل (العربية والإنجليزية) بنظام كتابة TypeScript مع التحقق الصارم من المفاتيح (`src/i18n/`).
- **RTL / LTR:** تبديل اتجاه الصفحة والخطوط والمسافات ديناميكياً مع حفظ التفضيلات في الـ LocalStorage.
- **Multi-Role Theming:** نظام ألوان وسمات يتكيف حسب دور المستخدم الحالي (مشتري / مزود / مسؤول) عبر CSS Design Tokens.

---

## 🚀 دليل تطبيق هذا القالب في مشروع جديد (Starter Blueprint Guide)

عند بدء أي مشروع مستقبلي وتريد تطبيق نفس المعمارية:

1. **الخطوة 1: تهيئة المشروع**
   ```bash
   npm create vite@latest my-app -- --template vue-ts
   npm install vue-router tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
2. **الخطوة 2: إنشاء شجرة المجلدات الأساسية**
   ```bash
   mkdir -p src/{domain/{models,ports},data/repositories,infrastructure/{http,feedback},application,di,composables,components/{ui,layout},views,router,i18n,utils,config,assets}
   ```
3. **الخطوة 3: تطبيق مبدأ Ports & Adapters**
   - عرّف الـ Interfaces في `src/domain/ports/`.
   - نفذ الاتصال بالـ API في `src/data/repositories/`.
   - ابنِ المنطق التفاعلي في `src/application/`.
4. **الخطوة 4: تفعيل الـ DI Container**
   - أضف `src/di/container.ts` واربط فيه الـ `HttpClient` بالـ Repositories والـ Services.
5. **الخطوة 5: توحيد حالات الواجهة**
   - أنشئ مكون `DataState.vue` ومكونات الـ `Feedback` (`Toast`, `ConfirmDialog`) لضمان تناسق تجربة الاستخدام في كل الشاشات.

---

## ⚙️ أوامر التشغيل والاختبار (Scripts & Tooling)

| الأمر | الوصف |
| :--- | :--- |
| `npm run dev` | تشغيل خادم التطوير المحلي (Vite Dev Server) |
| `npm run build` | فحص الأنواع البرمجية وبناء المشروع للإنتاج (Production Build) |
| `npm run test` | تشغيل اختبارات الوحدة باستخدام (Vitest + JSDOM) |
| `npm run lint` | فحص وتصليح الأخطاء التنسيقية والكودية عبر (Oxlint + ESLint) |
| `npm run preview` | معاينة حزمة الإنتاج محلياً |

---

### 🌟 المميزات التي يوفرها هذا الهيكل:
- **قابلية صيانة لا نهائية (Maintainability):** تغيير الـ API أو مكتبة الـ HTTP لا يؤثر إطلاقاً على كود الـ UI.
- **سهولة الاختبار (Testability):** يمكنك اختبار أي Service عبر تمرير Mock Repository دون الحاجة لتشغيل خادم الـ API أو المتصفح.
- **سرعة التطوير والتعاون الجماعي (Team Scalability):** يمكن لفريق الـ UI وفريق الـ Logic العمل بالتوازي وبشكل مستقل تماماً بفضل العقود (Ports).
