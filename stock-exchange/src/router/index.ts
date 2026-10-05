import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { setupRouterGuards } from './guards'

const routes: RouteRecordRaw[] = [
  // 01. Login
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Sign In', guestOnly: true },
  },

  // 01b. Forgot Password
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
    meta: { title: 'Forgot Password', guestOnly: true },
  },

  // 01c. Verify OTP
  {
    path: '/verify-otp',
    name: 'verify-otp',
    component: () => import('@/views/auth/VerifyOtpView.vue'),
    meta: { title: 'Verify OTP', guestOnly: true },
  },

  // 01d. Reset Password
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { title: 'Reset Password', guestOnly: true },
  },

  // 02. Dashboard Overview
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard', requiresAuth: true },
  },

  // 03. Articles List
  {
    path: '/articles',
    name: 'articles',
    component: () => import('@/views/articles/ArticlesListView.vue'),
    meta: { title: 'Articles', requiresAuth: true },
  },

  // 04. Create Article
  {
    path: '/articles/create',
    name: 'create-article',
    component: () => import('@/views/articles/CreateArticleView.vue'),
    meta: { title: 'Create Article', requiresAuth: true },
  },

  // 05. Edit Article
  {
    path: '/articles/:id/edit',
    name: 'edit-article',
    component: () => import('@/views/articles/EditArticleView.vue'),
    meta: { title: 'Edit Article', requiresAuth: true },
  },

  // 05b. Article Details
  {
    path: '/articles/:id',
    name: 'article-details',
    component: () => import('@/views/articles/ArticleDetailsView.vue'),
    meta: { title: 'Article Details', requiresAuth: true },
  },

  // 06. Videos List
  {
    path: '/videos',
    name: 'videos',
    component: () => import('@/views/videos/VideosListView.vue'),
    meta: { title: 'Videos', requiresAuth: true },
  },

  // 07. Create Video
  {
    path: '/videos/create',
    name: 'create-video',
    component: () => import('@/views/videos/CreateVideoView.vue'),
    meta: { title: 'Add Video', requiresAuth: true },
  },

  // 08. Edit Video
  {
    path: '/videos/:id/edit',
    name: 'edit-video',
    component: () => import('@/views/videos/EditVideoView.vue'),
    meta: { title: 'Edit Video', requiresAuth: true },
  },

  // 08b. Video Details
  {
    path: '/videos/:id',
    name: 'video-details',
    component: () => import('@/views/videos/VideoDetailsView.vue'),
    meta: { title: 'Video Details', requiresAuth: true },
  },

  // 09. Market News List
  {
    path: '/news',
    name: 'news',
    component: () => import('@/views/news/NewsListView.vue'),
    meta: { title: 'Market News', requiresAuth: true },
  },

  // 10. Create News
  {
    path: '/news/create',
    name: 'create-news',
    component: () => import('@/views/news/CreateNewsView.vue'),
    meta: { title: 'Post Market News', requiresAuth: true },
  },

  // 10a. Edit News
  {
    path: '/news/:id/edit',
    name: 'edit-news',
    component: () => import('@/views/news/EditNewsView.vue'),
    meta: { title: 'Edit Market News', requiresAuth: true },
  },

  // 10b. News Details
  {
    path: '/news/:id',
    name: 'news-details',
    component: () => import('@/views/news/NewsDetailsView.vue'),
    meta: { title: 'News Details', requiresAuth: true },
  },

  // Services Management
  {
    path: '/services',
    name: 'services',
    component: () => import('@/views/services/ServicesListView.vue'),
    meta: { title: 'Services', requiresAuth: true },
  },

  // Service Details
  {
    path: '/services/:id',
    name: 'service-details',
    component: () => import('@/views/services/ServiceDetailsView.vue'),
    meta: { title: 'Service Details', requiresAuth: true },
  },

  // Experts Management
  {
    path: '/experts',
    name: 'experts',
    component: () => import('@/views/experts/ExpertsListView.vue'),
    meta: { title: 'Our Experts', requiresAuth: true },
  },

  // 10b. Categories Management
  {
    path: '/categories',
    name: 'categories',
    component: () => import('@/views/categories/CategoriesManagementView.vue'),
    meta: { title: 'Categories Management', requiresAuth: true },
  },
  {
    path: '/categories/articles',
    redirect: { path: '/categories', query: { tab: 'articles' } },
  },
  {
    path: '/categories/videos',
    redirect: { path: '/categories', query: { tab: 'videos' } },
  },

  // Redirect removed subscription routes to dashboard
  {
    path: '/subscriptions',
    redirect: '/',
  },
  {
    path: '/subscriptions/create',
    redirect: '/',
  },
  {
    path: '/subscriptions/permissions',
    redirect: '/',
  },
  {
    path: '/permissions',
    redirect: '/',
  },

  // 13. Users List
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/users/UsersListView.vue'),
    meta: { title: 'Users', requiresAuth: true },
  },

  // 14. User Details / Edit
  {
    path: '/users/:id',
    name: 'user-details',
    component: () => import('@/views/users/UserDetailsView.vue'),
    meta: { title: 'User Details', requiresAuth: true },
  },

  // 15. Help Center
  {
    path: '/help-center',
    name: 'help-center',
    component: () => import('@/views/help-center/HelpCenterView.vue'),
    meta: { title: 'Help Center & FAQ', requiresAuth: true },
  },

  // 16. Terms & Conditions
  {
    path: '/terms',
    name: 'terms',
    component: () => import('@/views/legal/TermsAndConditionsView.vue'),
    meta: { title: 'Terms & Conditions', requiresAuth: true },
  },

  // 16b. Privacy Policy
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('@/views/legal/PrivacyPolicyView.vue'),
    meta: { title: 'Privacy Policy', requiresAuth: true },
  },

  // 17. About FinWise
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/about/AboutView.vue'),
    meta: { title: 'About FinWise', requiresAuth: true },
  },

  // 17. Profile & Settings
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/settings/SettingsView.vue'),
    meta: { title: 'Profile / Settings', requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    redirect: '/settings',
  },

  // 18. Activity / Audit Log
  {
    path: '/activity',
    name: 'activity',
    component: () => import('@/views/activity/ActivityListView.vue'),
    meta: { title: 'Activity Log', requiresAuth: true },
  },

  // 19. Countries Management
  {
    path: '/countries',
    name: 'countries',
    component: () => import('@/views/countries/CountriesListView.vue'),
    meta: { title: 'Country Management', requiresAuth: true },
  },

  // 20. Notifications
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/views/notifications/NotificationsView.vue'),
    meta: { title: 'Notifications', requiresAuth: true },
  },

  // Catch-all 404 redirect
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

setupRouterGuards(router)
