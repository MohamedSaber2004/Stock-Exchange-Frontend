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

    // Dynamic document title
    const appName = 'FinWise Admin'
    document.title = to.meta.title ? `${String(to.meta.title)} | ${appName}` : appName

    // If route requires authentication and user is not logged in -> redirect to /login
    if (to.meta.requiresAuth && !isAuthenticated) {
      if (to.path !== '/login') {
        return next('/login')
      }
    }

    // If route is guest only (e.g. login) and user is already logged in -> redirect to dashboard /
    if (to.meta.guestOnly && isAuthenticated) {
      if (to.path !== '/') {
        return next('/')
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
