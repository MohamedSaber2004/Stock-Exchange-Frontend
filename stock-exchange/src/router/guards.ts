import type { Router } from 'vue-router'
import { coreServices } from '@/di'
import { useRouteLoading } from '@/composables/useRouteLoading'

export function setupRouterGuards(router: Router): void {
  const routeLoading = useRouteLoading()

  router.beforeEach((to, from, next) => {
    // Only trigger progress if navigating to a different path
    if (to.path !== from.path) {
      routeLoading.start(to.meta.title ? String(to.meta.title) : undefined)
    }

    const tokenStore = coreServices.tokenStore
    const isAuthenticated = tokenStore.hasValidToken()
    const isAdmin = tokenStore.isAdmin()

    // Dynamic document title
    const appName = 'FinWise Admin'
    document.title = to.meta.title ? `${String(to.meta.title)} | ${appName}` : appName

    // 1. If route requires authentication:
    if (to.meta.requiresAuth) {
      if (!isAuthenticated) {
        if (to.path !== '/login') {
          return next({ path: '/login', query: { redirect: to.fullPath } })
        }
      } else if (!isAdmin) {
        // Authenticated user is NOT an admin
        tokenStore.clear()
        coreServices.toast.error(
          'عفواً، لا تملك الصلاحيات الكافية للوصول إلى لوحة التحكم.',
          'غير مصرح'
        )
        return next('/login?forbidden=true')
      }
    }

    // 2. If route is guest only (e.g. login) and user is already logged in as Admin -> redirect to /
    if (to.meta.guestOnly && isAuthenticated) {
      if (isAdmin) {
        if (to.path !== '/') {
          return next('/')
        }
      } else {
        // Clear invalid non-admin session
        tokenStore.clear()
      }
    }

    next()
  })

  router.afterEach((to) => {
    // Finish route loading with a smooth transition
    setTimeout(() => {
      routeLoading.finish(to.meta.title ? String(to.meta.title) : undefined)
    }, 120)
  })

  router.onError(() => {
    routeLoading.fail()
  })
}
