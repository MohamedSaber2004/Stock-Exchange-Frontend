# 📊 FinWise (البورصة) — Admin Dashboard CRUD Specification & Architecture Guide

> **Clean, production-ready Admin Dashboard architecture and full CRUD implementation guide for the FinWise (البورصة) financial education and market knowledge mobile platform.**
>
> *Designed specifically for complete back-office CRUD management without any third-party streaming servers, broker integrations, or complex real-time infrastructure.*

---

## 📑 Table of Contents

1. [Platform Overview & Core Purpose](#-1-platform-overview--core-purpose)
2. [Figma Mobile App Feature Breakdown](#-2-figma-mobile-app-feature-breakdown)
3. [Admin Dashboard CRUD Architecture (Vue 3 + TypeScript)](#-3-admin-dashboard-crud-architecture-vue-3--typescript)
4. [Design System & UI Tokens (Jade Theme)](#-4-design-system--ui-tokens-jade-theme)
5. [Complete Admin CRUD Management Modules](#-5-complete-admin-crud-management-modules)
   - [5.1 Authentication Module (Login, Session, Logout)](#51-authentication-module)
   - [5.2 Dashboard Overview (Stats & Recent Activity)](#52-dashboard-overview)
   - [5.3 Articles Management CRUD](#53-articles-management-crud)
   - [5.4 Video Lessons Management CRUD](#54-video-lessons-management-crud)
   - [5.5 Market News & Highlights CRUD](#55-market-news--highlights-crud)
   - [5.6 Subscription Plans CRUD](#56-subscription-plans-crud)
   - [5.7 Users & Subscriptions Management](#57-users--subscriptions-management)
   - [5.8 App Content & Settings CRUD (Onboarding & About Us)](#58-app-content--settings-crud)
6. [Data Models & TypeScript Interfaces](#-6-data-models--typescript-interfaces)
7. [Step-by-Step Implementation Plan](#-7-step-by-step-implementation-plan)

---

## 🌟 1. Platform Overview & Core Purpose

The **FinWise Admin Dashboard** is a dedicated **Back-Office Management Portal (CRUD)**. 

The Admin is the single source of truth for all content displayed in the FinWise mobile application. There are **no external API integrations, no broker feeds, and no video streaming servers**:

- **Articles & Guides**: Admin creates, reads, updates, and deletes financial educational articles and assigns them to free or premium tiers.
- **Videos**: Admin adds video entries with standard video URLs (YouTube/Vimeo/Direct MP4 link), title, duration, educator name, and access tier.
- **Market News & Banners**: Admin writes and publishes market news, custom rally percentage cards (e.g., `+18%`), and trending updates.
- **Plans & Pricing**: Admin manages plan cards, prices in EGP (e.g. 200 EGP/mo), and feature checklists.
- **Users**: Admin views registered users, updates subscription statuses, and manages account access.
- **App Configuration**: Admin updates the 3 onboarding slides and the "About Us" FinWise text.

```
┌────────────────────────────────────────────────────────────────────────┐
│               FinWise (البورصة) Admin Management CRUD                  │
└────────────────────────────────────────────────────────────────────────┘
                                   │
                (Direct Admin CRUD via Dashboard UI)
                                   │
 ┌───────────────┬─────────────────┼─────────────────┬─────────────────┐
 ▼               ▼                 ▼                 ▼                 ▼
Articles       Videos         Market News          Plans             Users
 CRUD           CRUD             CRUD              CRUD              CRUD
 │               │                 │                 │                 │
 └───────────────┴─────────────────┼─────────────────┴─────────────────┘
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │       FinWise Mobile Application          │
             │     (Consumes Admin CRUD Data via API)    │
             └───────────────────────────────────────────┘
```

---

## 📱 2. Figma Mobile App Feature Breakdown

From the Figma mobile design (`03SZswJY9MovCoX4zbaELY` / `app_البورصه`), here are the core screens and the corresponding Admin CRUD data they require:

| Mobile Screen | Figma Node | Data Needed from Admin CRUD |
| :--- | :--- | :--- |
| **Onboarding 1, 2, 3** | `181:2488` | Onboarding slides (Title, Description, Badge text, Step order). |
| **Home Screen** | `181:2903` | Greeting, Top market rally card (`+18%`), Breaking News list, Recent Articles & Videos. |
| **Articles Feed & Details** | `181:2816`, `181:3442` | Article title, category, reading time, author, markdown content, paywall tier flag (`Free` vs `Paid`). |
| **Videos Feed & Details** | `181:2414`, `181:3581` | Video title, video link, thumbnail, duration string (`15:30`), educator bio (*Ali Hussien*), paywall tier. |
| **Subscription Plans** | `181:3348` | Plan names (*Free, Basic, Pro*), monthly price (*200 EGP*), list of perks. |
| **User Profile & Subscription** | `181:2702`, `181:2342` | User details, assigned subscription plan, expiration date. |
| **About Us** | `309:1439` | FinWise mission text, core feature bullet points, contact info. |

---

## 🏗️ 3. Admin Dashboard CRUD Architecture (Vue 3 + TypeScript)

The admin frontend is structured with standard **Clean Architecture** to keep CRUD services, data tables, and forms decoupled, maintainable, and type-safe:

```
src/
├── domain/                      # Types & Entity Definitions
│   ├── models/                  # User, Article, Video, News, Plan, AppSetting
│   └── ports/                   # Repository CRUD interfaces
├── infrastructure/              # API Client & CRUD Repositories
│   ├── api/                     # Axios client & mock data handlers
│   └── repositories/            # Concrete CRUD implementations
├── composables/                 # Reusable CRUD hooks (useArticlesCrud, useVideosCrud, etc.)
├── components/                  # UI Components
│   ├── ui/                      # DataTable, Modal, FormInput, Select, Button, Badge, ConfirmDialog
│   └── layout/                  # AppShell, AppSidebar, AppHeader
├── views/                       # Admin CRUD Views
│   ├── auth/                    # LoginView.vue
│   ├── dashboard/               # OverviewDashboardView.vue
│   ├── articles/                # ArticlesListView.vue, ArticleFormModal.vue
│   ├── videos/                  # VideosListView.vue, VideoFormModal.vue
│   ├── news/                    # MarketNewsListView.vue, NewsFormModal.vue
│   ├── plans/                   # PlansListView.vue, PlanFormModal.vue
│   ├── users/                   # UsersListView.vue, UserEditModal.vue
│   └── settings/                # OnboardingSettingsView.vue, AboutUsSettingsView.vue
└── router/                      # Route definitions and auth protection
```

---

## 🎨 4. Design System & UI Tokens (Jade Theme)

The admin dashboard matches the mobile app's brand identity with a clean, modern **Jade / Emerald Green** theme:

- **Primary Brand Color**: `Jade #10B981` (Hover: `#059669`, Dark: `#064E3B`, Light: `#ECFDF5`)
- **Dark Surface Background**: `#0F172A` (Slate 900)
- **Card & Modal Surface**: `#1E293B` (Slate 800)
- **Table Border & Dividers**: `#334155` (Slate 700)
- **Typography**: Inter / Outfit (Clean, modern, highly legible tabular data)

---

## 💻 5. Complete Admin CRUD Management Modules

### 5.1 Authentication Module
- **View**: `LoginView.vue`
- **Fields**: Email, Password.
- **Actions**:
  - Admin login with token storage (`localStorage`).
  - Route guard protecting all admin dashboard routes.
  - Quick logout action in header/sidebar.

---

### 5.2 Dashboard Overview
- **View**: `OverviewDashboardView.vue`
- **Widgets**:
  - **Quick Counts**: Total Articles, Total Videos, Total Published News, Total Active Users, Total Subscribed Users.
  - **Recent Activity Table**: Latest added articles, newly registered users, and recent plan purchases.
  - **Quick Action Buttons**: "+ New Article", "+ New Video", "+ Post News".

---

### 5.3 Articles Management CRUD
- **Views**: `ArticlesListView.vue`, `ArticleFormModal.vue`
- **Data Table Columns**: Title, Category, Author, Access Tier, Read Time, Published Date, Status, Actions (Edit, Delete, Toggle Publish).
- **Create / Edit Form Fields**:
  - **Title** (Text)
  - **Category** (Dropdown: *Beginner, Technical Analysis, Fundamental Analysis, Market News, Investing Basics, Economy*)
  - **Author Name** (Text, e.g. *Maryam Ali*)
  - **Author Role / Title** (Text, e.g. *Financial Analyst*)
  - **Reading Time** (Number, e.g. *6 min read*)
  - **Access Tier** (Radio: `Free (Public)` vs `Paid / Basic Plan`)
  - **Cover Image URL** (Text / File upload)
  - **Content Body** (Rich Text / Markdown area with bold, headings, quote blocks)
  - **Status** (Draft / Published)

---

### 5.4 Video Lessons Management CRUD
- **Views**: `VideosListView.vue`, `VideoFormModal.vue`
- **Data Table Columns**: Thumbnail, Title, Category, Educator, Duration, Tier, Actions (Edit, Delete).
- **Create / Edit Form Fields**:
  - **Title** (Text, e.g. *Investing 101: Where to Start*)
  - **Category** (Dropdown: *Beginner, Technical Analysis, etc.*)
  - **Educator Name** (Text, e.g. *Ali Hussien*)
  - **Educator Title** (Text, e.g. *Financial Educator · FinLearn*)
  - **Duration** (Text, e.g. *15:30*)
  - **Video URL** (Text, direct MP4 link or YouTube/Vimeo embed URL)
  - **Thumbnail Image URL** (Text)
  - **Access Tier** (Radio: `Free Preview` vs `Paid Subscription Only`)
  - **Description** (Textarea)

---

### 5.5 Market News & Highlights CRUD
- **Views**: `MarketNewsListView.vue`, `NewsFormModal.vue`
- **Data Table Columns**: Headline, Category Badge, Rally % Tag, Publish Time, Actions (Edit, Delete).
- **Create / Edit Form Fields**:
  - **Headline / Title** (Text, e.g. *Global markets rally as inflation cools for third straight month*)
  - **Rally Percentage Tag** (Optional Text, e.g. `+18%` or `+3.2%` for the mobile home banner)
  - **Badge Label** (Text, e.g. *LIVE*, *Market News*, *Breaking*)
  - **Summary / Body** (Textarea)
  - **Source** (Text, e.g. *FinWise Research Team*)
  - **Pin to Home Banner** (Checkbox: `Show as Top Banner on Mobile Home`)

---

### 5.6 Subscription Plans CRUD
- **Views**: `PlansListView.vue`, `PlanFormModal.vue`
- **Data Table Columns**: Plan Name, Monthly Price, Currency, Badge, Status, Actions (Edit, Delete).
- **Create / Edit Form Fields**:
  - **Plan Name** (Text, e.g. *Free*, *Basic Plan*, *Pro Plan*)
  - **Price Monthly** (Number, e.g. *200*)
  - **Currency** (Dropdown: *EGP*, *USD*)
  - **Benefits / Features List** (Dynamic list input: *e.g. "Daily market news", "Unlimited videos", "Community access"*).
  - **Is Most Popular Badge** (Checkbox)
  - **Active Status** (Toggle)

---

### 5.7 Users & Subscriptions Management
- **Views**: `UsersListView.vue`, `UserEditModal.vue`
- **Data Table Columns**: User Name, Email, Registered Date, Current Plan, Subscription Status, Actions (Edit Plan, Deactivate).
- **Edit User Modal**:
  - View User Information (*Name, Email, Phone*).
  - Assign / Change Subscription Plan (*Free, Basic, Pro*).
  - Update Subscription Expiration Date.
  - Toggle Account Active / Suspended status.

---

### 5.8 App Content & Settings CRUD
- **Views**: `OnboardingSettingsView.vue`, `AboutUsSettingsView.vue`
- **Onboarding Slides Editor**:
  - Edit Slide 1, 2, 3: Title, Subtitle/Description, Step Badge.
- **About Us (FinWise) Editor**:
  - **Mission Text**: Paragraph explaining FinWise's mission.
  - **Core Features List**: 4 key bullet points shown on mobile.
  - **Contact Details**: Support email, website, and social links.

---

## 💾 6. Data Models & TypeScript Interfaces

```typescript
// 1. Article Model
export interface Article {
  id: string;
  title: string;
  category: string;
  authorName: string;
  authorTitle: string;
  readDuration: string; // "6 min read"
  accessTier: 'FREE' | 'PAID';
  coverImageUrl: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string;
}

// 2. Video Lesson Model
export interface VideoLesson {
  id: string;
  title: string;
  category: string;
  educatorName: string;
  educatorTitle: string;
  duration: string; // "15:30"
  videoUrl: string;
  thumbnailUrl: string;
  accessTier: 'FREE' | 'PAID';
  description: string;
  createdAt: string;
}

// 3. Market News Item
export interface MarketNews {
  id: string;
  headline: string;
  summary: string;
  rallyPercentage?: string; // "+18%"
  badge: string; // "LIVE"
  source: string;
  isPinnedBanner: boolean;
  publishedAt: string;
}

// 4. Subscription Plan
export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string; // "EGP"
  benefits: string[];
  isPopular: boolean;
  isActive: boolean;
}

// 5. User Account
export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  planName: 'Free' | 'Basic' | 'Pro';
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
}

// 6. App Static Settings
export interface AppSettings {
  onboardingSlides: Array<{
    id: number;
    title: string;
    description: string;
    badge: string;
  }>;
  aboutUs: {
    missionStatement: string;
    features: string[];
    websiteUrl: string;
    supportEmail: string;
  };
}
```

---

## 🚀 7. Step-by-Step Implementation Plan

1. **Step 1: Layout & Design System Setup**
   - Configure Tailwind v4 with the Jade Emerald palette (`#10B981`).
   - Implement `AppSidebar`, `AppHeader`, and `AppShell` with navigation links to all CRUD sections.
2. **Step 2: Authentication & Dashboard**
   - Create `LoginView.vue` with mock/API credentials.
   - Create `OverviewDashboardView.vue` with key count cards and recent tables.
3. **Step 3: Articles & Videos CRUD**
   - Build `ArticlesListView.vue` with search, filter, and `ArticleFormModal.vue`.
   - Build `VideosListView.vue` with video form modal for URL, duration, and educator details.
4. **Step 4: Market News & Plans CRUD**
   - Build `MarketNewsListView.vue` for publishing breaking news and rally percentage banners.
   - Build `PlansListView.vue` for updating plan prices (EGP) and benefit checklists.
5. **Step 5: Users & Settings CRUD**
   - Build `UsersListView.vue` for subscriber overview and plan status assignment.
   - Build `SettingsView.vue` for editing Onboarding and About Us text.

---
*FinWise Admin CRUD Dashboard — Clean, simple, and complete management for all mobile features.*
